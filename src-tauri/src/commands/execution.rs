use crate::models::execution::ExecutionResult;
use crate::models::prompt::PromptRuntime;
use crate::services::database::AppDatabase;
use crate::services::executor::Executor;
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::State;

pub struct AppState {
    pub app_database: Mutex<AppDatabase>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            app_database: Mutex::new(AppDatabase::new().expect("Failed to initialize app database")),
        }
    }
}

#[tauri::command]
pub async fn execute_prompt(
    prompt_yaml: String,
    variables: HashMap<String, String>,
    api_key: String,
    base_url: Option<String>,
    _state: State<'_, AppState>,
) -> Result<ExecutionResult, String> {
    // Parse YAML
    let prompt: PromptRuntime =
        serde_yaml::from_str(&prompt_yaml).map_err(|e| format!("YAML parse error: {}", e))?;

    // Execute (create new executor to avoid holding lock across await)
    let executor = Executor::new();
    let result = executor
        .execute(&prompt, variables, &api_key, base_url.as_deref())
        .await?;

    // Note: Execution history will be saved to project database
    // For now, just return the result
    // TODO: Implement project database integration in workspace context

    Ok(result)
}

#[tauri::command]
pub fn get_execution_history(
    _limit: usize,
    _state: State<'_, AppState>,
) -> Result<Vec<ExecutionResult>, String> {
    // TODO: Implement with project database
    // For now, return empty list
    Ok(Vec::new())
}

