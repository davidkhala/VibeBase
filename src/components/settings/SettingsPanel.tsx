import { useState } from "react";
import { X, Minus, Square, Maximize2 } from "lucide-react";
import ApiKeyManager from "./ApiKeyManager";
import LLMProviderManager from "./LLMProviderManager";
import { appWindow } from "@tauri-apps/api/window";
import { useTranslation } from "react-i18next";

interface SettingsPanelProps {
  onClose: () => void;
  isStandaloneWindow?: boolean;
}

export default function SettingsPanel({ onClose, isStandaloneWindow = false }: SettingsPanelProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("llmproviders");

  const handleMinimize = async () => {
    try {
      await appWindow.minimize();
    } catch (error) {
      console.error("Failed to minimize window:", error);
    }
  };

  const handleMaximize = async () => {
    try {
      await appWindow.toggleMaximize();
    } catch (error) {
      console.error("Failed to maximize window:", error);
    }
  };

  const handleClose = () => {
    if (isStandaloneWindow) {
      appWindow.close();
    } else {
      onClose();
    }
  };

  return (
    <div className={isStandaloneWindow ? "w-full h-full flex items-center justify-center bg-card" : "fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"}>
      <div className={isStandaloneWindow ? "w-full h-full bg-card flex flex-col" : "w-[800px] h-[600px] bg-card border border-border rounded-lg shadow-xl flex flex-col"}>
        {/* Header */}
        <div
          className={`h-12 border-b border-border flex items-center justify-between px-6 bg-gradient-to-r from-card to-card/50 ${isStandaloneWindow ? "" : "relative"}`}
          data-tauri-drag-region={isStandaloneWindow}
        >
          {isStandaloneWindow && (
            <div className="flex items-center gap-2" data-tauri-drag-region="none">
              <button
                onClick={handleClose}
                className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex-shrink-0"
                title={t("actions.close")}
              />
              <button
                onClick={handleMinimize}
                className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors flex-shrink-0"
                title="最小化"
              />
              <button
                onClick={handleMaximize}
                className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors flex-shrink-0"
                title="最大化"
              />
            </div>
          )}
          <h2
            className={`text-lg font-semibold text-foreground ${isStandaloneWindow ? "flex-1 text-center" : ""}`}
            data-tauri-drag-region={isStandaloneWindow}
          >
            {t("settings.title", "Settings")}
          </h2>
          {!isStandaloneWindow && (
            <button
              onClick={handleClose}
              className="absolute right-4 p-1.5 hover:bg-accent rounded transition-colors"
              title={t("actions.close")}
            >
              <X className="w-5 h-5" />
            </button>
          )}
          {isStandaloneWindow && <div className="w-[68px]" data-tauri-drag-region="none" />}
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Tabs */}
          <div className="w-48 border-r border-border p-2 space-y-1">
            <button
              onClick={() => setActiveTab("llmproviders")}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${activeTab === "llmproviders"
                ? "bg-accent text-foreground font-medium"
                : "text-muted-foreground hover:bg-accent/50"
                }`}
            >
              {t("settings.llmProviders", "LLM Providers")}
            </button>
            <button
              onClick={() => setActiveTab("apikeys")}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${activeTab === "apikeys"
                ? "bg-accent text-foreground font-medium"
                : "text-muted-foreground hover:bg-accent/50"
                }`}
            >
              {t("settings.apiKeys", "API Keys (Legacy)")}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            {activeTab === "llmproviders" && <LLMProviderManager />}
            {activeTab === "apikeys" && <ApiKeyManager />}
          </div>
        </div>
      </div>
    </div>
  );
}






