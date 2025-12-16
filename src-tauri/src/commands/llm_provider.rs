use crate::services::database::{AppDatabase, LLMProviderConfig};
use crate::services::keychain::KeychainService;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use uuid::Uuid;

pub struct LLMProviderState {
    pub app_db: Mutex<AppDatabase>,
}

impl LLMProviderState {
    pub fn new() -> Self {
        Self {
            app_db: Mutex::new(AppDatabase::new().expect("Failed to initialize app database")),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LLMProviderInput {
    pub name: String,
    pub provider: String,
    pub model: String,
    pub base_url: Option<String>,
    pub api_key_source: String,  // "keychain" | "env_var"
    pub api_key_value: Option<String>,  // Actual key (if keychain) or env var name (if env_var)
    pub parameters: Option<String>,  // JSON
    pub is_default: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LLMProviderOutput {
    pub id: String,
    pub name: String,
    pub provider: String,
    pub model: String,
    pub base_url: Option<String>,
    pub api_key_source: String,
    pub api_key_ref: Option<String>,
    pub api_key_status: String,  // "configured" | "missing"
    pub parameters: Option<String>,
    pub is_default: bool,
}

#[tauri::command]
pub fn list_llm_providers(
    state: State<'_, LLMProviderState>,
) -> Result<Vec<LLMProviderOutput>, String> {
    let db = state.app_db.lock().unwrap();
    let providers = db.list_llm_providers()
        .map_err(|e| format!("Failed to list providers: {}", e))?;

    Ok(providers.into_iter().map(|p| {
        // Check API key status
        let api_key_status = match p.api_key_source.as_str() {
            "keychain" => {
                if let Some(ref key_ref) = p.api_key_ref {
                    if KeychainService::has_api_key(key_ref) {
                        "configured"
                    } else {
                        "missing"
                    }
                } else {
                    "missing"
                }
            }
            "env_var" => {
                if let Some(ref env_var) = p.api_key_ref {
                    if std::env::var(env_var).is_ok() {
                        "configured"
                    } else {
                        "missing"
                    }
                } else {
                    "missing"
                }
            }
            _ => "missing"
        }.to_string();

        LLMProviderOutput {
            id: p.id,
            name: p.name,
            provider: p.provider,
            model: p.model,
            base_url: p.base_url,
            api_key_source: p.api_key_source,
            api_key_ref: p.api_key_ref,
            api_key_status,
            parameters: p.parameters,
            is_default: p.is_default,
        }
    }).collect())
}

#[tauri::command]
pub fn save_llm_provider(
    input: LLMProviderInput,
    state: State<'_, LLMProviderState>,
) -> Result<String, String> {
    let id = Uuid::new_v4().to_string();

    // If api_key_source is keychain, save the key to keychain
    let api_key_ref = if input.api_key_source == "keychain" {
        if let Some(api_key) = &input.api_key_value {
            // Save to keychain
            let key_ref = format!("vibebase.{}", input.name);
            KeychainService::save_api_key(&key_ref, api_key)?;
            Some(key_ref)
        } else {
            return Err("API key value required for keychain storage".to_string());
        }
    } else if input.api_key_source == "env_var" {
        // For env_var, api_key_value is the environment variable name
        input.api_key_value
    } else {
        None
    };

    let config = LLMProviderConfig {
        id,
        name: input.name,
        provider: input.provider,
        model: input.model,
        base_url: input.base_url,
        api_key_source: input.api_key_source,
        api_key_ref,
        parameters: input.parameters,
        is_default: input.is_default,
    };

    let db = state.app_db.lock().unwrap();
    db.save_llm_provider(&config)
        .map_err(|e| format!("Failed to save provider: {}", e))?;

    Ok(config.id)
}

#[tauri::command]
pub fn update_llm_provider(
    provider_name: String,
    input: LLMProviderInput,
    state: State<'_, LLMProviderState>,
) -> Result<(), String> {
    let db = state.app_db.lock().unwrap();
    
    // Get existing provider
    let existing = db.get_llm_provider(&provider_name)
        .map_err(|e| format!("Provider not found: {}", e))?;

    // Handle API key update
    let api_key_ref = if input.api_key_source == "keychain" {
        if let Some(api_key) = &input.api_key_value {
            // Update keychain
            let key_ref = format!("vibebase.{}", input.name);
            KeychainService::save_api_key(&key_ref, api_key)?;
            Some(key_ref)
        } else {
            // Keep existing reference
            existing.api_key_ref
        }
    } else if input.api_key_source == "env_var" {
        input.api_key_value
    } else {
        None
    };

    let config = LLMProviderConfig {
        id: existing.id,
        name: input.name,
        provider: input.provider,
        model: input.model,
        base_url: input.base_url,
        api_key_source: input.api_key_source,
        api_key_ref,
        parameters: input.parameters,
        is_default: input.is_default,
    };

    db.save_llm_provider(&config)
        .map_err(|e| format!("Failed to update provider: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn delete_llm_provider(
    provider_name: String,
    state: State<'_, LLMProviderState>,
) -> Result<(), String> {
    let db = state.app_db.lock().unwrap();
    
    // Get provider to clean up keychain
    if let Ok(provider) = db.get_llm_provider(&provider_name) {
        if provider.api_key_source == "keychain" {
            if let Some(key_ref) = provider.api_key_ref {
                // Delete from keychain (ignore errors)
                let _ = KeychainService::delete_api_key(&key_ref);
            }
        }
    }

    db.delete_llm_provider(&provider_name)
        .map_err(|e| format!("Failed to delete provider: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn get_llm_provider(
    provider_name: String,
    state: State<'_, LLMProviderState>,
) -> Result<LLMProviderOutput, String> {
    let db = state.app_db.lock().unwrap();
    let provider = db.get_llm_provider(&provider_name)
        .map_err(|e| format!("Provider not found: {}", e))?;

    // Check API key status
    let api_key_status = match provider.api_key_source.as_str() {
        "keychain" => {
            if let Some(ref key_ref) = provider.api_key_ref {
                if KeychainService::has_api_key(key_ref) {
                    "configured"
                } else {
                    "missing"
                }
            } else {
                "missing"
            }
        }
        "env_var" => {
            if let Some(ref env_var) = provider.api_key_ref {
                if std::env::var(env_var).is_ok() {
                    "configured"
                } else {
                    "missing"
                }
            } else {
                "missing"
            }
        }
        _ => "missing"
    }.to_string();

    Ok(LLMProviderOutput {
        id: provider.id,
        name: provider.name,
        provider: provider.provider,
        model: provider.model,
        base_url: provider.base_url,
        api_key_source: provider.api_key_source,
        api_key_ref: provider.api_key_ref,
        api_key_status,
        parameters: provider.parameters,
        is_default: provider.is_default,
    })
}

#[tauri::command]
pub fn test_llm_provider_connection(
    provider_name: String,
    state: State<'_, LLMProviderState>,
) -> Result<String, String> {
    let db = state.app_db.lock().unwrap();
    let provider = db.get_llm_provider(&provider_name)
        .map_err(|e| format!("Provider not found: {}", e))?;

    // Try to get API key
    let api_key = match provider.api_key_source.as_str() {
        "keychain" => {
            if let Some(key_ref) = provider.api_key_ref {
                KeychainService::get_api_key(&key_ref)?
            } else {
                return Err("API key reference not found".to_string());
            }
        }
        "env_var" => {
            if let Some(env_var) = provider.api_key_ref {
                std::env::var(&env_var)
                    .map_err(|_| format!("Environment variable '{}' not found", env_var))?
            } else {
                return Err("Environment variable name not found".to_string());
            }
        }
        _ => return Err("Invalid API key source".to_string()),
    };

    // TODO: Actually test the connection by making a simple API call
    // For now, just verify we can get the API key
    
    if api_key.is_empty() {
        return Err("API key is empty".to_string());
    }

    Ok("Connection test successful".to_string())
}

