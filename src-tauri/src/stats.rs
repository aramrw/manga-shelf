use chrono::format::ParseError;
use chrono::{DateTime, Local, NaiveDateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};
use tauri::{AppHandle, Manager};
use tokio::sync::Mutex;
use crate::manga::{MangaFolder, MangaPanel};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Stats {
    pub total_manga: u32,
    pub total_panels: u32,
    pub total_panels_read: u32,
    pub total_panels_remaining: u32,
    pub total_time_spent_reading: u32,
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
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        };


        // Parse the strings into NaiveDateTime
        let created_at: Result<NaiveDateTime, ParseError> =
            NaiveDateTime::parse_from_str(&current_manga.created_at, "%Y-%m-%d %H:%M:%S");
        let updated_at: Result<NaiveDateTime, ParseError> =
            NaiveDateTime::parse_from_str(&current_manga.updated_at, "%Y-%m-%d %H:%M:%S");

        match (created_at, updated_at) {
            (Ok(created_at), Ok(updated_at)) => {
                // Convert NaiveDateTime to DateTime<Utc>
                let created_at_utc: DateTime<Utc> =
                    DateTime::from_naive_utc_and_offset(created_at, Utc);
                let updated_at_utc: DateTime<Utc> =
                    DateTime::from_naive_utc_and_offset(updated_at, Utc);

                // Convert DateTime<Utc> to local DateTime
                let created_at_local = created_at_utc.with_timezone(&Local);
                let updated_at_local = updated_at_utc.with_timezone(&Local);

                let created_at_date = created_at_local.date_naive();
                let updated_at_date = updated_at_local.date_naive();
                let today = Local::now();

                if created_at_date == today.date_naive() || updated_at_date == today.date_naive() && current_manga.as_child {
                    daily_manga.push(current_manga);
                }
            }
            _ => {
                println!("Failed to parse date time");
            }
        }
    }
    daily_manga
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
        let (total, total_read, total_remaining) = count_manga_panels(&folder.full_path, &manga_panels);

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
    let mut total_panels_read: u32 = 0;


    for entry in manga_dir {
        let panel_path = entry.unwrap().path();
        let file_type = panel_path.extension().unwrap().to_str().unwrap();

        if file_types.contains(&file_type) {
            total_panels.push(panel_path.to_str().unwrap().to_string());
        }
    }

    for panel in manga_panels {
        if panel.is_read {
            total_panels_read += 1;
        } 
    }

    //println!("Total panels: {}", total_panels.len());

    let total_panels_remaining = total_panels.len() as u32 - total_panels_read;

    (total_panels.len() as u32, total_panels_read, total_panels_remaining)

}
