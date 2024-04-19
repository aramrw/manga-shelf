// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod db;
mod global;
mod manga;
mod misc;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle();
            let app_data_dir = handle.path_resolver().app_data_dir().unwrap();
            if !app_data_dir.exists() {
                std::fs::create_dir(&app_data_dir).unwrap();
            }

            db::create_database(
                app_data_dir.join("main.db").to_str().unwrap(),
                handle.clone(),
            );

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            manga::update_manga_folders,
            manga::get_manga_folders,
            manga::update_manga_panel,
            manga::get_manga_panels,
            manga::find_last_read_panel,
            manga::get_manga_panel,
            manga::delete_manga_folder,
            global::set_global_manga,
            global::get_global_manga,
            misc::show_in_folder,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
