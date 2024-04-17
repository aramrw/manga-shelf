use crate::manga::MangaFolder;
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};
use tauri::{AppHandle, Manager};
use tokio::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct GlobalError {
    message: String,
}

pub async fn get_manga_by_path(full_path: &str, pool: &SqlitePool) -> MangaFolder {
    //println!("Getting manga by path: {}", full_path);
    let result = sqlx::query("SELECT * FROM manga_folder WHERE full_path = ?")
        .bind(full_path)
        .fetch_one(pool)
        .await
        .unwrap();

    MangaFolder {
        id: result.get("id"),
        title: result.get("title"),
        full_path: result.get("full_path"),
        as_child: result.get("as_child"),
        created_at: result.get("created_at"),
        updated_at: result.get("updated_at"),
    }
}


