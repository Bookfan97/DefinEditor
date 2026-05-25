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
    path: Option<String>,
    creation_time: u64,
    updated_at: u64,
    #[serde(default)]
    last_opened: u64,
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
        path: None,
        creation_time: now,
        updated_at: now,
        last_opened: now,
        import_status: Some(ImportStatus::None),
    };

    projects.push(new_project.clone());
    let content = serde_json::to_string(&projects).expect("Failed to serialize projects");
    fs::write(path, content).expect("Failed to write projects file");

    new_project
}

#[tauri::command]
fn open_project(app_handle: tauri::AppHandle, id: String) -> Result<Project, String> {
    let path = get_projects_path(&app_handle);
    let mut projects = get_projects(app_handle.clone());

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);

    let project = if let Some(project) = projects.iter_mut().find(|p| p.id == id) {
        project.last_opened = now;
        project.clone()
    } else {
        return Err("Project not found".to_string());
    };

    let content = serde_json::to_string(&projects).map_err(|e| e.to_string())?;
    fs::write(path, content).map_err(|e| e.to_string())?;
    Ok(project)
}

#[tauri::command]
fn import_project(app_handle: tauri::AppHandle, path_str: String) -> Result<Project, String> {
    let projects_json_path = get_projects_path(&app_handle);
    let mut projects = get_projects(app_handle.clone());

    let project_path = PathBuf::from(&path_str);
    let name = project_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("Unknown Project")
        .to_string();

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);

    // Check if already imported
    if let Some(project) = projects.iter_mut().find(|p| p.path == Some(path_str.clone())) {
        project.last_opened = now;
        let project_clone = project.clone();
        let content = serde_json::to_string(&projects).map_err(|e| e.to_string())?;
        fs::write(projects_json_path, content).map_err(|e| e.to_string())?;
        return Ok(project_clone);
    }

    let new_project = Project {
        id: uuid::Uuid::new_v4().to_string(),
        name,
        path: Some(path_str),
        creation_time: now,
        updated_at: now,
        last_opened: now,
        import_status: Some(ImportStatus::Completed),
    };

    projects.push(new_project.clone());
    let content = serde_json::to_string(&projects).map_err(|e| e.to_string())?;
    fs::write(projects_json_path, content).map_err(|e| e.to_string())?;

    Ok(new_project)
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
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_projects,
            create_project,
            open_project,
            import_project
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
