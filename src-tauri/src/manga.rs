use std::{
    fs::read_dir,
    io,
    path::{Path, PathBuf},
};

use serde::{Deserialize, Serialize};
use sqlx::{query_as, SqlitePool};
use tauri::{AppHandle, Manager};
use tokio::sync::Mutex;

use crate::misc::NUMBER_REGEX;

#[derive(Debug, Serialize, Deserialize, Default, sqlx::FromRow)]
pub struct ParentFolder {
    pub id: String,
    pub title: String,
    pub full_path: String,
    pub as_child: bool,
    pub is_expanded: bool,
    pub cover_panel_path: Option<String>,
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
    pub cover_panel_path: Option<String>,
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
        let cover_panel_path = get_parent_folder_cover_panel_path(&path).unwrap_or_default();
        //println!("{cover_panel_path}");

        // create a ParentFolder struct to push into the parent_folders vector
        let folder = ParentFolder {
            id: uuid.clone(),
            title: split_path.file_name.clone(),
            full_path: path.clone(),
            as_child,
            is_expanded,
            cover_panel_path: Some(cover_panel_path.clone()),
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
            cover_panel_path,
            created_at,
            updated_at
        )
        VALUES
        (
            ?, ?, ?, ?, ?, ?,
            datetime('now', 'localtime'), datetime('now', 'localtime')
        )
        ON CONFLICT (full_path) DO UPDATE SET
        is_expanded = excluded.is_expanded
        ",
        )
        .bind(uuid)
        .bind(split_path.file_name)
        .bind(path)
        .bind(as_child)
        .bind(is_expanded)
        .bind(cover_panel_path)
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

    let mut parent_folders: Vec<ParentFolder> = sqlx::query_as("SELECT * FROM parent_folder")
        .fetch_all(&pool)
        .await
        .unwrap();

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
        let cover_panel_path = get_manga_folder_cover_panel_path(&path).unwrap_or_default();

        sqlx::query(
            "INSERT INTO manga_folder
        (
            id,
            title,
            full_path,
            as_child,
            is_expanded,
            time_spent_reading,
            cover_panel_path,
            created_at,
            updated_at
        )
        VALUES
        (
            ?, ?, ?, ?, ?, ?, ?,
            datetime('now', 'localtime'), datetime('now', 'localtime')
        )
        ON CONFLICT (full_path) DO UPDATE SET
        as_child = excluded.as_child,
        is_expanded = excluded.is_expanded
        ",
        )
        .bind(uuid)
        .bind(split_path.file_name)
        .bind(&path)
        .bind(as_child)
        .bind(is_expanded)
        .bind(0)
        .bind(cover_panel_path)
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

pub fn get_parent_folder_cover_panel_path(parent_path: &str) -> Result<String, io::Error> {
    for entry in read_dir(parent_path)? {
        let entry = entry?;
        let entry_path = entry.path();

        if entry_path.is_dir() {
            // First, try to get a cover panel from this subdirectory
            match get_manga_folder_cover_panel_path(&entry_path.to_string_lossy()) {
                Ok(cover_panel_path) => return Ok(cover_panel_path),
                Err(e) => match e.kind() {
                    // If it's a NotFound error, continue searching other subdirectories
                    io::ErrorKind::NotFound => {
                        // Recursively check subdirectories of this directory
                        match get_parent_folder_cover_panel_path(&entry_path.to_string_lossy()) {
                            Ok(panel_path) => return Ok(panel_path),
                            Err(inner_err) => match inner_err.kind() {
                                io::ErrorKind::NotFound => {} // Keep searching other directories
                                _ => return Err(inner_err),   // Propagate any other error
                            },
                        }
                    }
                    _ => return Err(e), // Propagate any other error
                },
            }
        }
    }

    // If no valid image is found in this directory or its subdirectories
    Err(io::Error::new(
        io::ErrorKind::NotFound,
        "No valid cover panel image found in any subdirectories",
    ))
}

