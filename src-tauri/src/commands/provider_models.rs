use serde::{Deserialize, Serialize};
use reqwest;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
}

#[tauri::command]
pub async fn fetch_provider_models(
    provider: String,
    api_key: String,
    base_url: Option<String>,
) -> Result<Vec<ModelInfo>, String> {
    println!("🔍 [fetch_provider_models] Provider: {}", provider);
    println!("🔍 [fetch_provider_models] API key length: {}", api_key.len());
    println!("🔍 [fetch_provider_models] Base URL: {:?}", base_url);
    
    match provider.as_str() {
        "openrouter" => fetch_openrouter_models(api_key, base_url).await,
        "openai" => fetch_openai_models(api_key, base_url).await,
        "anthropic" => fetch_anthropic_models(api_key, base_url).await,
        "aihubmix" => fetch_aihubmix_models(api_key, base_url).await,
        "deepseek" => fetch_deepseek_models(api_key, base_url).await,
        "ollama" => fetch_ollama_models(base_url).await,
        "custom" => fetch_custom_provider_models(api_key, base_url).await,
        _ => Err(format!("Provider '{}' model fetching not yet implemented", provider)),
    }
}

async fn fetch_openrouter_models(api_key: String, base_url: Option<String>) -> Result<Vec<ModelInfo>, String> {
    let url = base_url.unwrap_or_else(|| "https://openrouter.ai/api/v1/models".to_string());
    
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("API returned status: {}", response.status()));
    }

    #[derive(Deserialize)]
    struct OpenRouterResponse {
        data: Vec<OpenRouterModel>,
    }

    #[derive(Deserialize)]
    struct OpenRouterModel {
        id: String,
        name: Option<String>,
    }

    let data: OpenRouterResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    Ok(data.data.into_iter().map(|m| ModelInfo {
        id: m.id.clone(),
        name: m.name.unwrap_or(m.id),
        description: None,
    }).collect())
}

async fn fetch_openai_models(api_key: String, base_url: Option<String>) -> Result<Vec<ModelInfo>, String> {
    let is_custom_url = base_url.is_some();
    let url = format!("{}/models", base_url.unwrap_or_else(|| "https://api.openai.com/v1".to_string()));
    
    println!("🔍 [fetch_openai_models] Fetching from URL: {}", url);
    println!("🔍 [fetch_openai_models] Is custom URL: {}", is_custom_url);
    
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let status = response.status();
    println!("🔍 [fetch_openai_models] Response status: {}", status);

    if !status.is_success() {
        let error_text = response.text().await.unwrap_or_default();
        println!("❌ [fetch_openai_models] API error: {}", error_text);
        return Err(format!("API returned status: {} - {}", status, error_text));
    }

    #[derive(Deserialize)]
    struct OpenAIResponse {
        data: Vec<OpenAIModel>,
    }

    #[derive(Deserialize)]
    struct OpenAIModel {
        id: String,
    }

    let response_text = response.text().await.map_err(|e| format!("Failed to read response: {}", e))?;
    println!("🔍 [fetch_openai_models] Response body (first 500 chars): {}", &response_text.chars().take(500).collect::<String>());

    let data: OpenAIResponse = serde_json::from_str(&response_text)
        .map_err(|e| format!("Failed to parse response: {} - Response: {}", e, &response_text.chars().take(200).collect::<String>()))?;

    println!("✅ [fetch_openai_models] Successfully parsed {} models", data.data.len());

    // Only filter for GPT models if using official OpenAI API
    // For custom base URLs, return all models
    let filtered: Vec<ModelInfo> = if is_custom_url {
        println!("🔍 [fetch_openai_models] Custom URL detected, returning all models");
        data.data.into_iter()
            .map(|m| ModelInfo {
                id: m.id.clone(),
                name: m.id,
                description: None,
            })
            .collect()
    } else {
        println!("🔍 [fetch_openai_models] Official OpenAI URL, filtering GPT models only");
        data.data.into_iter()
            .filter(|m| m.id.starts_with("gpt-") || m.id.starts_with("o1"))
            .map(|m| ModelInfo {
                id: m.id.clone(),
                name: m.id,
                description: None,
            })
            .collect()
    };

    println!("✅ [fetch_openai_models] Returning {} models", filtered.len());

    Ok(filtered)
}

