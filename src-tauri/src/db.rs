use tauri::{AppHandle, Manager};
use sqlx::{migrate::MigrateDatabase,Sqlite, SqlitePool};
use tokio::sync::Mutex;
use crate::manga::{migrate_manga_tables};

pub fn create_database(path: &str, handle: AppHandle) {
    tokio::task::block_in_place(move || {
        tauri::async_runtime::block_on(async move {
            println!("Creating database at {}", path);
            if !Sqlite::database_exists(path).await.unwrap_or(false) {
                Sqlite::create_database(path).await?;
            }

            let sqlite_pool = SqlitePool::connect_lazy(path).unwrap();
            handle.manage(Mutex::new(sqlite_pool.clone())); 
    
            migrate_manga_tables(&sqlite_pool).await.unwrap();
            
            Ok::<(), sqlx::Error>(())
        })
    }).unwrap();
}