pub fn get_manga_folder_cover_panel_path(folder_path: &str) -> Result<String, io::Error> {
    let file_types = ["jpg", "jpeg", "png", "webp"];
    let mut manga_panel_paths: Vec<PathBuf> = Vec::new();

    // Collect valid image file paths as PathBuf
    for entry in read_dir(folder_path)? {
        let entry = entry?;
        let entry_path = entry.path();

        if let Some(ext) = entry_path.extension() {
            if let Some(ext_str) = ext.to_str() {
                if file_types.contains(&ext_str) {
                    manga_panel_paths.push(entry_path);
                }
            }
        }
    }

    // Sort the paths by the numbers extracted from the file names
    manga_panel_paths.sort_by_key(|path| {
        path.file_name()
            .and_then(|name| name.to_str())
            .and_then(|name_str| NUMBER_REGEX.captures(name_str))
            .and_then(|cap| cap.get(1))
            .and_then(|num| num.as_str().parse::<u32>().ok())
            .unwrap_or(0) // Default to 0 if no match or parse error
    });

    // Return the first panel if available
    manga_panel_paths
        .first()
        .map(|path| path.to_string_lossy().into_owned())
        .ok_or_else(|| io::Error::new(io::ErrorKind::NotFound, "No valid cover panel image found"))
}

#[tauri::command]
pub async fn get_manga_folders(handle: AppHandle) -> Vec<MangaFolder> {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();

    let mut manga_folders: Vec<MangaFolder> = sqlx::query_as("SELECT * FROM manga_folder")
        .fetch_all(&pool)
        .await
        .unwrap();

    manga_folders.retain(|folder| !folder.as_child);

    // return the manga_folders vector back to the frontend
    manga_folders
}

#[tauri::command]
pub async fn update_manga_panel(
    dir_paths: Vec<String>,
    handle: AppHandle,
    is_read: bool,
    zoom_level: u16,
) {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();

    for path in &dir_paths {
        let uuid = uuid::Uuid::new_v4().to_string();
        // gets the parent, file name, and extension of the path
        let split_path = split_path_parts(path);
        // get the width and height of the panel image
        let (width, height) = get_panel_image_dimensions(path);

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
        .bind(path)
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

    if let Some(manga_folder_path) = dir_paths.first() {
        if let Some(parent) = Path::new(manga_folder_path).parent() {
            // update the main manga folder's updated_at
            sqlx::query(
                "UPDATE manga_folder SET updated_at = DATETIME('now', 'localtime') WHERE full_path = ?",
            ).bind(parent.to_string_lossy().to_string())
            .execute(&pool)
            .await
            .unwrap();
        }
    }
}

#[tauri::command]
pub async fn get_manga_panel(path: &str, handle: AppHandle) -> Result<MangaPanel, String> {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();

    if path.is_empty() {
        return Err("`path` is empty #cmd(get_manga_panel)[manga.rs]".to_string());
    }

    let panel: MangaPanel = match sqlx::query_as("SELECT * FROM manga_panel WHERE full_path = ?")
        .bind(path)
        .fetch_one(&pool)
        .await
    {
        Ok(panel) => panel,
        Err(e) => {
            return Err(format!(
                "Error occured querying for Panel `{path}` #cmd(get_manga_panel)[manga.rs]\n{e}"
            ));
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
pub async fn find_last_read_manga_folder(
    handle: AppHandle,
    paths: Vec<String>,
) -> Option<(MangaFolder, MangaPanel)> {
    let pool = handle.state::<Mutex<SqlitePool>>().lock().await.clone();
    let folders: Vec<MangaFolder> = query_as("SELECT * FROM manga_folder ORDER BY updated_at DESC")
        .fetch_all(&pool)
        .await
        .unwrap();

    //println!("{:#?}", folders);

    for folder in folders {
        if paths.contains(&folder.full_path) {
            //println!("last read manga folder: {}", folder.full_path);
            let last_read_panel: MangaPanel = sqlx::query_as(
                "SELECT * FROM manga_panel WHERE full_path LIKE ? || '%' ORDER BY updated_at DESC",
            )
            .bind(&folder.full_path)
            .fetch_one(&pool)
            .await
            .unwrap();
            return Some((folder, last_read_panel));
        }
    }

    None
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
