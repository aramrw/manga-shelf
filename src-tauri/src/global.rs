use crate::manga::MangaFolder;
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};
use tauri::{AppHandle, Manager};
use tokio::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct GlobalError {
    pub message: String,
}

#[tauri::command]
pub async fn set_global_manga(full_path: &str, handle: AppHandle) -> Result<(), GlobalError> {
    // This function will be called from the fe
    // and will update the current manga in the global scope
    // so that it can be accessed from anywhere in the app

    //println!("Setting global manga: {}", full_path);

    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();
    let current_manga = get_manga_by_path(full_path, &pool).await;

    sqlx::query("DELETE FROM global_manga")
        .execute(&pool)
        .await
        .unwrap();

    sqlx::query(
        "INSERT INTO global_manga 
        (
            id, 
            title, 
            full_path, 
            as_child,
            is_expanded,
            time_spent_reading,
            created_at, 
            updated_at
        ) 
        VALUES
        (
            ?, ?, ?, ?, ?, ?, ?, ?
        )",
    )
    .bind(current_manga.id)
    .bind(current_manga.title)
    .bind(current_manga.full_path)
    .bind(current_manga.as_child)
    .bind(current_manga.is_expanded)
    .bind(current_manga.time_spent_reading)
    .bind(current_manga.created_at)
    .bind(current_manga.updated_at)
    .execute(&pool)
    .await
    .unwrap();

    Ok(())
}

#[tauri::command]
pub async fn get_global_manga(handle: AppHandle) -> Option<MangaFolder> {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();

    let result = sqlx::query("SELECT * FROM global_manga")
        .fetch_one(&pool)
        .await
        .unwrap();

    Some(MangaFolder {
        id: result.get("id"),
        title: result.get("title"),
        full_path: result.get("full_path"),
        as_child: result.get("as_child"),
        is_expanded: result.get("is_expanded"),
        time_spent_reading: result.get("time_spent_reading"),
        created_at: result.get("created_at"),
        updated_at: result.get("updated_at"),
    })
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
        is_expanded: result.get("is_expanded"),
        time_spent_reading: result.get("time_spent_reading"),
        created_at: result.get("created_at"),
        updated_at: result.get("updated_at"),
    }
}
