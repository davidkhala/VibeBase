import { create } from "zustand";

export interface Environment {
  name?: string;

  // v2.0: Use provider_ref to reference global LLM configuration
  provider_ref?: string;

  // Legacy fields (for backward compatibility)
  provider?: string;
  model?: string;
  api_key_env_var?: string;

  base_url?: string;
  parameters?: {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
  };
}

export interface WorkspaceConfig {
  project_name: string;
  locale?: string;
  theme?: string;
  source_control?: {
    auto_generate_commit_message?: boolean;
    commit_message_model?: string;
    commit_message_style?: string;
    commit_message_language?: string;
  };
  environments: Record<string, Environment>;
}

interface ConfigStore {
  config: WorkspaceConfig | null;
  currentEnvironment: string | null;
  setConfig: (config: WorkspaceConfig | null) => void;
  setCurrentEnvironment: (env: string | null) => void;
}

export const useConfigStore = create<ConfigStore>((set) => ({
  config: null,
  currentEnvironment: null,

  setConfig: (config) => {
    // Auto-select first environment
    const firstEnv = config ? Object.keys(config.environments)[0] : null;
    set({ config, currentEnvironment: firstEnv });
  },

  setCurrentEnvironment: (env) => set({ currentEnvironment: env }),
}));






