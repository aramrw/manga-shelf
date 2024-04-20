use chrono::format::ParseError;
use chrono::{DateTime, Local, NaiveDateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};
use tauri::{AppHandle, Manager};
use tokio::sync::Mutex;
use crate::manga::{MangaFolder, MangaPanel};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Stats {
    pub total_manga: i32,
    pub total_panels: i32,
    pub total_panels_read: i32,
    pub total_panels_remaining: i32,
}
