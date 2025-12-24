use serde::{Deserialize, Serialize};
use tauri_plugin_updater::UpdaterExt;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VersionInfo {
    pub current_version: String,
    pub latest_version: String,
    pub update_available: bool,
    pub download_url: String,
    pub release_notes: String,
}

#[tauri::command]
pub async fn check_for_updates(app: tauri::AppHandle) -> Result<VersionInfo, String> {
    let current_version = app.package_info().version.to_string();
    
    // Use Tauri updater to check for updates
    let updater = app.updater().map_err(|e| format!("Failed to get updater: {}", e))?;
    match updater.check().await {
        Ok(Some(update)) => {
            let body = update.body.clone().unwrap_or_default();
            Ok(VersionInfo {
                current_version,
                latest_version: update.version.clone(),
                update_available: true,
                download_url: format!("https://github.com/Geoion/VibeBase/releases/tag/{}", update.version),
                release_notes: body,
            })
        }
        Ok(None) => {
            Ok(VersionInfo {
                current_version: current_version.clone(),
                latest_version: current_version,
                update_available: false,
                download_url: String::new(),
                release_notes: "You are using the latest version".to_string(),
            })
        }
        Err(e) => Err(format!("Failed to check for updates: {}", e))
    }
}

#[tauri::command]
pub async fn install_update(app: tauri::AppHandle) -> Result<(), String> {
    let updater = app.updater().map_err(|e| format!("Failed to get updater: {}", e))?;
    match updater.check().await {
        Ok(Some(update)) => {
            update.download_and_install(|_, _| {}, || {}).await
                .map_err(|e| format!("Failed to install update: {}", e))?;
            Ok(())
        }
        Ok(None) => {
            Err("No update available".to_string())
        }
        Err(e) => Err(format!("Failed to check for updates: {}", e))
    }
}

#[tauri::command]
pub fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}
