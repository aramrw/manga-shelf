use crate::manga::{MangaFolder, MangaPanel};
use chrono::{Local, NaiveDateTime};
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};
use tauri::{AppHandle, Manager};
use tokio::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Default)]
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
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        };

        // parse created_at and updated_at from sqlite 'localtime'

        let updated_at =
            NaiveDateTime::parse_from_str(&current_manga.created_at, "%Y-%m-%d %H:%M:%S").unwrap();
        let created_at =
            NaiveDateTime::parse_from_str(&current_manga.updated_at, "%Y-%m-%d %H:%M:%S").unwrap();

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

#[tauri::command]
pub async fn create_manga_stats(handle: AppHandle, folder_path: String) -> MangaStats {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();

    // fetch all manga panels
    let manga_panels: Vec<MangaPanel> = sqlx::query_as("SELECT * FROM manga_panel WHERE full_path LIKE ? || '%'")
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
    

#[tauri::command]
pub async fn create_stats(handle: AppHandle) -> Stats {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();

    // fetch all manga folders
    let manga_folders: Vec<MangaFolder> = sqlx::query_as("SELECT * FROM manga_folder")
        .fetch_all(&pool)
        .await
        .unwrap();

    // fetch all manga panels
    let manga_panels: Vec<MangaPanel> = sqlx::query_as("SELECT * FROM manga_panel")
        .fetch_all(&pool)
        .await
        .unwrap();

    let total_manga = manga_folders.len() as u32;
    let mut total_panels: u32 = 0;
    let mut total_panels_read: u32 = 0;
    let mut total_panels_remaining: u32 = 0;
    let mut total_time_spent_reading: u32 = 0;

    // count total panels, total panels read, total panels remaining
    for folder in &manga_folders {
        let (total, total_read, total_remaining) =
            count_manga_panels(&folder.full_path, &manga_panels);

        total_panels += total;
        total_panels_read += total_read;
        total_panels_remaining += total_remaining;
    }

    // calculate total time spent reading
    for folder in &manga_folders {
        total_time_spent_reading += folder.time_spent_reading;
    }

    Stats {
        total_manga,
        total_panels,
        total_panels_read,
        total_panels_remaining,
        total_time_spent_reading,
    }
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
