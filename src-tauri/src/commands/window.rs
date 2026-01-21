#![allow(unexpected_cfgs)]

use tauri::{Manager, Window, WebviewUrl, WebviewWindowBuilder};

#[cfg(target_os = "macos")]
use tauri::window::{Effect, EffectState, EffectsBuilder};

#[cfg(target_os = "macos")]
use objc::{msg_send, sel, sel_impl};

#[cfg(target_os = "macos")]
fn apply_macos_window_style(window: &tauri::WebviewWindow, window_name: &str) -> Result<(), String> {
    use cocoa::appkit::NSColor;
    use cocoa::base::{id, nil};
    
    println!("🎨 [{}] Setting window background to transparent", window_name);
    unsafe {
        let ns_window = window.ns_window().map_err(|e| e.to_string())? as id;
        // Set window background to completely transparent
        let bg_color = NSColor::colorWithRed_green_blue_alpha_(nil, 0.0, 0.0, 0.0, 0.0);
        let _: () = msg_send![ns_window, setBackgroundColor: bg_color];
        
        // Also set opaque to false
        let _: () = msg_send![ns_window, setOpaque: false];
    }
    
    println!("🎨 [{}] Applying window effects: Popover with radius 12.0", window_name);
    let effects = EffectsBuilder::new()
        .effect(Effect::Popover)
        .state(EffectState::Active)
        .radius(12.0)
        .build();
    
    match window.set_effects(effects) {
        Ok(_) => println!("✅ [{}] Window effects applied successfully", window_name),
        Err(e) => println!("❌ [{}] Failed to apply window effects: {}", window_name, e),
    }
    
    Ok(())
}