async fn fetch_anthropic_models(_api_key: String, _base_url: Option<String>) -> Result<Vec<ModelInfo>, String> {
    // Anthropic doesn't have a models list endpoint, return known models
    Ok(vec![
        ModelInfo {
            id: "claude-3-5-sonnet-20241022".to_string(),
            name: "Claude 3.5 Sonnet".to_string(),
            description: Some("Most capable model".to_string()),
        },
        ModelInfo {
            id: "claude-3-5-haiku-20241022".to_string(),
            name: "Claude 3.5 Haiku".to_string(),
            description: Some("Fast and efficient".to_string()),
        },
        ModelInfo {
            id: "claude-3-opus-20240229".to_string(),
            name: "Claude 3 Opus".to_string(),
            description: Some("Previous generation flagship".to_string()),
        },
    ])
}

#[tauri::command]
pub async fn test_provider_connection(
    provider: String,
    api_key: String,
    base_url: Option<String>,
) -> Result<String, String> {
    match provider.as_str() {
        "openrouter" => test_openrouter_connection(api_key, base_url).await,
        "openai" => test_openai_connection(api_key, base_url).await,
        "anthropic" => test_anthropic_connection(api_key, base_url).await,
        "aihubmix" => test_aihubmix_connection(api_key, base_url).await,
        "deepseek" => test_deepseek_connection(api_key, base_url).await,
        "ollama" => test_ollama_connection(base_url).await,
        "custom" => test_custom_provider_connection(api_key, base_url).await,
        _ => Err(format!("Provider '{}' connection test not yet implemented", provider)),
    }
}

async fn test_openrouter_connection(api_key: String, base_url: Option<String>) -> Result<String, String> {
    let url = base_url.unwrap_or_else(|| "https://openrouter.ai/api/v1/models".to_string());
    
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await
        .map_err(|e| format!("Connection failed: {}", e))?;

    if response.status().is_success() {
        Ok("Connection successful! API key is valid.".to_string())
    } else {
        Err(format!("Connection failed with status: {}", response.status()))
    }
}

async fn test_openai_connection(api_key: String, base_url: Option<String>) -> Result<String, String> {
    let url = format!("{}/models", base_url.unwrap_or_else(|| "https://api.openai.com/v1".to_string()));
    
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await
        .map_err(|e| format!("Connection failed: {}", e))?;

    if response.status().is_success() {
        Ok("Connection successful! API key is valid.".to_string())
    } else {
        Err(format!("Connection failed with status: {}", response.status()))
    }
}

async fn test_anthropic_connection(api_key: String, _base_url: Option<String>) -> Result<String, String> {
    // For Anthropic, we can't easily test without making a real API call
    // Just check if the key format looks valid
    if api_key.starts_with("sk-ant-") {
        Ok("API key format looks valid. (Note: Actual connection not tested)".to_string())
    } else {
        Err("Invalid API key format. Anthropic keys should start with 'sk-ant-'".to_string())
    }
}

async fn fetch_aihubmix_models(api_key: String, base_url: Option<String>) -> Result<Vec<ModelInfo>, String> {
    // AiHubMix uses OpenAI-compatible interface
    let url = format!("{}/models", base_url.unwrap_or_else(|| "https://aihubmix.com/v1".to_string()));
    
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("API returned status: {}", response.status()));
    }

    #[derive(serde::Deserialize)]
    struct ModelsResponse {
        data: Vec<ModelData>,
    }

    #[derive(serde::Deserialize)]
    struct ModelData {
        id: String,
    }

    let data: ModelsResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    Ok(data.data.into_iter().map(|m| ModelInfo {
        id: m.id.clone(),
        name: m.id,
        description: None,
    }).collect())
}

async fn fetch_deepseek_models(api_key: String, base_url: Option<String>) -> Result<Vec<ModelInfo>, String> {
    // DeepSeek uses OpenAI-compatible interface
    let url = format!("{}/models", base_url.unwrap_or_else(|| "https://api.deepseek.com".to_string()));
    
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("API returned status: {}", response.status()));
    }

    #[derive(serde::Deserialize)]
    struct ModelsResponse {
        data: Vec<ModelData>,
    }

    #[derive(serde::Deserialize)]
    struct ModelData {
        id: String,
    }

    let data: ModelsResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    Ok(data.data.into_iter().map(|m| ModelInfo {
        id: m.id.clone(),
        name: m.id,
        description: None,
    }).collect())
}

