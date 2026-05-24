use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
enum ImportStatus {
    Completed,
    Failed,
    Importing,
    None,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct Project {
    id: String,
    name: String,
    creation_time: u64,
    updated_at: u64,
    import_status: Option<ImportStatus>,
}

fn get_projects_path(app_handle: &tauri::AppHandle) -> PathBuf {
    let mut path = app_handle
        .path()
        .app_data_dir()
        .expect("Failed to get app data dir");
    if !path.exists() {
        fs::create_dir_all(&path).expect("Failed to create app data dir");
    }
    path.push("projects.json");
    path
}

#[tauri::command]
fn get_projects(app_handle: tauri::AppHandle) -> Vec<Project> {
    let path = get_projects_path(&app_handle);
    if !path.exists() {
        return Vec::new();
    }

    let content = fs::read_to_string(path).unwrap_or_else(|_| "[]".to_string());
    serde_json::from_str(&content).unwrap_or_else(|_| Vec::new())
}

#[tauri::command]
fn create_project(app_handle: tauri::AppHandle, name: String) -> Project {
    let path = get_projects_path(&app_handle);
    let mut projects = get_projects(app_handle.clone());

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);

    let new_project = Project {
        id: uuid::Uuid::new_v4().to_string(),
        name,
        creation_time: now,
        updated_at: now,
        import_status: Some(ImportStatus::None),
    };

    projects.push(new_project.clone());
    let content = serde_json::to_string(&projects).expect("Failed to serialize projects");
    fs::write(path, content).expect("Failed to write projects file");

    new_project
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, get_projects, create_project])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