#[tauri::command]
pub async fn open_variables_window(window: Window) -> Result<(), String> {
    let app_handle = window.app_handle();
    
    // Check if window already exists
    if let Some(existing_window) = app_handle.get_webview_window("variables") {
        existing_window.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    // Create new window without decorations
    // We'll implement custom window controls in the UI
    let window_url = if cfg!(debug_assertions) {
        // Development mode: use the full URL with port
        "http://localhost:1420/variables.html"
    } else {
        // Production mode: use the bundled HTML
        "variables.html"
    };

    let builder = WebviewWindowBuilder::new(app_handle, "variables", WebviewUrl::App(window_url.into()))
        .title("Global Variables")
        .inner_size(800.0, 700.0)
        .min_inner_size(600.0, 500.0)
        .resizable(true)
        .center()
        .decorations(false)
        .title_bar_style(tauri::TitleBarStyle::Overlay);
    
    #[cfg(target_os = "macos")]
    let builder = builder
        .transparent(true)
        .hidden_title(true);
    
    let window = builder.build().map_err(|e| e.to_string())?;

    #[cfg(target_os = "macos")]
    apply_macos_window_style(&window, "Variables")?;

    Ok(())
}

#[tauri::command]
pub async fn open_settings_window(window: Window) -> Result<(), String> {
    let app_handle = window.app_handle();
    
    // Check if window already exists
    if let Some(existing_window) = app_handle.get_webview_window("settings") {
        existing_window.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    // Create new window without decorations
    let window_url = if cfg!(debug_assertions) {
        "http://localhost:1420/settings.html"
    } else {
        "settings.html"
    };

    let builder = WebviewWindowBuilder::new(app_handle, "settings", WebviewUrl::App(window_url.into()))
        .title("Settings")
        .inner_size(1200.0, 800.0)
        .min_inner_size(1000.0, 600.0)
        .resizable(true)
        .center()
        .decorations(false)
        .title_bar_style(tauri::TitleBarStyle::Overlay);
    
    #[cfg(target_os = "macos")]
    let builder = builder
        .transparent(true)
        .hidden_title(true);
    
    let window = builder.build().map_err(|e| e.to_string())?;

    #[cfg(target_os = "macos")]
    apply_macos_window_style(&window, "Settings")?;

    Ok(())
}

#[tauri::command]
pub fn set_window_theme(window: Window, theme: String) -> Result<(), String> {
    println!("🎨 [Rust] set_window_theme called with theme: {}", theme);
    
    #[cfg(target_os = "macos")]
    {
        use cocoa::base::{id, nil};
        use cocoa::foundation::NSString;
        use objc::{class, msg_send, sel, sel_impl};
        
        // In Tauri 2.x, use the window's native handle
        unsafe {
            use raw_window_handle::{HasWindowHandle, RawWindowHandle};
            
            let window_handle = window.window_handle().map_err(|e| format!("Failed to get window handle: {}", e))?;
            let ns_window = match window_handle.as_ref() {
                RawWindowHandle::AppKit(handle) => {
                    // In raw-window-handle 0.6, we need to get the NSView first, then get its window
                    let ns_view = handle.ns_view.as_ptr() as id;
                    let ns_window: id = msg_send![ns_view, window];
                    ns_window
                },
                _ => return Err("Not a macOS window".to_string()),
            };
                
                let appearance_name_str = match theme.as_str() {
                    "dark" => {
                        println!("🌙 [Rust] Setting DARK theme (NSAppearanceNameDarkAqua)");
                        "NSAppearanceNameDarkAqua"
                    },
                    "light" => {
                        println!("☀️ [Rust] Setting LIGHT theme (NSAppearanceNameAqua)");
                        "NSAppearanceNameAqua"
                    },
                    _ => {
                        println!("🖥️ [Rust] Setting SYSTEM theme (nil)");
                        // For "system", set appearance to nil (use system default)
                        let _: () = msg_send![ns_window, setAppearance: nil];
                        return Ok(());
                    }
                };
                
            let appearance_name = NSString::alloc(nil).init_str(appearance_name_str);
            let appearance: id = msg_send![class!(NSAppearance), appearanceNamed: appearance_name];
            let _: () = msg_send![ns_window, setAppearance: appearance];
            println!("✅ [Rust] Window appearance set successfully");
        }
    }
    
    #[cfg(not(target_os = "macos"))]
    {
        // On other platforms, this is a no-op
        let _ = (window, theme);
    }
    
    Ok(())
}

#[tauri::command]
pub async fn open_arena_window(window: Window) -> Result<(), String> {
    let app_handle = window.app_handle();
    
    // Check if window already exists
    if let Some(existing_window) = app_handle.get_webview_window("arena") {
        existing_window.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    // Create new window without decorations
    let window_url = if cfg!(debug_assertions) {
        "http://localhost:1420/arena.html"
    } else {
        "arena.html"
    };

    let builder = WebviewWindowBuilder::new(app_handle, "arena", WebviewUrl::App(window_url.into()))
        .title("Arena")
        .inner_size(1400.0, 900.0)
        .min_inner_size(1200.0, 700.0)
        .resizable(true)
        .center()
        .decorations(false)
        .title_bar_style(tauri::TitleBarStyle::Overlay);
    
    #[cfg(target_os = "macos")]
    let builder = builder
        .transparent(true)
        .hidden_title(true);
    
    let window = builder.build().map_err(|e| e.to_string())?;

    #[cfg(target_os = "macos")]
    apply_macos_window_style(&window, "Arena")?;

    Ok(())
}

#[tauri::command]
pub async fn open_arena_history_window(window: Window) -> Result<(), String> {
    let app_handle = window.app_handle();
    
    // Check if window already exists
    if let Some(existing_window) = app_handle.get_webview_window("arena_history") {
        existing_window.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    // Create new window without decorations
    let window_url = if cfg!(debug_assertions) {
        "http://localhost:1420/arena-history.html"
    } else {
        "arena-history.html"
    };

    let builder = WebviewWindowBuilder::new(app_handle, "arena_history", WebviewUrl::App(window_url.into()))
        .title("Arena History")
        .inner_size(1400.0, 900.0)
        .min_inner_size(1200.0, 700.0)
        .resizable(true)
        .center()
        .decorations(false)
        .title_bar_style(tauri::TitleBarStyle::Overlay);
    
    #[cfg(target_os = "macos")]
    let builder = builder
        .transparent(true)
        .hidden_title(true);
    
    let window = builder.build().map_err(|e| e.to_string())?;

    #[cfg(target_os = "macos")]
    apply_macos_window_style(&window, "ArenaHistory")?;

    Ok(())
}

#[tauri::command]
pub async fn open_arena_statistics_window(window: Window) -> Result<(), String> {
    let app_handle = window.app_handle();
    
    // Check if window already exists
    if let Some(existing_window) = app_handle.get_webview_window("arena_statistics") {
        existing_window.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    // Create new window without decorations
    let window_url = if cfg!(debug_assertions) {
        "http://localhost:1420/arena-statistics.html"
    } else {
        "arena-statistics.html"
    };

    let builder = WebviewWindowBuilder::new(app_handle, "arena_statistics", WebviewUrl::App(window_url.into()))
        .title("Arena Statistics")
        .inner_size(1200.0, 800.0)
        .min_inner_size(1000.0, 600.0)
        .resizable(true)
        .center()
        .decorations(false)
        .title_bar_style(tauri::TitleBarStyle::Overlay);
    
    #[cfg(target_os = "macos")]
    let builder = builder
        .transparent(true)
        .hidden_title(true);
    
    let window = builder.build().map_err(|e| e.to_string())?;

    // Apply window effects for rounded corners on macOS
    #[cfg(target_os = "macos")]
    {
        let effects = EffectsBuilder::new()
            .effect(Effect::Popover)
            .state(EffectState::Active)
            .radius(12.0)
            .build();
        
        window.set_effects(effects).ok();
    }

    Ok(())
}

#[tauri::command]
pub fn get_system_theme() -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        use cocoa::appkit::NSApplication;
        use cocoa::base::nil;
        use objc::{msg_send, sel, sel_impl};
        
        unsafe {
            let app = NSApplication::sharedApplication(nil);
            let appearance: cocoa::base::id = msg_send![app, effectiveAppearance];
            let name: cocoa::base::id = msg_send![appearance, name];
            let name_str: *const i8 = msg_send![name, UTF8String];
            let name_string = std::ffi::CStr::from_ptr(name_str).to_string_lossy();
            
            println!("🔍 [Rust] macOS system appearance: {}", name_string);
            
            // Check if it's a dark appearance
            if name_string.contains("Dark") {
                println!("🌙 [Rust] System theme is DARK");
                Ok("dark".to_string())
            } else {
                println!("☀️ [Rust] System theme is LIGHT");
                Ok("light".to_string())
            }
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        use winreg::enums::*;
        use winreg::RegKey;
        
        // Try to read Windows registry for theme preference
        // HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize
        // AppsUseLightTheme: 0 = dark, 1 = light
        
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        match hkcu.open_subkey("Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize") {
            Ok(personalize) => {
                match personalize.get_value::<u32, _>("AppsUseLightTheme") {
                    Ok(value) => {
                        let theme = if value == 0 { "dark" } else { "light" };
                        println!("🔍 [Rust] Windows theme from registry: {} (value: {})", theme, value);
                        Ok(theme.to_string())
                    }
                    Err(e) => {
                        println!("⚠️ [Rust] Failed to read AppsUseLightTheme: {}", e);
                        // Fallback to light theme
                        Ok("light".to_string())
                    }
                }
            }
            Err(e) => {
                println!("⚠️ [Rust] Failed to open registry key: {}", e);
                // Fallback to light theme
                Ok("light".to_string())
            }
        }
    }
    
    #[cfg(target_os = "linux")]
    {
        // 1. Try to detect from GTK_THEME environment variable (existing logic)
        if let Ok(gtk_theme) = std::env::var("GTK_THEME") {
            if gtk_theme.to_lowercase().contains("dark") {
                println!("🔍 [Rust] Linux GTK_THEME indicates dark mode");
                return Ok("dark".to_string());
            }
        }

        // 2. Try to detect from gsettings (for GNOME/Ubuntu)
        use std::process::Command;
        
        // Check color-scheme (newer GNOME)
        if let Ok(output) = Command::new("gsettings")
            .args(&["get", "org.gnome.desktop.interface", "color-scheme"])
            .output() 
        {
            let stdout = String::from_utf8_lossy(&output.stdout).to_lowercase();
            if stdout.contains("dark") {
                 println!("🔍 [Rust] Linux gsettings color-scheme indicates dark mode");
                 return Ok("dark".to_string());
            }
        }

        // Check gtk-theme (older GNOME / fallback)
        if let Ok(output) = Command::new("gsettings")
            .args(&["get", "org.gnome.desktop.interface", "gtk-theme"])
            .output() 
        {
            let stdout = String::from_utf8_lossy(&output.stdout).to_lowercase();
            if stdout.contains("dark") || stdout.contains("-dark") {
                 println!("🔍 [Rust] Linux gsettings gtk-theme indicates dark mode");
                 return Ok("dark".to_string());
            }
        }
        
        println!("ℹ️ [Rust] Linux: Unable to determine theme, defaulting to light");
        Ok("light".to_string())
    }
    
    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        // For other platforms (BSD, etc.), default to light
        Ok("light".to_string())
    }
}

#[tauri::command]
pub fn get_platform() -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        Ok("macos".to_string())
    }
    
    #[cfg(target_os = "windows")]
    {
        Ok("windows".to_string())
    }
    
    #[cfg(target_os = "linux")]
    {
        Ok("linux".to_string())
    }
    
    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        Ok("unknown".to_string())
    }
}
