use regex::Regex;
use std::collections::HashMap;

pub fn replace_variables(template: &str, variables: &HashMap<String, String>) -> Result<String, String> {
    let regex = Regex::new(r"\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}").unwrap();
    let mut result = template.to_string();
    let mut missing_vars = Vec::new();

    for cap in regex.captures_iter(template) {
        let var_name = &cap[1];
        if let Some(value) = variables.get(var_name) {
            result = result.replace(&format!("{{{{{}}}}}", var_name), value);
        } else {
            missing_vars.push(var_name.to_string());
        }
    }

    if !missing_vars.is_empty() {
        return Err(format!("Missing variables: {}", missing_vars.join(", ")));
    }

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_replace_variables() {
        let template = "Hello {{name}}! Your order {{order_id}} is ready.";
        let mut vars = HashMap::new();
        vars.insert("name".to_string(), "Alice".to_string());
        vars.insert("order_id".to_string(), "#12345".to_string());

        let result = replace_variables(template, &vars).unwrap();
        assert_eq!(result, "Hello Alice! Your order #12345 is ready.");
    }

    #[test]
    fn test_missing_variables() {
        let template = "Hello {{name}}!";
        let vars = HashMap::new();

        let result = replace_variables(template, &vars);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Missing variables: name"));
    }
}






