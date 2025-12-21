import { create } from "zustand";

// History preview information
export interface HistoryPreview {
  historyId: string;
  content: string;
  timestamp: number;
}

interface EditorStore {
  currentFile: string | null;
  content: string;
  isDirty: boolean;
  // History preview state
  historyPreview: HistoryPreview | null;
  setCurrentFile: (filePath: string | null) => void;
  setContent: (content: string) => void;
  setDirty: (dirty: boolean) => void;
  // History preview methods
  setHistoryPreview: (preview: HistoryPreview | null) => void;
  clearHistoryPreview: () => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  currentFile: null,
  content: "",
  isDirty: false,
  historyPreview: null,

  setCurrentFile: (filePath) => set({ currentFile: filePath, historyPreview: null }),
  setContent: (content) => set({ content, isDirty: true }),
  setDirty: (dirty) => set({ isDirty: dirty }),
  setHistoryPreview: (preview) => set({ historyPreview: preview }),
  clearHistoryPreview: () => set({ historyPreview: null }),
}));








