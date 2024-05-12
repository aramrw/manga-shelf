use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};
use tauri::{AppHandle, Manager};
use tokio::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Default, sqlx::FromRow)]
pub struct ParentFolder {
    pub id: String,
    pub title: String,
    pub full_path: String,
    pub as_child: bool,
    pub is_expanded: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Clone, Deserialize, Default, sqlx::FromRow)]
pub struct MangaFolder {
    pub id: String,
    pub title: String,
    pub full_path: String,
    pub as_child: bool,
    pub is_expanded: bool,
    pub time_spent_reading: u32,
    pub double_panels: bool,
    pub is_read: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Clone, Deserialize, Default, sqlx::FromRow)]
pub struct MangaPanel {
    pub id: String,
    pub title: String,
    pub full_path: String,
    pub is_read: bool,
    pub width: u16,
    pub height: u16,
    pub zoom_level: u16,
    pub created_at: String,
    pub updated_at: String,
}

#[allow(dead_code)]
pub struct PathParts {
    pub parent: String,
    pub file_name: String,
    pub extension: Option<String>,
}

#[tauri::command]
pub async fn update_parent_folders(
    dir_paths: String,
    handle: AppHandle,
    as_child: bool,
    is_expanded: bool,
) -> Vec<ParentFolder> {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();
    let parsed_paths = serde_json::from_str::<Vec<String>>(&dir_paths).unwrap();

    // create a ParentFolder vector to return back to the frontend
    let mut parent_folders: Vec<ParentFolder> = Vec::new();

    for path in parsed_paths {
        let uuid = uuid::Uuid::new_v4().to_string();
        // gets the parent, file name, and extension of the path
        let split_path = split_path_parts(&path);

        // create a ParentFolder struct to push into the parent_folders vector
        let folder = ParentFolder {
            id: uuid.clone(),
            title: split_path.file_name.clone(),
            full_path: path.clone(),
            as_child,
            is_expanded,
            created_at: "".to_string(),
            updated_at: "".to_string(),
        };

        parent_folders.push(folder);

        sqlx::query(
            "INSERT INTO parent_folder 
        (
            id, 
            title, 
            full_path, 
            as_child,
            is_expanded,
            created_at, 
            updated_at
        ) 
        VALUES
        (
            ?, ?, ?, ?, ?,
            datetime('now', 'localtime'), datetime('now', 'localtime')
        )
        ON CONFLICT (full_path) DO UPDATE SET
        is_expanded = excluded.is_expanded,
        updated_at = datetime('now', 'localtime')
        ",
        )
        .bind(uuid)
        .bind(split_path.file_name)
        .bind(path)
        .bind(as_child)
        .bind(is_expanded)
        .execute(&pool)
        .await
        .unwrap();
    }

    // return the parent_folders vector back to the frontend
    parent_folders
}

#[tauri::command]
pub async fn get_parent_folders(handle: AppHandle) -> Vec<ParentFolder> {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();

    let mut parent_folders: Vec<ParentFolder> = Vec::new();
    let result = sqlx::query("SELECT * FROM parent_folder")
        .fetch_all(&pool)
        .await
        .unwrap();

    for row in result {
        let parent_folder = ParentFolder {
            id: row.get("id"),
            title: row.get("title"),
            full_path: row.get("full_path"),
            as_child: row.get("as_child"),
            is_expanded: row.get("is_expanded"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        };

        parent_folders.push(parent_folder);
    }

    parent_folders.retain(|folder| !folder.as_child);

    // return the parent_folders vector back to the frontend
    parent_folders
}

#[tauri::command]
pub async fn update_manga_folders(
    dir_paths: String,
    handle: AppHandle,
    as_child: bool,
    is_expanded: bool,
) -> Vec<MangaFolder> {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();
    let parsed_paths = serde_json::from_str::<Vec<String>>(&dir_paths).unwrap();

    // create a MangaFolder vector to return back to the frontend
    let mut manga_folders: Vec<MangaFolder> = Vec::new();

    for path in parsed_paths {
        let uuid = uuid::Uuid::new_v4().to_string();
        // gets the parent, file name, and extension of the path
        let split_path = split_path_parts(&path);
        
        sqlx::query(
            "INSERT INTO manga_folder 
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
            ?, ?, ?, ?, ?, ?,
            datetime('now', 'localtime'), datetime('now', 'localtime')
        )
        ON CONFLICT (full_path) DO UPDATE SET
        as_child = excluded.as_child,
        is_expanded = excluded.is_expanded,
        updated_at = datetime('now', 'localtime')
        ",
        )
        .bind(uuid)
        .bind(split_path.file_name)
        .bind(&path)
        .bind(as_child)
        .bind(is_expanded)
        .bind(0)
        .execute(&pool)
        .await
        .unwrap();

        let updated_folder = sqlx::query_as("SELECT * FROM manga_folder WHERE full_path = ?")
            .bind(&path)
            .fetch_one(&pool)
            .await
            .unwrap();

        manga_folders.push(updated_folder);
    }

    // return the manga_folders vector back to the frontend
    manga_folders
}

