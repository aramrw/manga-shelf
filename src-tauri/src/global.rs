use crate::manga::{MangaFolder, ParentFolder};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use tauri::{AppHandle, Manager};
use tokio::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct GlobalError {
    pub message: String,
}

#[tauri::command]
pub async fn set_global_manga_folder(
    full_path: &str,
    handle: AppHandle,
) -> Result<(), GlobalError> {
    // This function will be called from the fe
    // and will update the current manga in the global scope
    // so that it can be accessed from anywhere in the app

    //println!("Setting global manga: {}", full_path);

    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();
    let current_manga = get_manga_folder_by_path(full_path, &pool).await.unwrap();

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
            double_panels,
            is_read,
            cover_panel_path,
            created_at,
            updated_at
        )
        VALUES
        (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )",
    )
    .bind(current_manga.id)
    .bind(current_manga.title)
    .bind(current_manga.full_path)
    .bind(current_manga.as_child)
    .bind(current_manga.is_expanded)
    .bind(current_manga.time_spent_reading)
    .bind(current_manga.double_panels)
    .bind(current_manga.is_read)
    .bind(current_manga.cover_panel_path)
    .bind(current_manga.created_at)
    .bind(current_manga.updated_at)
    .execute(&pool)
    .await
    .unwrap();

    Ok(())
}

#[tauri::command]
pub async fn set_global_parent_folder(
    full_path: &str,
    handle: AppHandle,
) -> Result<(), GlobalError> {
    // This function will be called from the fe
    // and will update the current manga in the global scope
    // so that it can be accessed from anywhere in the app

    //println!("Setting global manga: {}", full_path);

    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();
    let current_manga = get_parent_folder_by_path(full_path, &pool).await.unwrap();

    sqlx::query("DELETE FROM global_parent")
        .execute(&pool)
        .await
        .unwrap();

    sqlx::query(
        "INSERT INTO global_parent
        (
            id,
            title,
            full_path,
            as_child,
            is_expanded,
            cover_panel_path,
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
    .bind(current_manga.cover_panel_path)
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

    let result: MangaFolder = sqlx::query_as("SELECT * FROM global_manga")
        .fetch_one(&pool)
        .await
        .unwrap();
    Some(result)
}

#[tauri::command]
pub async fn get_global_parent(handle: AppHandle) -> Option<ParentFolder> {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();

    let result: ParentFolder = sqlx::query_as("SELECT * FROM global_parent")
        .fetch_one(&pool)
        .await
        .unwrap();
    Some(result)
}

pub async fn get_manga_folder_by_path(full_path: &str, pool: &SqlitePool) -> Option<MangaFolder> {
    //println!("Getting manga by path: {}", full_path);
    match sqlx::query_as("SELECT * FROM manga_folder WHERE full_path = ?")
        .bind(full_path)
        .fetch_one(pool)
        .await
    {
        Ok(manga) => Some(manga),
        Err(_) => None,
    }
}

pub async fn get_parent_folder_by_path(full_path: &str, pool: &SqlitePool) -> Option<ParentFolder> {
    //println!("Getting manga by path: {}", full_path);
    match sqlx::query_as("SELECT * FROM parent_folder WHERE full_path = ?")
        .bind(full_path)
        .fetch_one(pool)
        .await
    {
        Ok(manga) => Some(manga),
        Err(_) => None,
    }
}
