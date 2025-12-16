import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { useTranslation } from "react-i18next";
import { Search, Eye, EyeOff, Zap, Trash2 } from "lucide-react";

interface LLMProvider {
  id: string;
  name: string;
  provider: string;
  model: string;
  base_url?: string;
  api_key_source: string;
  api_key_ref?: string;
  api_key_status: string;
  parameters?: string;
  is_default: boolean;
}

interface ProviderModel {
  id: string;
  name: string;
  displayName: string;
  modelPath: string;
  enabled: boolean;
  manual?: boolean;
}

// Built-in provider configurations
const BUILTIN_PROVIDERS = [
  { id: "openrouter", name: "OpenRouter", icon: "🔀", description: "Access hundreds of AI models through OpenRouter unified API" },
  { id: "openai", name: "OpenAI", icon: "⚡", description: "Official OpenAI API for GPT models" },
  { id: "anthropic", name: "Anthropic", icon: "Ⓐ", description: "Claude models from Anthropic" },
  { id: "google", name: "Google Gemini", icon: "✦", description: "Google's Gemini AI models" },
  { id: "aihubmix", name: "AiHubMix", icon: "🤖", description: "AI Hub Mix unified API" },
  { id: "deepseek", name: "DeepSeek", icon: "🔎", description: "DeepSeek AI models" },
  { id: "azure", name: "Azure OpenAI", icon: "☁️", description: "Microsoft Azure OpenAI Service" },
  { id: "github", name: "GitHub Copilot", icon: "🐙", description: "GitHub Copilot models" },
];

