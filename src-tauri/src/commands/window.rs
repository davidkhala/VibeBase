use tauri::{Manager, Window, WindowBuilder, WindowUrl};

#[tauri::command]
pub fn open_variables_window(window: Window) -> Result<(), String> {
    let app_handle = window.app_handle();
    
    // Check if window already exists
    if let Some(existing_window) = app_handle.get_window("variables") {
        existing_window.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    // Create new window without decorations
    // We'll implement custom window controls in the UI
    let window_url = if cfg!(debug_assertions) {
        // Development mode: use the full URL with port
        WindowUrl::External("http://localhost:1420/variables.html".parse().unwrap())
    } else {
        // Production mode: use the bundled HTML
        WindowUrl::App("variables.html".into())
    };

    WindowBuilder::new(
        &app_handle,
        "variables",
        window_url
    )
    .title("全局变量")
    .inner_size(800.0, 700.0)
    .min_inner_size(600.0, 500.0)
    .resizable(true)
    .center()
    .decorations(false)
    .build()
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn open_settings_window(window: Window) -> Result<(), String> {
    let app_handle = window.app_handle();
    
    // Check if window already exists
    if let Some(existing_window) = app_handle.get_window("settings") {
        existing_window.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    // Create new window without decorations
    let window_url = if cfg!(debug_assertions) {
        WindowUrl::External("http://localhost:1420/settings.html".parse().unwrap())
    } else {
        WindowUrl::App("settings.html".into())
    };

    WindowBuilder::new(
        &app_handle,
        "settings",
        window_url
    )
    .title("设置")
    .inner_size(1200.0, 800.0)
    .min_inner_size(1000.0, 600.0)
    .resizable(true)
    .center()
    .decorations(false)
    .build()
    .map_err(|e| e.to_string())?;

    Ok(())
}
