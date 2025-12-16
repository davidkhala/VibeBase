use crate::models::{FileNode, PromptMetadata, Workspace};
use crate::commands::recent_projects::add_recent_project;
use std::fs;
use std::path::Path;
use uuid::Uuid;

#[tauri::command]
pub fn open_workspace(path: String) -> Result<Workspace, String> {
    let workspace_path = Path::new(&path);
    
    if !workspace_path.exists() {
        return Err("Workspace path does not exist".to_string());
    }

    if !workspace_path.is_dir() {
        return Err("Workspace path is not a directory".to_string());
    }

    let mut workspace = Workspace::new(path.clone());
    
    // Build file tree
    workspace.file_tree = build_file_tree(&path, &path)?;
    
    // Scan for .vibe.yaml files
    if let Ok(prompts) = scan_vibe_files(&path) {
        workspace.prompts = prompts;
    }

    // Add to recent projects
    let _ = add_recent_project(path);

    Ok(workspace)
}

#[tauri::command]
pub fn list_prompts(workspace_path: String) -> Result<Vec<PromptMetadata>, String> {
    scan_vibe_files(&workspace_path)
}

#[tauri::command]
pub fn create_folder(folder_path: String) -> Result<(), String> {
    fs::create_dir_all(&folder_path).map_err(|e| e.to_string())?;
    Ok(())
}

fn build_file_tree(root_path: &str, current_path: &str) -> Result<FileNode, String> {
    let current = Path::new(current_path);
    let name = current
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_string();

    // Skip hidden files/folders
    if name.starts_with('.') && current_path != root_path {
        return Err("Hidden".to_string());
    }

    if current.is_dir() {
        let entries = fs::read_dir(current_path).map_err(|e| e.to_string())?;
        let mut children = Vec::new();

        for entry in entries {
            if let Ok(entry) = entry {
                let path = entry.path();
                if let Some(path_str) = path.to_str() {
                    if let Ok(node) = build_file_tree(root_path, path_str) {
                        children.push(node);
                    }
                }
            }
        }

        // Sort: folders first, then files, alphabetically
        children.sort_by(|a, b| {
            match (a, b) {
                (FileNode::Folder { name: n1, .. }, FileNode::Folder { name: n2, .. }) => {
                    n1.to_lowercase().cmp(&n2.to_lowercase())
                }
                (FileNode::File { name: n1, .. }, FileNode::File { name: n2, .. }) => {
                    n1.to_lowercase().cmp(&n2.to_lowercase())
                }
                (FileNode::Folder { .. }, FileNode::File { .. }) => std::cmp::Ordering::Less,
                (FileNode::File { .. }, FileNode::Folder { .. }) => std::cmp::Ordering::Greater,
            }
        });

        Ok(FileNode::Folder {
            name,
            path: current_path.to_string(),
            children,
            expanded: true,
        })
    } else {
        let is_vibe_file = name.ends_with(".vibe.yaml") || name.ends_with(".vibe.yml") || name.ends_with(".vibe.md");

        Ok(FileNode::File {
            name,
            path: current_path.to_string(),
            is_vibe_file,
        })
    }
}

fn scan_vibe_files(root_path: &str) -> Result<Vec<PromptMetadata>, String> {
    let mut prompts = Vec::new();
    scan_directory(root_path, root_path, &mut prompts)?;
    Ok(prompts)
}

fn scan_directory(
    root_path: &str,
    current_path: &str,
    prompts: &mut Vec<PromptMetadata>,
) -> Result<(), String> {
    let entries = fs::read_dir(current_path).map_err(|e| e.to_string())?;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        // Skip hidden files and directories
        if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
            if name.starts_with('.') {
                continue;
            }
        }

        if path.is_dir() {
            // Recursively scan subdirectories
            if let Some(path_str) = path.to_str() {
                scan_directory(root_path, path_str, prompts)?;
            }
        } else if let Some(file_name) = path.file_name().and_then(|n| n.to_str()) {
            // Check if it's a .vibe.yaml, .vibe.yml, or .vibe.md file
            if file_name.ends_with(".vibe.yaml") || file_name.ends_with(".vibe.yml") || file_name.ends_with(".vibe.md") {
                let absolute_path = path.to_str().unwrap_or("").to_string();
                let relative_path = absolute_path
                    .strip_prefix(root_path)
                    .unwrap_or(&absolute_path)
                    .trim_start_matches('/')
                    .trim_start_matches('\\')
                    .to_string();

                prompts.push(PromptMetadata {
                    id: Uuid::new_v4().to_string(),
                    file_path: absolute_path.clone(),
                    name: file_name.to_string(),
                    relative_path,
                });
            }
        }
    }

    Ok(())
}
