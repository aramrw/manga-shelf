use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};
use tauri::{AppHandle, Manager};
use tokio::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct MangaFolder {
    pub id: String,
    pub title: String,
    pub full_path: String,
    pub as_child: bool,
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
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            full_path TEXT NOT NULL,
            as_child BOOLEAN DEFAULT 0,
            created_at TEXT,
            updated_at TEXT,
            UNIQUE(full_path)
        )",
    )
    .execute(sqlite_pool)
    .await?;

    Ok(())
}

#[tauri::command]
pub async fn add_manga_folders(dir_paths: String, handle: AppHandle, as_child: bool) -> String {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();
    let parsed_paths = serde_json::from_str::<Vec<String>>(&dir_paths).unwrap();
    
    // create a MangaFolder vector to return back to the frontend
    let mut manga_folders: Vec<MangaFolder> = Vec::new();

    for path in parsed_paths {
        let uuid = uuid::Uuid::new_v4().to_string();
        let split_path = split_path_parts(&path);


        // create a MangaFolder struct to push into the manga_folders vector
        let manga_folder = MangaFolder {
            id: uuid.clone(),
            title: split_path.file_name.clone(),
            full_path: path.clone(),
            as_child,
            created_at: "".to_string(),
            updated_at: "".to_string(),
        };

        manga_folders.push(manga_folder);

        sqlx::query(
            "INSERT OR IGNORE INTO manga_folder
        (
            id, 
            title, 
            full_path, 
            as_child,
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
        .bind(as_child)
        .execute(&pool)
        .await
        .unwrap();
    }

    // return the manga_folders vector back to the frontend
    serde_json::to_string(&manga_folders).unwrap()
}

#[tauri::command]
pub async fn get_manga_folders(handle: AppHandle) -> String { 
   let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone(); 

    let mut manga_folders: Vec<MangaFolder> = Vec::new();
    let result = sqlx::query("SELECT * FROM manga_folder") 
         .fetch_all(&pool)
         .await 
         .unwrap();

    for row in result {
        let manga_folder = MangaFolder {
            id: row.get("id"),
            title: row.get("title"),
            full_path: row.get("full_path"),
            as_child: row.get("as_child"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        };

        manga_folders.push(manga_folder);
    }


    // return the manga_folders vector back to the frontend
    serde_json::to_string(&manga_folders).unwrap()

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
