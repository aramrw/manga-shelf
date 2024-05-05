use sqlx::{migrate::MigrateDatabase, Sqlite, SqlitePool};
use tauri::{AppHandle, Manager};
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

            migrate_parent_folder_table(&sqlite_pool).await.unwrap();
            migrate_manga_folder_table(&sqlite_pool).await.unwrap();
            migrate_global_table(&sqlite_pool).await.unwrap();
            migrate_manga_panel_table(&sqlite_pool).await.unwrap();
            migrate_stats_table(&sqlite_pool).await.unwrap();
            migrate_heatmap_table(&sqlite_pool).await.unwrap();

            Ok::<(), sqlx::Error>(())
        })
    })
    .unwrap();
}

pub async fn migrate_parent_folder_table(sqlite_pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS parent_folder
        (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            full_path TEXT NOT NULL,
            as_child BOOLEAN DEFAULT 0,
            is_expanded BOOLEAN DEFAULT 0,
            created_at TEXT,
            updated_at TEXT,
            UNIQUE(full_path)
        )",
    )
    .execute(sqlite_pool)
    .await?;

    Ok(())
}

pub async fn migrate_manga_folder_table(sqlite_pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS manga_folder
        (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            full_path TEXT NOT NULL,
            as_child BOOLEAN DEFAULT 0,
            is_expanded BOOLEAN DEFAULT 0,
            time_spent_reading INTEGER DEFAULT 0,
            double_panels BOOLEAN DEFAULT 0,
            created_at TEXT,
            updated_at TEXT,
            UNIQUE(full_path)
        )",
    )
    .execute(sqlite_pool)
    .await?;

    Ok(())
}

pub async fn migrate_global_table(sqlite_pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS global_manga
        (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            full_path TEXT NOT NULL,
            as_child BOOLEAN DEFAULT 0,
            is_expanded BOOLEAN DEFAULT 0,
            time_spent_reading INTEGER DEFAULT 0,
            double_panels BOOLEAN DEFAULT 0,
            created_at TEXT,
            updated_at TEXT,
            UNIQUE(full_path)
        )",
    )
    .execute(sqlite_pool)
    .await?;

    Ok(())
}

pub async fn migrate_manga_panel_table(sqlite_pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS manga_panel 
        (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            full_path TEXT NOT NULL,
            is_read BOOLEAN DEFAULT 0,
            width INTEGER,
            height INTEGER,
            zoom_level INTEGER,
            created_at TEXT,
            updated_at TEXT,
            UNIQUE(full_path)
        )",
    )
    .execute(sqlite_pool)
    .await?;

    Ok(())
}

pub async fn migrate_stats_table(sqlite_pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS stats 
        (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            total_manga INTEGER DEFAULT 0,
            total_panels INTEGER DEFAULT 0,
            total_panels_read INTEGER DEFAULT 0,
            total_panels_remaining INTEGER DEFAULT 0,
            total_time_spent_reading INTEGER DEFAULT 0
        )",
    )
    .execute(sqlite_pool)
    .await?;

    Ok(())
}

pub async fn migrate_heatmap_table(sqlite_pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS heatmap
        (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            count INTEGER NOT NULL
        )",
    )
    .execute(sqlite_pool)
    .await?;

    Ok(())
}


