-- Global Application Database Schema
-- Location: ~/.vibebase/app.db

-- LLM Provider Configurations
CREATE TABLE IF NOT EXISTS llm_providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    base_url TEXT,
    api_key TEXT,
    api_key_source TEXT NOT NULL,
    api_key_ref TEXT,
    parameters TEXT,
    enabled INTEGER DEFAULT 1,
    enabled_models TEXT,
    is_default INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_llm_providers_name ON llm_providers(name);
CREATE INDEX IF NOT EXISTS idx_llm_providers_default ON llm_providers(is_default);

-- Application Settings
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Recent Projects
CREATE TABLE IF NOT EXISTS recent_projects (
    id TEXT PRIMARY KEY,
    path TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    last_opened INTEGER NOT NULL,
    pinned INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_recent_projects_last_opened ON recent_projects(last_opened DESC);

-- Keyboard Shortcuts
CREATE TABLE IF NOT EXISTS keyboard_shortcuts (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL UNIQUE,
    shortcut TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Global Variables
CREATE TABLE IF NOT EXISTS global_variables (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_global_variables_key ON global_variables(key);

-- Schema Version
CREATE TABLE IF NOT EXISTS schema_version (
    version TEXT PRIMARY KEY,
    applied_at INTEGER NOT NULL
);

INSERT OR IGNORE INTO schema_version (version, applied_at) 
VALUES ('1.0.0', strftime('%s', 'now'));




