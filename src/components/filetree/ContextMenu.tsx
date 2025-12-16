import { FileNode } from "../../stores/workspaceStore";
import { FilePlus, FolderPlus, Trash2 } from "lucide-react";

interface ContextMenuProps {
  node: FileNode;
  position: { x: number; y: number };
  onClose: () => void;
  onNewFile: () => void;
  onNewFolder: () => void;
  onDelete?: () => void;
}

export default function ContextMenu({
  node,
  position,
  onClose,
  onNewFile,
  onNewFolder,
  onDelete,
}: ContextMenuProps) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 w-48 bg-popover border border-border rounded-md shadow-lg py-1"
        style={{ left: position.x, top: position.y }}
      >
        {node.type === "folder" && (
          <>
            <button
              onClick={() => {
                onNewFile();
                onClose();
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2"
            >
              <FilePlus className="w-4 h-4" />
              New File
            </button>
            <button
              onClick={() => {
                onNewFolder();
                onClose();
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              New Folder
            </button>
            <div className="h-px bg-border my-1" />
          </>
        )}

        {onDelete && (
          <button
            onClick={() => {
              if (confirm(`Are you sure you want to delete ${node.name}?`)) {
                onDelete();
                onClose();
              }
            }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        )}
      </div>
    </>
  );
}






