use crate::manga::{get_panel_image_dimensions, split_path_parts, MangaFolder, MangaPanel};
use chrono::Datelike;
use chrono::{Local, NaiveDateTime};
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};
use tauri::{AppHandle, Manager};
use tokio::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Default, sqlx::FromRow)]
pub struct Stats {
    pub total_manga: u32,
    pub total_panels: u32,
    pub total_panels_read: u32,
    pub total_panels_remaining: u32,
    pub total_time_spent_reading: u32,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct MangaStats {
    pub total_panels: u32,
    pub total_panels_read: u32,
    pub total_panels_remaining: u32,
}

#[derive(Serialize, Deserialize, Default, sqlx::FromRow)]
pub struct Chart {
    watchtime: u32,
    updated_at: String,
}

#[tauri::command]
pub async fn fetch_daily_manga_folders(handle: AppHandle) -> Vec<MangaFolder> {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();

    // fetch all manga folders created + updated today
    let query = "
    SELECT * 
    FROM manga_folder 
    ORDER BY created_at DESC, updated_at DESC
";

    let mut daily_manga: Vec<MangaFolder> = Vec::new();
    let rows = sqlx::query(query).fetch_all(&pool).await.unwrap();

    for row in rows {
        let current_manga = MangaFolder {
            id: row.get("id"),
            title: row.get("title"),
            full_path: row.get("full_path"),
            as_child: row.get("as_child"),
            is_expanded: row.get("is_expanded"),
            time_spent_reading: row.get("time_spent_reading"),
            double_panels: row.get("double_panels"),
            is_read: row.get("is_read"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        };

        // parse created_at and updated_at from sqlite 'localtime'

        let updated_at =
            NaiveDateTime::parse_from_str(&current_manga.updated_at, "%Y-%m-%d %H:%M:%S").unwrap();
        let created_at =
            NaiveDateTime::parse_from_str(&current_manga.created_at, "%Y-%m-%d %H:%M:%S").unwrap();

        // check if created_at and updated_at are today

        let today = Local::now().naive_local().date();

        if updated_at.date() == today || created_at.date() == today {
            daily_manga.push(current_manga);
        } else {
            println!("Not today: {}", current_manga.title);
        }
    }

    daily_manga
}

async fn read_manga_folder_dirs(folder_path: &String, pool: SqlitePool) {
    let image_formats = [
        "jpg", "jpeg", "png", "gif", "bmp", "ico", "tif", "tiff", "webp", "svg", "pdf",
    ];

    match std::fs::read_dir(folder_path) {
        Ok(parent) => {
            for file in parent {
                let entry = file.unwrap();
                let file_name = entry.file_name();
                let file_path = entry.path();

                if file_path.is_dir() {
                    let path_str = file_path.to_str().unwrap().to_string();
                    Box::pin(read_manga_folder_dirs(&path_str, pool.clone())).await;
                } else {
                    for format in &image_formats {
                        if file_name.to_str().unwrap().to_lowercase().contains(format) {
                            let path_str = file_path.to_str().unwrap();
                            insert_or_ignore_panel(path_str, pool.clone()).await;
                        }
                    }
                }
            }
        }
        Err(err) => {
            eprintln!("Error Reading Dir: {} -> {}", folder_path, err);
        }
    }
}

async fn insert_or_ignore_panel(path: &str, pool: SqlitePool) {
    let uuid = uuid::Uuid::new_v4().to_string();
    // gets the parent, file name, and extension of the path
    let split_path = split_path_parts(path);
    // get the width and height of the panel image
    let (width, height) = get_panel_image_dimensions(path);

    sqlx::query(
        "INSERT OR IGNORE INTO manga_panel (
    id, 
    title, 
    full_path, 
    is_read, 
    width, 
    height, 
    zoom_level, 
    created_at,
    updated_at
    )
    VALUES (
    ?, ?, ?, ?, ?, ?, ?, 
    datetime('now', 'localtime'),
    datetime('now', 'localtime'))",
    )
    .bind(uuid)
    .bind(split_path.file_name)
    .bind(path)
    .bind(false)
    .bind(width)
    .bind(height)
    .bind(0)
    .execute(&pool)
    .await
    .unwrap();
}

#[tauri::command]
pub async fn create_manga_stats(handle: AppHandle, folder_path: String) -> MangaStats {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();

    // fetch all manga panels
    let manga_panels: Vec<MangaPanel> =
        sqlx::query_as("SELECT * FROM manga_panel WHERE full_path LIKE ? || '%'")
            .bind(&folder_path)
            .fetch_all(&pool)
            .await
            .unwrap();

    //println!("Folder path: {}", manga_panels.len());

    let (total, total_read, total_remaining) = count_manga_panels(&folder_path, &manga_panels);

    MangaStats {
        total_panels: total,
        total_panels_read: total_read,
        total_panels_remaining: total_remaining,
    }
}

pub async fn create_global_stats(pool: &SqlitePool) -> Stats {
    // fetch all manga folders
    let manga_folders: Vec<MangaFolder> = sqlx::query_as("SELECT * FROM manga_folder")
        .fetch_all(pool)
        .await
        .unwrap();

    let total_manga = manga_folders.len() as u32;
    let mut total_time_spent_reading: u32 = 0;

    // count total panels, total panels read, total panels remaining
    for folder in &manga_folders {
        read_manga_folder_dirs(&folder.full_path, pool.clone()).await;
        total_time_spent_reading += folder.time_spent_reading;
    }

    // fetch all manga panels
    let manga_panels: Vec<MangaPanel> = sqlx::query_as("SELECT * FROM manga_panel")
        .fetch_all(pool)
        .await
        .unwrap();

    let (total_panels, total_panels_read, total_panels_remaining) =
        count_global_manga_panels(&manga_panels);

    // reset time spent reading for every folder after counting
    sqlx::query("UPDATE manga_folder SET time_spent_reading = 0")
        .execute(pool)
        .await
        .unwrap();

    Stats {
        total_manga,
        total_panels,
        total_panels_read,
        total_panels_remaining,
        total_time_spent_reading,
    }
}

#[tauri::command]
pub async fn update_global_stats(handle: AppHandle) -> Stats {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();
    let mut is_stale: bool = false;

    let old_stats: Stats = match sqlx::query_as("SELECT * FROM stats").fetch_one(&pool).await {
        Ok(stats) => stats,
        Err(_) => Stats::default(),
    };

    let mut new_stats = create_global_stats(&pool).await;

    let mut old_stats_vec: Vec<u32> = Vec::new();
    let mut new_stats_vec: Vec<u32> = Vec::new();

    old_stats_vec.push(old_stats.total_manga);
    old_stats_vec.push(old_stats.total_panels);
    old_stats_vec.push(old_stats.total_panels_read);
    old_stats_vec.push(old_stats.total_panels_remaining);
    old_stats_vec.push(old_stats.total_time_spent_reading);

    new_stats_vec.push(new_stats.total_manga);
    new_stats_vec.push(new_stats.total_panels);
    new_stats_vec.push(new_stats.total_panels_read);
    new_stats_vec.push(new_stats.total_panels_remaining);

    new_stats_vec.push(new_stats.total_time_spent_reading + old_stats.total_time_spent_reading);
    new_stats.total_time_spent_reading += old_stats.total_time_spent_reading;

    for i in 0..old_stats_vec.len() {
        if old_stats_vec[i] != new_stats_vec[i] {
            is_stale = true;
            break;
        }
    }

    if is_stale {
        sqlx::query(
            "INSERT OR REPLACE INTO stats 
        (
        id,
        total_manga, 
        total_panels, 
        total_panels_read, 
        total_panels_remaining, 
        total_time_spent_reading
        )
        VALUES (
        ?, ?, ?, ?, ?, ?)",
        )
        .bind(1)
        .bind(new_stats.total_manga)
        .bind(new_stats.total_panels)
        .bind(new_stats.total_panels_read)
        .bind(new_stats.total_panels_remaining)
        .bind(new_stats.total_time_spent_reading)
        .execute(&pool)
        .await
        .unwrap();

        return new_stats;
    }

    old_stats
}

fn count_global_manga_panels(manga_panels: &Vec<MangaPanel>) -> (u32, u32, u32) {
    let mut total_panels_read: Vec<String> = Vec::new();

    for panel in manga_panels {
        if panel.is_read {
            //println!("Panel is read: {}", panel.full_path);
            total_panels_read.push(panel.full_path.clone());
        }
    }
    let total_panels_remaining: u32 =
        manga_panels.iter().filter(|panel| !panel.is_read).count() as u32;

    //println!("Total panels: {}", total_panels.len());

    (
        manga_panels.len() as u32,
        total_panels_read.len() as u32,
        total_panels_remaining,
    )
}

fn count_manga_panels(manga_folder_dir: &str, manga_panels: &Vec<MangaPanel>) -> (u32, u32, u32) {
    let file_types = ["jpg", "jpeg", "png", "webp"];
    let manga_dir = std::fs::read_dir(manga_folder_dir).unwrap();
    let mut total_panels: Vec<String> = Vec::new();
    let mut total_panels_read: Vec<String> = Vec::new();

    for entry in manga_dir {
        let panel_path = entry.unwrap().path();
        let file_type = panel_path.extension().unwrap().to_str().unwrap();

        if file_types.contains(&file_type) {
            total_panels.push(panel_path.to_str().unwrap().to_string());
        }
    }

    for panel in manga_panels {
        if panel.is_read && total_panels.contains(&panel.full_path) {
            //println!("Panel is read: {}", panel.full_path);
            total_panels_read.push(panel.full_path.clone());
        }
    }

    //println!("Total panels: {}", total_panels.len());

    if total_panels.is_empty() || total_panels_read.is_empty() {
        return (0, 0, 0);
    }

    let total_panels_remaining = if total_panels.len() as u32 > total_panels_read.len() as u32 {
        total_panels.len() as u32 - total_panels_read.len() as u32
    } else {
        0
    };

    (
        total_panels.len() as u32,
        total_panels_read.len() as u32,
        total_panels_remaining,
    )
}

#[tauri::command]
pub async fn create_chart_stats(
    range: String,
    days_in_month: Option<u8>,
    handle: AppHandle,
) -> Vec<f32> {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();

    //let mut updated_this_week: Vec<Chart> = Vec::new();
    let mut final_data: Vec<f32> = Vec::new();

    let today = chrono::Local::now().naive_local().date();
    let current_year = chrono::Local::now().year();
    let current_month = today.month0();

    if range == "daily" {
        final_data = vec![0.0; 7];
    } else if range == "weekly" {
        final_data = vec![0.0; days_in_month.unwrap() as usize - 1];
    } else if range == "monthly" {
        final_data = vec![0.0; 11];
    }

    {
        let data: Vec<Chart> = sqlx::query_as("SELECT * FROM chart ORDER BY updated_at DESC")
            .fetch_all(&pool)
            .await
            .unwrap();

        for entry in &data {
            let last_watched_at =
                chrono::NaiveDate::parse_from_str(&entry.updated_at, "%Y-%m-%d").unwrap();

            if range == "daily" {
                let week = today.week(chrono::Weekday::Mon);
                let days = week.days();

                if days.contains(&last_watched_at) {
                    let weekday_index = last_watched_at.weekday().num_days_from_sunday();
                    //println!("{}", weekday_index);
                    final_data[weekday_index as usize] =
                        ((entry.watchtime as f32 / 3600.0) * 100.0).round() / 100.0;
                }
            }

            if range == "weekly" {
                let split_date: Vec<&str> = entry.updated_at.split('-').collect();
                let mut _month: u8 = 0;

                {
                    let split_month: Vec<&str> = split_date[1]
                        .split("")
                        .filter(|str| !str.is_empty())
                        .collect();
                    if split_month[0] == "0" {
                        _month = split_month[1].parse().unwrap();
                    } else {
                        _month = split_date[1].parse().unwrap();
                    }
                }

                if current_month as u8 + 1 == _month {
                    let mut _day: usize = 0;

                    let split_day: Vec<&str> = split_date[2]
                        .split("")
                        .filter(|str| !str.is_empty())
                        .collect();
                    if split_day[0] == "0" {
                        _day = split_day[1].parse().unwrap();
                    } else {
                        _day = split_date[2].parse().unwrap();
                    }

                    final_data[_day - 1] =
                        ((entry.watchtime as f32 / 3600.0) * 100.0).round() / 100.0;
                }
            }

            if range == "monthly" && last_watched_at.year() == current_year {
                let split_date: Vec<&str> = entry.updated_at.split('-').collect();
                let mut _month: u8 = 0;

                {
                    let split_month: Vec<&str> = split_date[1]
                        .split("")
                        .filter(|str| !str.is_empty())
                        .collect();
                    if split_month[0] == "0" {
                        _month = split_month[1].parse().unwrap();
                    } else {
                        _month = split_date[1].parse().unwrap();
                    }
                }

                final_data[_month as usize - 1] +=
                    ((entry.watchtime as f32 / 3600.0) * 100.0).round() / 100.0
            }
        }
    }

    final_data
}

#[tauri::command]
pub async fn update_chart_watchtime(watch_time: u32, handle: tauri::AppHandle) {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();
    let today = chrono::Local::now().naive_local().date();

    sqlx::query(
        "INSERT OR IGNORE INTO chart (watchtime, updated_at) VALUES (0, date('now', 'localtime'))",
    )
    .execute(&pool)
    .await
    .unwrap();

    // Then, increment the watchtime.
    sqlx::query("UPDATE chart SET watchtime = watchtime + ? WHERE updated_at = ?")
        .bind(watch_time)
        .bind(today.to_string())
        .execute(&pool)
        .await
        .unwrap();
}
