use serde::{Deserialize, Serialize};
use sqlx::{/* Row, Sqlite, */ SqlitePool};
use tauri::{command, AppHandle, Manager};
use tokio::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct MangaFolder {
    pub id: u32,
    pub title: String,
    pub full_path: String,
    pub parent_path: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[allow(dead_code)]
pub struct PathParts {
    pub parent: String,
    pub file_name: String,
    pub extension: Option<String>,
}

pub async fn migrate_manga_tables(sqlite_pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS manga_folder
        (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            full_path TEXT NOT NULL,
            parent_path TEXT,
            created_at TEXT,
            updated_at TEXT
        )",
    )
    .execute(sqlite_pool)
    .await?;

    Ok(())
}

#[command]
async fn add_manga_folder(path: String, handle: AppHandle) -> Result<(), sqlx::Error> {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();
    let uuid = uuid::Uuid::new_v4().to_string();
    let split_path = split_path_parts(&path);

    let result = sqlx::query(
        "INSERT INTO manga_folder
        (
            id, 
            title, 
            full_path, 
            parent_path,
            created_at, 
            updated_at
        ) 
        VALUES
        (
            ?, ?, ?, ?, 
            datetime('now'), datetime('now')
        )",
    )
    .bind(uuid)
    .bind(split_path.file_name)
    .bind(path)
    .bind(split_path.parent)
    .execute(&pool)
    .await?;

    Ok(())
}

fn split_path_parts(path: &str) -> PathParts {
    let path = std::path::Path::new(path);

    let file_name = path.file_name().unwrap().to_str().unwrap().to_string();
    let parent = path.parent().unwrap().to_str().unwrap().to_string();
    let extension = path
        .extension()
        .and_then(|os_string| os_string.to_str())
        .map(|s| s.to_string());

    PathParts {
        parent,
        file_name,
        extension,
    }
}
