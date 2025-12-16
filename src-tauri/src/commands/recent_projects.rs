use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::time::SystemTime;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RecentProject {
    pub id: String,
    pub path: String,
    pub name: String,
    pub last_opened: i64,
    pub pinned: bool,
}

fn get_app_db_path() -> Result<String, String> {
    let home_dir = dirs::home_dir().ok_or("Failed to get home directory")?;
    let vibebase_dir = home_dir.join(".vibebase");
    std::fs::create_dir_all(&vibebase_dir).map_err(|e| e.to_string())?;
    
    Ok(vibebase_dir
        .join("app.db")
        .to_str()
        .ok_or("Invalid path")?
        .to_string())
}

fn get_connection() -> Result<Connection, String> {
    let db_path = get_app_db_path()?;
    Connection::open(db_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_recent_project(path: String) -> Result<(), String> {
    let conn = get_connection()?;
    
    // Get folder name from path
    let path_obj = Path::new(&path);
    let name = path_obj
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("Unknown")
        .to_string();
    
    let now = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_secs() as i64;
    
    // Check if project already exists
    let existing: Result<String, _> = conn.query_row(
        "SELECT id FROM recent_projects WHERE path = ?1",
        params![&path],
        |row| row.get(0),
    );
    
    match existing {
        Ok(id) => {
            // Update existing project
            conn.execute(
                "UPDATE recent_projects SET name = ?1, last_opened = ?2 WHERE id = ?3",
                params![&name, now, &id],
            )
            .map_err(|e| e.to_string())?;
        }
        Err(_) => {
            // Insert new project
            let id = Uuid::new_v4().to_string();
            conn.execute(
                "INSERT INTO recent_projects (id, path, name, last_opened, pinned) VALUES (?1, ?2, ?3, ?4, 0)",
                params![&id, &path, &name, now],
            )
            .map_err(|e| e.to_string())?;
        }
    }
    
    Ok(())
}

#[tauri::command]
pub fn get_recent_projects(limit: Option<i32>) -> Result<Vec<RecentProject>, String> {
    let conn = get_connection()?;
    let query_limit = limit.unwrap_or(10);
    
    let mut stmt = conn
        .prepare("SELECT id, path, name, last_opened, pinned FROM recent_projects ORDER BY pinned DESC, last_opened DESC LIMIT ?1")
        .map_err(|e| e.to_string())?;
    
    let projects = stmt
        .query_map(params![query_limit], |row| {
            Ok(RecentProject {
                id: row.get(0)?,
                path: row.get(1)?,
                name: row.get(2)?,
                last_opened: row.get(3)?,
                pinned: row.get::<_, i32>(4)? != 0,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();
    
    Ok(projects)
}

#[tauri::command]
pub fn remove_recent_project(id: String) -> Result<(), String> {
    let conn = get_connection()?;
    
    conn.execute("DELETE FROM recent_projects WHERE id = ?1", params![&id])
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub fn toggle_pin_project(id: String) -> Result<(), String> {
    let conn = get_connection()?;
    
    conn.execute(
        "UPDATE recent_projects SET pinned = NOT pinned WHERE id = ?1",
        params![&id],
    )
    .map_err(|e| e.to_string())?;
    
    Ok(())
}
