import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

interface PromptMetadata {
  id: string;
  file_path: string;
  provider_ref: string;
  model_override?: string;
  parameters?: string;
  test_data_path?: string;
  evaluation_config?: string;
  tags?: string;
  variables?: string;
  validation_status?: string;
}

interface MetadataPanelProps {
  filePath: string;
}

export default function MetadataPanel({ filePath }: MetadataPanelProps) {
  const { t } = useTranslation();
  const [metadata, setMetadata] = useState<PromptMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [providers, setProviders] = useState<string[]>([]);

  // Form state
  const [providerRef, setProviderRef] = useState("");
  const [modelOverride, setModelOverride] = useState("");
  const [temperature, setTemperature] = useState("0.7");
  const [maxTokens, setMaxTokens] = useState("");
  const [testDataPath, setTestDataPath] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    loadMetadata();
    loadProviders();
  }, [filePath]);

  const loadMetadata = async () => {
    try {
      setLoading(true);
      // TODO: Implement get_prompt_metadata command
      // const data = await invoke<PromptMetadata>("get_prompt_metadata", {
      //   filePath: filePath,
      // });
      // setMetadata(data);
      // populateForm(data);

      // For now, use default values
      setProviderRef("openai_prod");
      setTags([]);
    } catch (error) {
      console.error("Failed to load metadata:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProviders = async () => {
    try {
      const providerList = await invoke<any[]>("list_llm_providers");
      setProviders(providerList.map((p) => p.name));
    } catch (error) {
      console.error("Failed to load providers:", error);
    }
  };

  const populateForm = (data: PromptMetadata) => {
    setProviderRef(data.provider_ref);
    setModelOverride(data.model_override || "");

    // Parse parameters
    if (data.parameters) {
      try {
        const params = JSON.parse(data.parameters);
        setTemperature(params.temperature?.toString() || "0.7");
        setMaxTokens(params.max_tokens?.toString() || "");
      } catch (e) {
        console.error("Failed to parse parameters:", e);
      }
    }

    // Parse tags
    if (data.tags) {
      try {
        setTags(JSON.parse(data.tags));
      } catch (e) {
        console.error("Failed to parse tags:", e);
        setTags([]);
      }
    }

    setTestDataPath(data.test_data_path || "");
  };

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Build parameters JSON
      const parameters: any = {};
      if (temperature) parameters.temperature = parseFloat(temperature);
      if (maxTokens) parameters.max_tokens = parseInt(maxTokens);

      const metadataUpdate = {
        file_path: filePath,
        provider_ref: providerRef,
        model_override: modelOverride || null,
        parameters: JSON.stringify(parameters),
        tags: JSON.stringify(tags),
        test_data_path: testDataPath || null,
      };

      // TODO: Implement save_prompt_metadata command
      // await invoke("save_prompt_metadata", { metadata: metadataUpdate });

      console.log("Metadata saved:", metadataUpdate);
      alert(t("metadata.saved_successfully"));
    } catch (error) {
      console.error("Failed to save metadata:", error);
      alert(t("metadata.save_failed") + ": " + error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">{t("metadata.loading")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">
          {t("metadata.title")}
        </h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Tags */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase">
            {t("metadata.tags")}
          </h4>

          {/* Tag input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleTagKeyDown}
              className="flex-1 px-2 py-1.5 text-sm bg-background border border-input rounded focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder={t("metadata.add_tag_placeholder")}
            />
            <button
              onClick={handleAddTag}
              className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              {t("metadata.add_tag")}
            </button>
          </div>

          {/* Tags display */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-accent text-accent-foreground rounded border border-border"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* LLM Configuration */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase">
            {t("metadata.llm_config")}
          </h4>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              {t("metadata.provider_ref")} *
            </label>
            <select
              value={providerRef}
              onChange={(e) => setProviderRef(e.target.value)}
              className="w-full px-2 py-1.5 text-sm bg-background border border-input rounded focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {providers.length === 0 ? (
                <option value="">{t("metadata.no_providers")}</option>
              ) : (
                providers.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))
              )}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              {t("metadata.provider_ref_desc")}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              {t("metadata.model_override")}
            </label>
            <input
              type="text"
              value={modelOverride}
              onChange={(e) => setModelOverride(e.target.value)}
              className="w-full px-2 py-1.5 text-sm bg-background border border-input rounded focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder={t("metadata.model_override_placeholder")}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t("metadata.model_override_desc")}
            </p>
          </div>
        </div>

        {/* Parameters */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase">
            {t("metadata.parameters")}
          </h4>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                {t("metadata.temperature")}
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className="w-full px-2 py-1.5 text-sm bg-background border border-input rounded focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                {t("metadata.max_tokens")}
              </label>
              <input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(e.target.value)}
                className="w-full px-2 py-1.5 text-sm bg-background border border-input rounded focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder={t("metadata.auto")}
              />
            </div>
          </div>
        </div>

        {/* Testing */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase">
            {t("metadata.testing")}
          </h4>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              {t("metadata.test_data")}
            </label>
            <input
              type="text"
              value={testDataPath}
              onChange={(e) => setTestDataPath(e.target.value)}
              className="w-full px-2 py-1.5 text-sm bg-background border border-input rounded focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder={t("metadata.test_data_placeholder")}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t("metadata.test_data_desc")}
            </p>
          </div>
        </div>

        {/* Variables (Read-only) */}
        {metadata?.variables && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">
              {t("metadata.variables")}
            </h4>
            <div className="flex flex-wrap gap-1">
              {JSON.parse(metadata.variables).map((v: string) => (
                <span
                  key={v}
                  className="px-2 py-1 text-xs bg-primary/10 text-primary rounded border border-primary/20"
                >
                  {`{{${v}}}`}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <button
          onClick={handleSave}
          disabled={saving || !providerRef}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-primary rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? t("metadata.saving") : t("metadata.save")}
        </button>
      </div>
    </div>
  );
}