async fn fetch_ollama_models(base_url: Option<String>) -> Result<Vec<ModelInfo>, String> {
    // Ollama uses different endpoint
    let url = format!("{}/api/tags", base_url.unwrap_or_else(|| "http://localhost:11434".to_string()));
    
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("API returned status: {}", response.status()));
    }

    #[derive(serde::Deserialize)]
    struct OllamaResponse {
        models: Vec<OllamaModel>,
    }

    #[derive(serde::Deserialize)]
    struct OllamaModel {
        name: String,
    }

    let data: OllamaResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    Ok(data.models.into_iter().map(|m| ModelInfo {
        id: m.name.clone(),
        name: m.name,
        description: None,
    }).collect())
}

async fn test_aihubmix_connection(api_key: String, base_url: Option<String>) -> Result<String, String> {
    let url = format!("{}/models", base_url.unwrap_or_else(|| "https://aihubmix.com/v1".to_string()));
    
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await
        .map_err(|e| format!("Connection failed: {}", e))?;

    if response.status().is_success() {
        Ok("Connection successful! API key is valid.".to_string())
    } else {
        Err(format!("Connection failed with status: {}", response.status()))
    }
}

async fn test_deepseek_connection(api_key: String, base_url: Option<String>) -> Result<String, String> {
    let url = format!("{}/models", base_url.unwrap_or_else(|| "https://api.deepseek.com".to_string()));
    
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await
        .map_err(|e| format!("Connection failed: {}", e))?;

    if response.status().is_success() {
        Ok("Connection successful! API key is valid.".to_string())
    } else {
        Err(format!("Connection failed with status: {}", response.status()))
    }
}

async fn test_ollama_connection(base_url: Option<String>) -> Result<String, String> {
    let url = format!("{}/api/tags", base_url.unwrap_or_else(|| "http://localhost:11434".to_string()));
    
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .timeout(std::time::Duration::from_secs(5))
        .send()
        .await
        .map_err(|e| format!("Connection failed: {}", e))?;

    if response.status().is_success() {
        Ok("Connection successful! Ollama is running.".to_string())
    } else {
        Err(format!("Connection failed with status: {}", response.status()))
    }
}

async fn fetch_custom_provider_models(api_key: String, base_url: Option<String>) -> Result<Vec<ModelInfo>, String> {
    let base = base_url.ok_or("Custom provider requires base_url")?;
    let url = format!("{}/models", base);
    
    println!("🔍 [fetch_custom_provider_models] Fetching from URL: {}", url);
    
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let status = response.status();
    println!("🔍 [fetch_custom_provider_models] Response status: {}", status);

    if !status.is_success() {
        let error_text = response.text().await.unwrap_or_default();
        println!("❌ [fetch_custom_provider_models] API error: {}", error_text);
        return Err(format!("API returned status: {} - {}", status, error_text));
    }

    #[derive(Deserialize)]
    struct OpenAIResponse {
        data: Vec<OpenAIModel>,
    }

    #[derive(Deserialize)]
    struct OpenAIModel {
        id: String,
    }

    let response_text = response.text().await.map_err(|e| format!("Failed to read response: {}", e))?;
    println!("🔍 [fetch_custom_provider_models] Response body (first 500 chars): {}", &response_text.chars().take(500).collect::<String>());

    let data: OpenAIResponse = serde_json::from_str(&response_text)
        .map_err(|e| format!("Failed to parse response: {} - Response: {}", e, &response_text.chars().take(200).collect::<String>()))?;

    println!("✅ [fetch_custom_provider_models] Successfully parsed {} models", data.data.len());

    // Return all models without filtering for custom providers
    let models: Vec<ModelInfo> = data.data.into_iter()
        .map(|m| ModelInfo {
            id: m.id.clone(),
            name: m.id,
            description: None,
        })
        .collect();

    println!("✅ [fetch_custom_provider_models] Returning {} models", models.len());

    Ok(models)
}

async fn test_custom_provider_connection(api_key: String, base_url: Option<String>) -> Result<String, String> {
    let base = base_url.ok_or("Custom provider requires base_url")?;
    let url = format!("{}/models", base);
    
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if response.status().is_success() {
        Ok("Connection successful".to_string())
    } else {
        Err(format!("Connection failed: {}", response.status()))
    }
}




