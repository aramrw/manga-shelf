use serde::{Deserialize, Serialize};
use sqlx::{migrate::MigrateDatabase, Row, Sqlite, SqlitePool};
use tauri::{command, Manager, AppHandle};
use tokio::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct MangaFolder {
    pub id: u32,
    pub title: String,
    pub created_at: String,
    pub updated_at: String,
}

pub async fn migrate_manga_tables(sqlite_pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS manga_folder
            (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            created_at TEXT,
            updated_at TEXT
            )",
    )
    .execute(sqlite_pool)
    .await?;

    Ok(())
}

#[command]
async fn add_manga_folder(title: String, handle: AppHandle) -> Result<(), sqlx::Error> {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();

    let result = sqlx::query("INSERT INTO manga_folder (title) VALUES (?)")
        .bind(title)
        .execute(&pool)
        .await?;

    Ok(())
}
