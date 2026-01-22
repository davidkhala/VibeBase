-- Project Database Schema
-- Location: {project}/.vibebase/project.db

-- Prompt Files Metadata (stores all configuration)
CREATE TABLE IF NOT EXISTS prompt_files (
    id TEXT PRIMARY KEY,
    file_path TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    schema_version TEXT NOT NULL DEFAULT 'v1',
    
    -- LLM Configuration
    provider_ref TEXT NOT NULL,
    model_override TEXT,
    parameters TEXT,
    
    -- Testing & Evaluation
    test_data_path TEXT,
    evaluation_config TEXT,
    
    -- Metadata
    tags TEXT, -- JSON array of tag strings
    variables TEXT,
    
    -- File Tracking
    file_hash TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    last_modified INTEGER NOT NULL,
    
    -- Validation Status
    last_validated INTEGER,
    validation_status TEXT,
    validation_errors TEXT,
    
    -- Timestamps
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_prompt_files_path ON prompt_files(file_path);
CREATE INDEX IF NOT EXISTS idx_prompt_files_provider ON prompt_files(provider_ref);
CREATE INDEX IF NOT EXISTS idx_prompt_files_validation ON prompt_files(validation_status);

-- Execution History
CREATE TABLE IF NOT EXISTS execution_history (
    id TEXT PRIMARY KEY,
    prompt_file_id TEXT NOT NULL,
    prompt_name TEXT NOT NULL,
    llm_provider_name TEXT NOT NULL,
    
    -- Input/Output
    input_variables TEXT,
    output TEXT NOT NULL,
    
    -- Execution Info
    model TEXT NOT NULL,
    provider TEXT NOT NULL,
    latency_ms INTEGER NOT NULL,
    tokens_input INTEGER NOT NULL,
    tokens_output INTEGER NOT NULL,
    cost_usd REAL NOT NULL,
    
    -- Context
    timestamp INTEGER NOT NULL,
    git_commit TEXT,
    git_branch TEXT,
    
    FOREIGN KEY (prompt_file_id) REFERENCES prompt_files(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_execution_prompt ON execution_history(prompt_file_id);
CREATE INDEX IF NOT EXISTS idx_execution_timestamp ON execution_history(timestamp DESC);

-- Evaluation Results
CREATE TABLE IF NOT EXISTS evaluation_results (
    id TEXT PRIMARY KEY,
    execution_id TEXT NOT NULL,
    evaluator_name TEXT NOT NULL,
    evaluator_file_path TEXT,
    
    score REAL,
    reasoning TEXT,
    passed INTEGER,
    timestamp INTEGER NOT NULL,
    
    FOREIGN KEY (execution_id) REFERENCES execution_history(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_evaluation_execution ON evaluation_results(execution_id);

-- File Dependencies
CREATE TABLE IF NOT EXISTS file_dependencies (
    id TEXT PRIMARY KEY,
    source_file TEXT NOT NULL,
    target_file TEXT NOT NULL,
    dependency_type TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    
    FOREIGN KEY (source_file) REFERENCES prompt_files(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dependencies_source ON file_dependencies(source_file);
CREATE INDEX IF NOT EXISTS idx_dependencies_target ON file_dependencies(target_file);

-- Test Data Sets
CREATE TABLE IF NOT EXISTS test_datasets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    format TEXT NOT NULL,
    row_count INTEGER,
    columns TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_test_datasets_path ON test_datasets(file_path);

-- Test Results (Matrix Run Results)
CREATE TABLE IF NOT EXISTS test_results (
    id TEXT PRIMARY KEY,
    prompt_file_id TEXT NOT NULL,
    dataset_id TEXT NOT NULL,
    test_case_index INTEGER NOT NULL,
    input_variables TEXT NOT NULL,
    output TEXT NOT NULL,
    model TEXT NOT NULL,
    provider TEXT NOT NULL,
    latency_ms INTEGER NOT NULL,
    tokens_input INTEGER NOT NULL,
    tokens_output INTEGER NOT NULL,
    cost_usd REAL NOT NULL,
    timestamp INTEGER NOT NULL,
    
    FOREIGN KEY (prompt_file_id) REFERENCES prompt_files(id) ON DELETE CASCADE,
    FOREIGN KEY (dataset_id) REFERENCES test_datasets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_test_results_prompt ON test_results(prompt_file_id);
CREATE INDEX IF NOT EXISTS idx_test_results_dataset ON test_results(dataset_id);
CREATE INDEX IF NOT EXISTS idx_test_results_timestamp ON test_results(timestamp DESC);

-- Arena Battles (Multi-Model Comparison Results)
-- Stores all execution results: single model, multi-model comparison
CREATE TABLE IF NOT EXISTS arena_battles (
    id TEXT PRIMARY KEY,
    prompt_file_id TEXT,
    prompt_content TEXT NOT NULL,
    input_variables TEXT NOT NULL,     -- JSON: {"var1": "value1", ...}
    models TEXT NOT NULL,              -- JSON array: ["model1", "model2", ...]
    outputs TEXT NOT NULL,             -- JSON array: [{"model": "...", "output": "...", "metadata": {...}}, ...]
    winner_model TEXT,                 -- User voted winner (optional)
    votes TEXT,                        -- JSON: {"model1": 2, "model2": 5, ...} (optional)
    timestamp INTEGER NOT NULL,
    
    FOREIGN KEY (prompt_file_id) REFERENCES prompt_files(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_arena_battles_prompt ON arena_battles(prompt_file_id);
CREATE INDEX IF NOT EXISTS idx_arena_battles_timestamp ON arena_battles(timestamp DESC);

-- Evaluation Rules (Level 2 Evaluation)
CREATE TABLE IF NOT EXISTS evaluation_rules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    rule_type TEXT NOT NULL,
    rule_config TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_evaluation_rules_type ON evaluation_rules(rule_type);

-- File Content History (Version Control)
CREATE TABLE IF NOT EXISTS file_history (
    id TEXT PRIMARY KEY,
    file_path TEXT NOT NULL,
    content TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_file_history_path ON file_history(file_path);
CREATE INDEX IF NOT EXISTS idx_file_history_time ON file_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_history_hash ON file_history(file_path, content_hash);

-- Schema Migrations
CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at INTEGER NOT NULL,
    description TEXT
);

INSERT OR IGNORE INTO schema_migrations (version, applied_at, description)
VALUES ('1.0.0', strftime('%s', 'now'), 'Initial schema with pure Markdown support');

INSERT OR IGNORE INTO schema_migrations (version, applied_at, description)
VALUES ('1.1.0', strftime('%s', 'now'), 'Add file_history table for version control');

INSERT OR IGNORE INTO schema_migrations (version, applied_at, description)
VALUES ('1.2.0', strftime('%s', 'now'), 'Replace comparison_results with arena_battles table for multi-model support');

-- Git Configuration (Project-level)
CREATE TABLE IF NOT EXISTS git_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    
    -- Repository Info
    repository_path TEXT,
    current_branch TEXT,
    
    -- Authentication
    auth_method TEXT,  -- 'ssh' | 'token' | 'none'
    ssh_key_path TEXT,
    
    -- Keychain References (not storing actual sensitive data)
    ssh_passphrase_key TEXT,  -- Keychain key: "git:ssh_passphrase:{workspace_id}"
    github_token_key TEXT,     -- Keychain key: "git:token:{workspace_id}"
    
    -- User Info (can be plaintext)
    git_user_name TEXT,
    git_user_email TEXT,
    
    -- Remote Repository
    remote_name TEXT DEFAULT 'origin',
    remote_url TEXT,
    
    -- Status
    is_configured INTEGER DEFAULT 0,
    last_fetch INTEGER,
    
    -- Commit Message Generation Settings (v1.4.0)
    commit_message_style TEXT DEFAULT 'detailed',  -- 'concise' | 'detailed'
    commit_message_provider TEXT,                  -- Provider ref for LLM
    commit_message_language TEXT DEFAULT 'auto',   -- 'auto' | 'zh-CN' | 'en'
    
    -- Timestamps
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Security: Sensitive data (SSH passphrase and tokens) stored in system Keychain
-- Database only stores Keychain reference keys

INSERT OR IGNORE INTO schema_migrations (version, applied_at, description)
VALUES ('1.3.0', strftime('%s', 'now'), 'Add git_config table for Git integration');

INSERT OR IGNORE INTO schema_migrations (version, applied_at, description)
VALUES ('1.4.0', strftime('%s', 'now'), 'Add commit_message generation settings to git_config');


