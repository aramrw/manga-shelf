use tauri::{AppHandle, Manager};
use sqlx::{migrate::MigrateDatabase, Row, Sqlite, SqlitePool};
use tokio::sync::Mutex;

pub struct MangaFolder {
    pub id: u32,
    pub title: String,
}

pub fn create_database(path: &str, handle: tauri::AppHandle) {
    tokio::task::block_in_place(move || {
        tauri::async_runtime::block_on(async move {
            println!("Creating database at {}", path);
            if !Sqlite::database_exists(path).await.unwrap_or(false) {
                Sqlite::create_database(path).await?;
            }

            let sqlite_pool = SqlitePool::connect_lazy(path).unwrap();
            handle.manage(Mutex::new(sqlite_pool.clone())); 

            sqlx::query("CREATE TABLE IF NOT EXISTS manga_folder
            (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL
            )").execute(&sqlite_pool).await?;

            Ok::<(), sqlx::Error>(())
        })
    }).unwrap();
}
