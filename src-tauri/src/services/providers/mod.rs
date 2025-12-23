pub mod openai;
pub mod anthropic;

use crate::models::execution::*;
use crate::models::prompt::Provider;

pub async fn execute_with_provider(
    provider: &Provider,
    model: &str,
    messages: Vec<OpenAIMessage>,
    temperature: f32,
    api_key: &str,
    base_url: Option<&str>,
) -> Result<(String, OpenAIUsage), String> {
    match provider {
        Provider::OpenAI => {
            openai::execute_with_name(model, messages, temperature, api_key, None, "OpenAI").await
        }
        Provider::Anthropic => {
            anthropic::execute(model, messages, temperature, api_key).await
        }
        Provider::DeepSeek => {
            let url = base_url.unwrap_or("https://api.deepseek.com");
            openai::execute_with_name(model, messages, temperature, api_key, Some(url), "DeepSeek").await
        }
        Provider::OpenRouter => {
            let url = base_url.unwrap_or("https://openrouter.ai/api/v1");
            openai::execute_with_name(model, messages, temperature, api_key, Some(url), "OpenRouter").await
        }
        Provider::Ollama => {
            let url = base_url.unwrap_or("http://localhost:11434/v1");
            openai::execute_with_name(model, messages, temperature, "", Some(url), "Ollama").await
        }
        Provider::AiHubMix => {
            let url = base_url.unwrap_or("https://aihubmix.com/v1");
            openai::execute_with_name(model, messages, temperature, api_key, Some(url), "AiHubMix").await
        }
        Provider::Custom => {
            // Custom provider must have base_url
            let url = base_url.ok_or("Custom provider requires base_url")?;
            openai::execute_with_name(model, messages, temperature, api_key, Some(url), "Custom").await
        }
        Provider::Google => {
            Err("Google Gemini API format is different, requires separate implementation".to_string())
        }
        Provider::GitHub => {
            Err("GitHub Copilot not yet implemented".to_string())
        }
        Provider::AzureOpenAI => {
            Err("Azure OpenAI requires deployment-specific URL configuration".to_string())
        }
    }
}
