#[tauri::command]
pub async fn get_manga_folders(handle: AppHandle) -> Vec<MangaFolder> {
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
            is_expanded: row.get("is_expanded"),
            time_spent_reading: row.get("time_spent_reading"),
            double_panels: row.get("double_panels"),
            is_read: row.get("is_read"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        };

        manga_folders.push(manga_folder);
    }

    manga_folders.retain(|folder| !folder.as_child);

    // return the manga_folders vector back to the frontend
    manga_folders
}

#[tauri::command]
pub async fn update_manga_panel(
    dir_paths: String,
    handle: AppHandle,
    is_read: bool,
    zoom_level: u16,
) {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();
    //let mut manga_panels: Vec<MangaPanel> = Vec::new();

    for path in serde_json::from_str::<Vec<String>>(&dir_paths).unwrap() {
        let uuid = uuid::Uuid::new_v4().to_string();
        // gets the parent, file name, and extension of the path
        let split_path = split_path_parts(&path);
        // get the width and height of the panel image
        let (width, height) = get_panel_image_dimensions(&path);

        // create a MangaFolder struct to push into the panels vector
        // manga_panels.push(MangaPanel {
        //     id: uuid.clone(),
        //     title: split_path.file_name.clone(),
        //     full_path: path.clone(),
        //     is_read,
        //     width,
        //     height,
        //     created_at: "".to_string(),
        //     updated_at: "".to_string(),
        // });

        sqlx::query(
            "INSERT INTO manga_panel  
        (
            id, 
            title, 
            full_path, 
            is_read,
            width,
            height,
            zoom_level,
            created_at, 
            updated_at
        ) 
        VALUES
        (
            ?, ?, ?, ?, ?, ?, ?,
            datetime('now', 'localtime'), datetime('now', 'localtime')
        )
        ON CONFLICT (full_path) DO UPDATE SET
            is_read = excluded.is_read,
            updated_at = datetime('now', 'localtime')",
        )
        .bind(uuid)
        .bind(split_path.file_name)
        .bind(&path)
        .bind(is_read)
        .bind(width)
        .bind(height)
        .bind(zoom_level)
        .execute(&pool)
        .await
        .unwrap();
    }

    // update every panel to match the same zoom level

    if zoom_level > 0 {
        sqlx::query("UPDATE manga_panel SET zoom_level = ?")
            .bind(zoom_level)
            .execute(&pool)
            .await
            .unwrap();
    }

    //manga_panels
}

#[tauri::command]
pub async fn get_manga_panel(path: &str, handle: AppHandle) -> Result<MangaPanel, String> {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();

    if path.is_empty() {
        return Err("Path is empty".to_string());
    }

    let panel: MangaPanel = match sqlx::query_as("SELECT * FROM manga_panel WHERE full_path = ?")
        .bind(path)
        .fetch_one(&pool)
        .await
    {
        Ok(panel) => panel,
        Err(_) => {
            return Err("Panel not found".to_string());
        }
    };

    Ok(panel)
}

#[tauri::command]
pub async fn delete_folder(_id: String, path: String, all_data: bool, handle: AppHandle) {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();

    //println!("Deleting folder: {}", path);

    // delete any folders that contain the main folder module_path!()
    sqlx::query("DELETE FROM manga_folder WHERE full_path LIKE ? || '%'")
        .bind(&path)
        .execute(&pool)
        .await
        .unwrap();

    // delete the main folder
    sqlx::query("DELETE FROM parent_folder where full_path LIKE ? || '%'")
        .bind(&path)
        .execute(&pool)
        .await
        .unwrap();

    // delete all panels that contain the main folder's module_path!
    if all_data {
        sqlx::query("DELETE FROM manga_panel WHERE full_path LIKE ? || '%'")
            .bind(&path)
            .execute(&pool)
            .await
            .unwrap();
    }
}

