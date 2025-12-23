use crate::models::execution::*;
use reqwest::Client;

#[allow(dead_code)]
pub async fn execute(
    model: &str,
    messages: Vec<OpenAIMessage>,
    temperature: f32,
    api_key: &str,
    base_url: Option<&str>,
) -> Result<(String, OpenAIUsage), String> {
    execute_with_name(model, messages, temperature, api_key, base_url, "OpenAI").await
}

pub async fn execute_with_name(
    model: &str,
    messages: Vec<OpenAIMessage>,
    temperature: f32,
    api_key: &str,
    base_url: Option<&str>,
    provider_name: &str,
) -> Result<(String, OpenAIUsage), String> {
    let client = Client::new();
    let url_base = base_url.unwrap_or("https://api.openai.com/v1");
    let url = format!("{}/chat/completions", url_base);

    let request = OpenAIRequest {
        model: model.to_string(),
        messages,
        temperature,
        stream: Some(false),
    };

    println!("🔍 [{}] URL: {}", provider_name, url);
    println!("🔍 [{}] Model: {}", provider_name, model);
    println!("🔍 [{}] Messages count: {}", provider_name, request.messages.len());
    println!("🔍 [{}] API key length: {} bytes", provider_name, api_key.len());
    println!("🔍 [{}] API key chars: {} chars", provider_name, api_key.chars().count());
    
    // Safely display API key prefix (by characters not bytes)
    let key_prefix: String = api_key.chars().take(15).collect();
    println!("🔍 [{}] API key prefix: {}", provider_name, key_prefix);
    
    // Check if contains bullet characters
    if api_key.contains('•') {
        println!("⚠️ [{}] API key contains bullet characters - may be masked/invalid", provider_name);
    }

    let mut req = client.post(&url).json(&request);

    // Add auth header if API key is provided (not needed for Ollama)
    if !api_key.is_empty() {
        req = req.header("Authorization", format!("Bearer {}", api_key));
        println!("✅ [{}] Authorization header added", provider_name);
    } else {
        println!("⚠️ [{}] No API key provided", provider_name);
    }

    // Add OpenRouter specific headers
    if url_base.contains("openrouter.ai") {
        println!("✅ [{}] Adding OpenRouter headers", provider_name);
        req = req
            .header("HTTP-Referer", "https://vibebase.dev")
            .header("X-Title", "VibeBase");
    }

    let response = req
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        println!("❌ [{}] API Error: {} - {}", provider_name, status, error_text);
        return Err(format!("API error {}: {}", status, error_text));
    }

    println!("✅ [{}] Request successful", provider_name);

    let api_response: OpenAIResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let output = api_response.choices[0].message.content.clone();
    Ok((output, api_response.usage))
}