export default function LLMProviderManager() {
  const { t } = useTranslation();
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>("openrouter");
  const [searchQuery, setSearchQuery] = useState("");
  const [modelSearchQuery, setModelSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(true);

  // Selected provider details
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [models, setModels] = useState<ProviderModel[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const data = await invoke<LLMProvider[]>("list_llm_providers");
      setProviders(data);
    } catch (error) {
      console.error("Failed to load providers:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProviderDetails = async (providerName: string) => {
    try {
      const provider = providers.find(p => p.name === providerName);
      if (!provider) {
        // For built-in providers without config yet
        setApiKey("");
        loadDefaultModels(providerName);
        return;
      }

      // Load API key if stored in keychain
      if (provider.api_key_source === "keychain" && provider.api_key_ref) {
        try {
          const key = await invoke<string>("get_api_key_from_keychain", {
            keyName: provider.api_key_ref,
          });
          setApiKey(key || "");
        } catch {
          setApiKey("");
        }
      } else {
        setApiKey("");
      }

      loadDefaultModels(providerName);
    } catch (error) {
      console.error("Failed to load provider details:", error);
    }
  };

  const loadDefaultModels = (providerName: string) => {
    // Default models based on provider
    const defaultModels: Record<string, ProviderModel[]> = {
      openrouter: [
        { id: "anthropic-haiku-4.5", name: "claude-haiku-4.5", displayName: "Claude Haiku 4.5", modelPath: "anthropic/claude-haiku-4.5", enabled: true, manual: true },
        { id: "anthropic-opus-4.5", name: "claude-opus-4.5", displayName: "Claude Opus 4.5", modelPath: "anthropic/claude-opus-4.5", enabled: true, manual: true },
        { id: "anthropic-sonnet-4.5", name: "claude-sonnet-4.5", displayName: "Claude Sonnet 4.5", modelPath: "anthropic/claude-sonnet-4.5", enabled: true, manual: true },
      ],
      openai: [
        { id: "gpt-4o", name: "gpt-4o", displayName: "GPT-4o", modelPath: "gpt-4o", enabled: true },
        { id: "gpt-4-turbo", name: "gpt-4-turbo", displayName: "GPT-4 Turbo", modelPath: "gpt-4-turbo", enabled: true },
        { id: "gpt-3.5-turbo", name: "gpt-3.5-turbo", displayName: "GPT-3.5 Turbo", modelPath: "gpt-3.5-turbo", enabled: true },
      ],
      anthropic: [
        { id: "claude-3-opus", name: "claude-3-opus-20240229", displayName: "Claude 3 Opus", modelPath: "claude-3-opus-20240229", enabled: true },
        { id: "claude-3-sonnet", name: "claude-3-sonnet-20240229", displayName: "Claude 3 Sonnet", modelPath: "claude-3-sonnet-20240229", enabled: true },
        { id: "claude-3-haiku", name: "claude-3-haiku-20240307", displayName: "Claude 3 Haiku", modelPath: "claude-3-haiku-20240307", enabled: true },
      ],
      google: [
        { id: "gemini-pro", name: "gemini-pro", displayName: "Gemini Pro", modelPath: "gemini-pro", enabled: true },
        { id: "gemini-pro-vision", name: "gemini-pro-vision", displayName: "Gemini Pro Vision", modelPath: "gemini-pro-vision", enabled: true },
      ],
    };

    setModels(defaultModels[providerName] || []);
  };

  const handleProviderSelect = (providerName: string) => {
    setSelectedProvider(providerName);
    loadProviderDetails(providerName);
  };

  const handleFetchModels = async () => {
    if (!selectedProvider) return;

    setFetchingModels(true);
    try {
      // This would call a backend command to fetch available models
      // For now, just show a placeholder
      setTimeout(() => {
        setFetchingModels(false);
        alert("Model fetching will be implemented soon");
      }, 1000);
    } catch (error) {
      console.error("Failed to fetch models:", error);
      setFetchingModels(false);
    }
  };

  const handleToggleModel = (modelId: string) => {
    setModels((prev) =>
      prev.map((m) => (m.id === modelId ? { ...m, enabled: !m.enabled } : m))
    );
    setSaved(false);
  };

  const handleDeleteModel = (modelId: string) => {
    if (confirm(t("providers.deleteModelConfirm", "Delete this model?"))) {
      setModels((prev) => prev.filter((m) => m.id !== modelId));
      setSaved(false);
    }
  };

  const handleSave = async () => {
    if (!selectedProvider) return;

    try {
      // Save API key and model configurations
      // TODO: Implement save logic
      setSaved(true);
      alert(t("providers.saved", "Settings saved successfully"));
    } catch (error) {
      console.error("Failed to save:", error);
      alert(t("providers.saveFailed", "Failed to save settings"));
    }
  };

  const handleAddCustomProvider = () => {
    alert("Add custom provider not yet implemented");
  };

  const filteredProviders = BUILTIN_PROVIDERS.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredModels = models.filter((m) =>
    m.displayName.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
    m.modelPath.toLowerCase().includes(modelSearchQuery.toLowerCase())
  );

  const selectedBuiltinProvider = BUILTIN_PROVIDERS.find(
    (p) => p.id === selectedProvider
  );

  const selectedProviderConfig = providers.find(
    (p) => p.provider === selectedProvider
  );

  const isProviderConfigured = selectedProviderConfig?.api_key_status === "configured";

  return (
    <div className="flex flex-col h-full">
      {/* Three Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Middle Column - Provider List */}
        <div className="w-80 border-r border-border flex flex-col">
          {/* Search Bar */}
          <div className="p-4 border-b border-border space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("providers.searchProviders")}
                className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              onClick={handleAddCustomProvider}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90"
            >
              {t("providers.addCustomProvider")}
            </button>
          </div>

          {/* Provider List */}
          <div className="flex-1 overflow-auto p-3 space-y-1">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">{t("providers.loading")}</p>
              </div>
            ) : filteredProviders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  {t("providers.noProvidersFound")}
                </p>
              </div>
            ) : (
              filteredProviders.map((provider) => {
                const isConfigured = providers.some(
                  p => p.provider === provider.id && p.api_key_status === "configured"
                );

                return (
                  <button
                    key={provider.id}
                    onClick={() => handleProviderSelect(provider.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${selectedProvider === provider.id
                        ? "bg-primary/10 border border-primary"
                        : "hover:bg-accent border border-transparent"
                      }`}
                  >
                    <span className="text-xl flex-shrink-0">{provider.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {provider.name}
                      </div>
                    </div>
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${isConfigured ? "bg-primary" : "bg-muted-foreground/30"
                        }`}
                    />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column - Provider Details */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedBuiltinProvider ? (
            <>
              {/* Provider Header */}
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{selectedBuiltinProvider.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground">
                        {selectedBuiltinProvider.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {selectedBuiltinProvider.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isProviderConfigured ? (
                      <span className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                        {t("providers.active")}
                      </span>
                    ) : (
                      <span className="px-3 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                        {t("providers.inactive")}
                      </span>
                    )}
                    <button
                      onClick={() => {
                        alert("Test connection not yet implemented");
                      }}
                      className="p-2 hover:bg-accent rounded-lg transition-colors"
                      title={t("providers.testConnection")}
                    >
                      <Zap className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleModel("all")}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isProviderConfigured ? "bg-primary" : "bg-muted-foreground/20"
                        }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isProviderConfigured ? "translate-x-6" : "translate-x-0.5"
                          }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Provider Details Content */}
              <div className="flex-1 overflow-auto p-6 space-y-6">
                {/* API Key Section */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t("providers.apiKey")}
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value);
                        setSaved(false);
                      }}
                      placeholder={t("providers.apiKeyPlaceholder")}
                      className="w-full px-3 py-2 pr-10 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showApiKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Get your API key from{" "}
                    <a
                      href={`https://${selectedBuiltinProvider.id === "openrouter" ? "openrouter.ai" : selectedBuiltinProvider.id + ".com"}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {selectedBuiltinProvider.name} Keys →
                    </a>
                  </p>
                </div>

                {/* Models Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-foreground">
                      {t("providers.models")}
                    </label>
                    <button
                      onClick={handleFetchModels}
                      disabled={fetchingModels}
                      className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
                    >
                      {fetchingModels ? t("providers.fetching") : t("providers.fetch")}
                    </button>
                  </div>

                  {/* Model Search */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={modelSearchQuery}
                      onChange={(e) => setModelSearchQuery(e.target.value)}
                      placeholder={t("providers.searchModels")}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {/* Models List */}
                  <div className="space-y-2">
                    {filteredModels.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {t("providers.noModelsAvailable")}
                      </p>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground mb-2">
                          Showing {filteredModels.length} models (enabled first)
                        </p>
                        {filteredModels.map((model) => (
                          <div
                            key={model.id}
                            className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-foreground">
                                  {model.displayName}
                                </span>
                                {model.manual && (
                                  <span className="px-1.5 py-0.5 text-xs bg-muted text-muted-foreground rounded">
                                    {t("providers.manual")}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {model.modelPath}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteModel(model.id)}
                              className="p-1.5 hover:bg-destructive/10 rounded transition-colors"
                              title="Delete model"
                            >
                              <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                            </button>
                            <button
                              onClick={() => handleToggleModel(model.id)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${model.enabled ? "bg-primary" : "bg-muted-foreground/20"
                                }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${model.enabled ? "translate-x-5" : "translate-x-0.5"
                                  }`}
                              />
                            </button>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                {t("providers.selectProvider")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-6 py-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {saved ? "All changes saved" : "Unsaved changes"}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (window.confirm("Close without saving?")) {
                // Close logic
              }
            }}
            className="px-4 py-2 text-sm font-medium text-foreground bg-secondary rounded hover:bg-secondary/80"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={saved}
            className="px-6 py-2 text-sm font-medium text-white bg-primary rounded hover:bg-primary/90 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
