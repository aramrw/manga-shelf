use chrono::format::ParseError;
use chrono::{DateTime, Local, NaiveDateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};
use tauri::{AppHandle, Manager};
use tokio::sync::Mutex;
use crate::manga::{MangaFolder, MangaPanel};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Stats {
    pub total_manga: i32,
    pub total_panels: i32,
    pub total_panels_read: i32,
    pub total_panels_remaining: i32,
}

#[tauri::command]
pub async fn fetch_daily(handle: AppHandle) -> Vec<MangaFolder> {
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
