use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{Manager, Emitter};

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

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct FileDoc {
    #[serde(rename = "_id")]
    id: String,
    #[serde(rename = "_creationTime")]
    creation_time: u64,
    project_id: String,
    name: String,
    #[serde(rename = "type")]
    entry_type: String,
    parent_id: Option<String>,
    content: Option<String>,
}

#[tauri::command]
fn get_file(id: String) -> Result<FileDoc, String> {
    let path = PathBuf::from(&id);
    if !path.exists() {
        return Err("File not found".to_string());
    }

    let name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_string();

    let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
    let entry_type = if metadata.is_dir() { "folder" } else { "file" };
    let creation_time = metadata
        .created()
        .or_else(|_| metadata.modified())
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);

    let content = if entry_type == "file" {
        fs::read_to_string(&path).ok()
    } else {
        None
    };

    // We don't have project_id easily available here without more context,
    // but we can try to infer it or just leave it empty if it's not strictly needed for the editor view.
    // The editor view seems to only care about _id, name, and content.
    
    Ok(FileDoc {
        id: id.clone(),
        creation_time,
        project_id: "".to_string(), // Placeholder
        name,
        entry_type: entry_type.to_string(),
        parent_id: None, // Placeholder
        content,
    })
}

#[tauri::command]
fn get_file_path(app_handle: tauri::AppHandle, id: String) -> Result<Vec<FileDoc>, String> {
    let path = PathBuf::from(&id);
    if !path.exists() {
        return Err("File not found".to_string());
    }

    // Find which project this file belongs to
    let projects = get_projects(app_handle);
    let project = projects.iter().find(|p| {
        if let Some(p_path) = &p.path {
            path.starts_with(p_path)
        } else {
            false
        }
    }).ok_or_else(|| "Project not found for this file".to_string())?;

    let project_path = PathBuf::from(project.path.as_ref().unwrap());
    let mut current = path.clone();
    let mut result = Vec::new();

    while current.starts_with(&project_path) {
        let name = current
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string();

        let metadata = fs::metadata(&current).map_err(|e| e.to_string())?;
        let entry_type = if metadata.is_dir() { "folder" } else { "file" };
        let creation_time = metadata
            .created()
            .or_else(|_| metadata.modified())
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0);

        result.push(FileDoc {
            id: current.to_string_lossy().to_string(),
            creation_time,
            project_id: project.id.clone(),
            name,
            entry_type: entry_type.to_string(),
            parent_id: current.parent().map(|p| p.to_string_lossy().to_string()),
            content: None,
        });

        if current == project_path {
            break;
        }
        if let Some(parent) = current.parent() {
            current = parent.to_path_buf();
        } else {
            break;
        }
    }

    result.reverse();
    Ok(result)
}

#[tauri::command]
fn update_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(())
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

#[tauri::command]
fn get_project(app_handle: tauri::AppHandle, id: String) -> Result<Project, String> {
    let projects = get_projects(app_handle);
    projects
        .into_iter()
        .find(|p| p.id == id)
        .ok_or_else(|| "Project not found".to_string())
}

#[tauri::command]
fn rename_project(app_handle: tauri::AppHandle, id: String, name: String) -> Result<Project, String> {
    let path = get_projects_path(&app_handle);
    let mut projects = get_projects(app_handle.clone());

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);

    let project = if let Some(project) = projects.iter_mut().find(|p| p.id == id) {
        project.name = name;
        project.updated_at = now;
        project.clone()
    } else {
        return Err("Project not found".to_string());
    };

    let content = serde_json::to_string(&projects).map_err(|e| e.to_string())?;
    fs::write(path, content).map_err(|e| e.to_string())?;
    Ok(project)
}

#[tauri::command]
fn list_files(
    app_handle: tauri::AppHandle,
    project_id: String,
    parent_id: Option<String>,
) -> Result<Vec<FileDoc>, String> {
    let projects = get_projects(app_handle);
    let project = projects
        .iter()
        .find(|p| p.id == project_id)
        .ok_or_else(|| "Project not found".to_string())?;

    let project_path = project
        .path
        .as_ref()
        .ok_or_else(|| "Project path not set".to_string())?;
    let base_path = PathBuf::from(project_path);

    let search_path = if let Some(p_id) = &parent_id {
        PathBuf::from(p_id)
    } else {
        base_path.clone()
    };

    if !search_path.starts_with(&base_path) {
        return Err("Access denied: path is outside of project directory".to_string());
    }

    let entries = fs::read_dir(&search_path).map_err(|e| e.to_string())?;
    let mut result = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();

        // Skip hidden files
        if name.starts_with('.') {
            continue;
        }

        let metadata = entry.metadata().map_err(|e| e.to_string())?;
        let entry_type = if metadata.is_dir() { "folder" } else { "file" };
        let creation_time = metadata
            .created()
            .or_else(|_| metadata.modified())
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0);

        result.push(FileDoc {
            id: path.to_string_lossy().to_string(),
            creation_time,
            project_id: project_id.clone(),
            name,
            entry_type: entry_type.to_string(),
            parent_id: parent_id.clone(),
            content: None,
        });
    }

    // Sort: folders first, then alphabetically
    result.sort_by(|a, b| {
        if a.entry_type != b.entry_type {
            if a.entry_type == "folder" {
                std::cmp::Ordering::Less
            } else {
                std::cmp::Ordering::Greater
            }
        } else {
            a.name.cmp(&b.name)
        }
    });

    Ok(result)
}

#[tauri::command]
fn create_file_at_path(app_handle: tauri::AppHandle, path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| e.to_string())?;
    let _ = app_handle.emit("files-changed", ());
    Ok(())
}

#[tauri::command]
fn create_dir_at_path(app_handle: tauri::AppHandle, path: String) -> Result<(), String> {
    fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    let _ = app_handle.emit("files-changed", ());
    Ok(())
}

#[tauri::command]
fn delete_file_at_path(app_handle: tauri::AppHandle, path: String) -> Result<(), String> {
    let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
    if metadata.is_dir() {
        fs::remove_dir_all(&path).map_err(|e| e.to_string())?;
    } else {
        fs::remove_file(&path).map_err(|e| e.to_string())?;
    }
    let _ = app_handle.emit("files-changed", ());
    Ok(())
}

#[tauri::command]
fn rename_file_at_path(app_handle: tauri::AppHandle, old_path: String, new_path: String) -> Result<(), String> {
    fs::rename(&old_path, &new_path).map_err(|e| e.to_string())?;
    let _ = app_handle.emit("files-changed", ());
    Ok(())
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
            import_project,
            get_project,
            rename_project,
            list_files,
            get_file,
            get_file_path,
            update_file,
            create_file_at_path,
            create_dir_at_path,
            delete_file_at_path,
            rename_file_at_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