// helper functions
pub fn split_path_parts(path: &str) -> PathParts {
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

pub fn get_panel_image_dimensions(panel_image_path: &str) -> (u16, u16) {
    match imagesize::size(panel_image_path) {
        Ok(size) => (size.width as u16, size.height as u16),
        Err(_) => (0, 0),
    }
}

#[tauri::command]
pub async fn get_next_or_previous_manga_folder(
    current_folder_path: String,
    is_next: bool,
    handle: AppHandle,
) -> Option<MangaFolder> {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();

    let parent_path = std::path::Path::new(&current_folder_path)
        .parent()
        .unwrap()
        .to_str()
        .unwrap();

    let mut manga_folders: Vec<MangaFolder> =
        sqlx::query_as("SELECT * FROM manga_folder WHERE full_path LIKE ? || '%'")
            .bind(parent_path)
            .fetch_all(&pool)
            .await
            .unwrap();

    // sort the manga_folder
    let re = regex::Regex::new(r"\d+").unwrap();

    manga_folders.sort_by(|a, b| {
        let a_num: i32 = re
            .find(&a.title)
            .and_then(|m| m.as_str().parse().ok())
            .unwrap_or_default();
        let b_num: i32 = re
            .find(&b.title)
            .and_then(|m| m.as_str().parse().ok())
            .unwrap_or_default();
        a_num.cmp(&b_num)
    });

    // find the index in the vector where the current folder is
    let index = manga_folders
        .iter()
        .position(|x| x.full_path == current_folder_path)
        .unwrap();

    // return the next folder in the vector

    if is_next {
        if index + 1 >= manga_folders.len() {
            return None;
        }
        Some(manga_folders[index + 1].clone())
    } else {
        if index == 0 {
            return None;
        }
        Some(manga_folders[index - 1].clone())
    }
}

#[tauri::command]
pub async fn update_folder_double_panels(
    folder_path: String,
    double_panels: bool,
    handle: AppHandle,
) {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();

    sqlx::query("UPDATE manga_folder SET double_panels = ? WHERE full_path = ?")
        .bind(double_panels)
        .bind(folder_path)
        .execute(&pool)
        .await
        .unwrap();
}

#[tauri::command]
pub async fn find_last_read_panel(handle: AppHandle, chapter_path: String) -> usize {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();

    let panels: Vec<MangaPanel> =
        sqlx::query_as("SELECT * FROM manga_panel WHERE full_path LIKE ? || '%'")
            .bind(chapter_path)
            .fetch_all(&pool)
            .await
            .unwrap();

    //panels.sort_by(|a, b| a.is_read.cmp(&b.is_read));

    let last = panels.iter().rposition(|x| x.is_read).unwrap_or(0) as usize;

    //println!("last panel: {:?} at index {}", panels[last].title, last);

    last
}

#[tauri::command]
pub async fn update_folder_time_spent_reading(
    folder_path: String,
    time_spent_reading: u32,
    handle: AppHandle,
) {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();

    sqlx::query("UPDATE manga_folder SET time_spent_reading = time_spent_reading + ?, updated_at = datetime('now', 'localtime') WHERE full_path = ?")
        .bind(time_spent_reading)
        .bind(folder_path)
        .execute(&pool)
        .await
        .unwrap();
}

#[tauri::command]
pub async fn set_folder_read(path: String, handle: AppHandle) {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();

    //println!("setting {} as read", path);

    sqlx::query("UPDATE manga_folder SET is_read = true WHERE full_path = ?")
        .bind(path)
        .execute(&pool)
        .await
        .unwrap();
}

#[tauri::command]
pub async fn set_folder_unread(path: String, handle: AppHandle) {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();

    sqlx::query("UPDATE manga_folder SET is_read = false WHERE full_path = ?")
        .bind(path)
        .execute(&pool)
        .await
        .unwrap();
}
