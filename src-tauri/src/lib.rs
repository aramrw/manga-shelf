// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
mod db;
mod global;
mod manga;
mod misc;
mod stats;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let handle = app.handle();
            let app_data_dir = handle.path().app_data_dir().unwrap();
            if !app_data_dir.exists() {
                std::fs::create_dir(&app_data_dir).unwrap();
            }

            db::create_database(
                app_data_dir.join("main.db").to_str().unwrap(),
                handle.clone(),
            );

            misc::close_open_instance();

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            manga::update_parent_folders,
            manga::update_manga_folders,
            manga::update_manga_panel,
            manga::get_parent_folders,
            manga::get_manga_folders,
            manga::get_manga_panel,
            manga::find_last_read_panel,
            manga::delete_folder,
            manga::update_folder_time_spent_reading,
            manga::get_next_or_previous_manga_folder,
            manga::update_folder_double_panels,
            manga::set_folder_read,
            manga::set_folder_unread,
            global::set_global_manga_folder,
            global::set_global_parent_folder,
            global::get_global_manga,
            global::get_global_parent,
            stats::fetch_daily_manga_folders,
            stats::create_manga_stats,
            stats::update_global_stats,
            stats::create_chart_stats,
            stats::update_chart_watchtime,
            misc::show_in_folder,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
