use std::process::Command;

use std::sync::LazyLock;

use regex::Regex;
use sysinfo::System;

pub static NUMBER_REGEX: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"(\d+)\D*$").unwrap());

#[tauri::command]
pub fn show_in_folder(path: String) {
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .args(["/select,", &path]) // The comma after select is not a typo
            .spawn()
            .unwrap();
    }

    // #[cfg(target_os = "linux")]
    // {
    //     if path.contains(",") {
    //         // see https://gitlab.freedesktop.org/dbus/dbus/-/issues/76
    //         let new_path = match metadata(&path).unwrap().is_dir() {
    //             true => path,
    //             false => {
    //                 let mut path2 = PathBuf::from(path);
    //                 path2.pop();
    //                 path2.into_os_string().into_string().unwrap()
    //             }
    //         };
    //         Command::new("xdg-open").arg(&new_path).spawn().unwrap();
    //     } else {
    //         if let Ok(Fork::Child) = daemon(false, false) {
    //             Command::new("dbus-send")
    //                 .args([
    //                     "--session",
    //                     "--dest=org.freedesktop.FileManager1",
    //                     "--type=method_call",
    //                     "/org/freedesktop/FileManager1",
    //                     "org.freedesktop.FileManager1.ShowItems",
    //                     format!("array:string:\"file://{path}\"").as_str(),
    //                     "string:\"\"",
    //                 ])
    //                 .spawn()
    //                 .unwrap();
    //         }
    //     }
    // }
    //

    #[cfg(target_os = "macos")]
    {
        Command::new("open").args(["-R", &path]).spawn().unwrap();
    }
}

pub fn close_open_instance() -> bool {
    let mut sys = System::new_all();
    sys.refresh_all();

    // Collect and sort processes matching "mpv-shelf"
    let mut manga_shelf_processes: Vec<_> = sys
        .processes()
        .iter()
        .filter(|(_pid, process)| {
            process
                .name()
                .to_string_lossy()
                .to_lowercase()
                .contains("manga")
        })
        .collect();

    manga_shelf_processes.sort_by_key(|(pid, _process)| pid.as_u32());

    // Get the current process ID
    let this_proc_id = std::process::id();

    if manga_shelf_processes.len() > 1 {
        for (pid, _process) in manga_shelf_processes {
            // Skip the current process
            if pid.as_u32() == this_proc_id {
                continue;
            }
            // Attempt to kill the other instances
            if let Some(proc) = sys.process(*pid) {
                proc.kill();
            }
        }
    }

    true
}
