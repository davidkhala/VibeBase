use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptRuntime {
    pub schema: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub config: ModelConfig,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub test_data: Option<String>,
    pub messages: Vec<Message>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub evaluation: Option<Vec<EvaluationConfig>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub role: MessageRole,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MessageRole {
    System,
    User,
    Assistant,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelConfig {
    pub provider: Provider,
    pub model: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parameters: Option<ModelParameters>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelParameters {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub top_p: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_tokens: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Provider {
    #[serde(rename = "openai")]
    OpenAI,
    #[serde(rename = "anthropic")]
    Anthropic,
    #[serde(rename = "deepseek")]
    DeepSeek,
    #[serde(rename = "openrouter")]
    OpenRouter,
    #[serde(rename = "ollama")]
    Ollama,
    #[serde(rename = "azure_openai")]
    AzureOpenAI,
    #[serde(rename = "google")]
    Google,
    #[serde(rename = "aihubmix")]
    AiHubMix,
    #[serde(rename = "github")]
    GitHub,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvaluationConfig {
    pub name: String,
    #[serde(rename = "type")]
    pub eval_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ref_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub weight: Option<f32>,
}

impl PromptRuntime {
    pub fn extract_variables(&self) -> Vec<String> {
        let mut variables = Vec::new();
        let regex = regex::Regex::new(r"\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}").unwrap();

        for message in &self.messages {
            for cap in regex.captures_iter(&message.content) {
                let var_name = cap[1].to_string();
                if !variables.contains(&var_name) {
                    variables.push(var_name);
                }
            }
        }

        variables
    }
}

/// Parse pure Markdown prompt file (no frontmatter)
/// Content is organized by H2 headings: ## System Message, ## User Message, ## Assistant
pub fn parse_markdown_prompt(content: &str) -> Result<Vec<Message>, String> {
    use pulldown_cmark::{Parser, Event, Tag, HeadingLevel};
    
    let mut messages = Vec::new();
    let mut current_role: Option<MessageRole> = None;
    let mut current_content = String::new();
    let mut in_heading = false;
    let mut heading_level = HeadingLevel::H1;
    let mut heading_text = String::new();
    
    let parser = Parser::new(content);
    
    for event in parser {
        match event {
            Event::Start(Tag::Heading(level, _, _)) => {
                heading_level = level;
                if level == HeadingLevel::H2 {
                    // Save previous message if exists
                    if let Some(role) = current_role.take() {
                        if !current_content.trim().is_empty() {
                            messages.push(Message {
                                role,
                                content: current_content.trim().to_string(),
                            });
                        }
                        current_content.clear();
                    }
                    in_heading = true;
                    heading_text.clear();
                }
            }
            Event::End(Tag::Heading(..)) => {
                if heading_level == HeadingLevel::H2 {
                    in_heading = false;
                    // Determine role from heading text
                    let heading_lower = heading_text.to_lowercase();
                    current_role = if heading_lower.contains("system") {
                        Some(MessageRole::System)
                    } else if heading_lower.contains("user") {
                        Some(MessageRole::User)
                    } else if heading_lower.contains("assistant") {
                        Some(MessageRole::Assistant)
                    } else {
                        None
                    };
                }
            }
            Event::Text(text) => {
                if in_heading {
                    heading_text.push_str(&text);
                } else if current_role.is_some() {
                    current_content.push_str(&text);
                }
            }
            Event::Code(code) => {
                if !in_heading && current_role.is_some() {
                    current_content.push('`');
                    current_content.push_str(&code);
                    current_content.push('`');
                }
            }
            Event::SoftBreak | Event::HardBreak => {
                if !in_heading && current_role.is_some() {
                    current_content.push('\n');
                }
            }
            Event::Start(Tag::Paragraph) => {
                if !in_heading && current_role.is_some() && !current_content.is_empty() {
                    current_content.push('\n');
                }
            }
            Event::End(Tag::Paragraph) => {
                if !in_heading && current_role.is_some() {
                    current_content.push('\n');
                }
            }
            Event::Start(Tag::List(_)) | Event::Start(Tag::Item) => {
                if !in_heading && current_role.is_some() {
                    current_content.push('\n');
                }
            }
            Event::Start(Tag::Strong) => {
                if !in_heading && current_role.is_some() {
                    current_content.push_str("**");
                }
            }
            Event::End(Tag::Strong) => {
                if !in_heading && current_role.is_some() {
                    current_content.push_str("**");
                }
            }
            Event::Start(Tag::Emphasis) => {
                if !in_heading && current_role.is_some() {
                    current_content.push('*');
                }
            }
            Event::End(Tag::Emphasis) => {
                if !in_heading && current_role.is_some() {
                    current_content.push('*');
                }
            }
            Event::Start(Tag::CodeBlock(_)) => {
                if !in_heading && current_role.is_some() {
                    current_content.push_str("\n```\n");
                }
            }
            Event::End(Tag::CodeBlock(_)) => {
                if !in_heading && current_role.is_some() {
                    current_content.push_str("\n```\n");
                }
            }
            _ => {}
        }
    }
    
    // Save last message
    if let Some(role) = current_role {
        if !current_content.trim().is_empty() {
            messages.push(Message {
                role,
                content: current_content.trim().to_string(),
            });
        }
    }
    
    if messages.is_empty() {
        return Err("No valid messages found in Markdown. Use ## System Message, ## User Message, or ## Assistant headings.".to_string());
    }
    
    Ok(messages)
}

#[cfg(test)]
#[path = "prompt_test.rs"]
mod prompt_test;

