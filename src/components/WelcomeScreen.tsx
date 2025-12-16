import { useTranslation } from "react-i18next";
import { open } from "@tauri-apps/api/dialog";
import { invoke } from "@tauri-apps/api/tauri";
import { useWorkspaceStore, Workspace } from "../stores/workspaceStore";
import { FolderOpen } from "lucide-react";

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const { setWorkspace } = useWorkspaceStore();

  const handleOpenWorkspace = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: t("welcome.openWorkspace"),
      });

      if (selected && typeof selected === "string") {
        const workspace = await invoke<Workspace>("open_workspace", {
          path: selected,
        });
        setWorkspace(workspace);
      }
    } catch (error) {
      console.error("Failed to open workspace:", error);
    }
  };

  return (
    <div className="flex items-center justify-center h-full bg-background">
      <div className="text-center space-y-8 max-w-md px-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">
            {t("app.name")}
          </h1>
          <p className="text-lg text-muted-foreground">{t("app.slogan")}</p>
        </div>

        <button
          onClick={handleOpenWorkspace}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <FolderOpen className="w-5 h-5" />
          {t("welcome.openWorkspace")}
        </button>
      </div>
    </div>
  );
}






