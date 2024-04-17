use tauri::{AppHandle, Manager};
use sqlx::{migrate::MigrateDatabase,Sqlite, SqlitePool};
use tokio::sync::Mutex;

pub fn create_database(path: &str, handle: AppHandle) {
    tokio::task::block_in_place(move || {
        tauri::async_runtime::block_on(async move {
            println!("Creating database at {}", path);
            if !Sqlite::database_exists(path).await.unwrap_or(false) {
                Sqlite::create_database(path).await?;
            }

            let sqlite_pool = SqlitePool::connect_lazy(path).unwrap();
            handle.manage(Mutex::new(sqlite_pool.clone())); 
    
            migrate_manga_folder_table(&sqlite_pool).await.unwrap();
            migrate_global_table(&sqlite_pool).await.unwrap();
            migrate_manga_panel_table(&sqlite_pool).await.unwrap();
            
            Ok::<(), sqlx::Error>(())
        })
    }).unwrap();
}
