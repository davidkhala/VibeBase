import { useTranslation } from "react-i18next";
import { useWorkspaceStore, Workspace, FileNode } from "../../stores/workspaceStore";
import { useEditorStore } from "../../stores/editorStore";
import { invoke } from "@tauri-apps/api/tauri";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import NewPromptDialog from "../dialogs/NewPromptDialog";
import NewFolderDialog from "../dialogs/NewFolderDialog";
import FileTreeNode from "../filetree/FileTreeNode";
import ContextMenu from "../filetree/ContextMenu";

export default function Navigator() {
  const { t } = useTranslation();
  const { workspace, setWorkspace } = useWorkspaceStore();
  const { currentFile, setCurrentFile, setContent, setDirty } = useEditorStore();
  const [showNewPromptDialog, setShowNewPromptDialog] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    node: FileNode;
    position: { x: number; y: number };
  } | null>(null);
  const [selectedFolderPath, setSelectedFolderPath] = useState<string>("");

  const handleFileClick = async (filePath: string) => {
    try {
      const fileContent = await invoke<string>("read_prompt", {
        filePath: filePath,
      });

      // Validate based on file type
      if (filePath.endsWith(".vibe.md")) {
        // For Markdown files, try to parse
        try {
          await invoke("extract_variables_from_markdown", { content: fileContent });
        } catch (parseError) {
          console.warn("Markdown parsing warning:", parseError);
          // Continue anyway, allow user to edit
        }
      } else if (filePath.endsWith(".vibe.yaml") || filePath.endsWith(".vibe.yml")) {
        // For YAML files, validate
        try {
          await invoke("parse_yaml", { content: fileContent });
        } catch (parseError) {
          console.error("YAML parsing error:", parseError);
          alert(`Invalid YAML format: ${parseError}`);
          return;
        }
      }

      setCurrentFile(filePath);
      setContent(fileContent);
      setDirty(false);
    } catch (error) {
      console.error("Failed to open file:", error);
      alert(`Failed to open file: ${error}`);
    }
  };

  const handleRefresh = async () => {
    if (!workspace) return;

    try {
      const refreshedWorkspace = await invoke<Workspace>("open_workspace", {
        path: workspace.path,
      });
      setWorkspace(refreshedWorkspace);
    } catch (error) {
      console.error("Failed to refresh workspace:", error);
    }
  };

  const handleContextMenu = (node: FileNode, e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      node,
      position: { x: e.clientX, y: e.clientY },
    });
  };

  const handleNewFile = () => {
    if (contextMenu?.node.type === "folder") {
      setSelectedFolderPath(contextMenu.node.path);
    } else if (workspace) {
      setSelectedFolderPath(workspace.path);
    }
    setShowNewPromptDialog(true);
  };

  const handleNewFolder = () => {
    if (contextMenu?.node.type === "folder") {
      setSelectedFolderPath(contextMenu.node.path);
    } else if (workspace) {
      setSelectedFolderPath(workspace.path);
    }
    setShowNewFolderDialog(true);
  };

  return (
    <div className="w-64 border-r border-border bg-card flex flex-col">
      {/* Navigator Header */}
      <div className="h-10 border-b border-border flex items-center px-3 justify-between">
        <span className="text-sm font-medium text-foreground">
          {t("layout.navigator")}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            className="p-1 hover:bg-accent rounded transition-colors"
            title={t("workspace.refresh")}
          >
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-auto p-2">
        {workspace?.file_tree ? (
          <FileTreeNode
            node={workspace.file_tree}
            level={0}
            onFileClick={handleFileClick}
            onContextMenu={handleContextMenu}
            currentFile={currentFile}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground text-center px-4">
              {t("workspace.noPrompts")}
            </p>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          node={contextMenu.node}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onNewFile={handleNewFile}
          onNewFolder={handleNewFolder}
        />
      )}

      {/* New Prompt Dialog */}
      {showNewPromptDialog && (
        <NewPromptDialog
          parentPath={selectedFolderPath}
          onClose={() => setShowNewPromptDialog(false)}
          onSuccess={handleRefresh}
        />
      )}

      {/* New Folder Dialog */}
      {showNewFolderDialog && (
        <NewFolderDialog
          parentPath={selectedFolderPath}
          onClose={() => setShowNewFolderDialog(false)}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}

