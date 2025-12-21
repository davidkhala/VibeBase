import { create } from "zustand";

export type Theme = "light" | "dark" | "system";

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  initTheme: () => void;
}

// Read localStorage immediately as initial value to avoid flicker from default
const getInitialTheme = (): Theme => {
  try {
    const savedTheme = localStorage.getItem("vibebase_theme") as Theme | null;
    if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
      console.log("📦 [themeStore] Initial theme from localStorage:", savedTheme);
      return savedTheme;
    }
  } catch (error) {
    console.error("Failed to read initial theme from localStorage:", error);
  }
  console.log("📦 [themeStore] Using default theme: system");
  return "system";
};

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: getInitialTheme(),
  
  setTheme: (theme: Theme) => {
    localStorage.setItem("vibebase_theme", theme);
    set({ theme });
  },
  
  initTheme: () => {
    // initTheme is now mainly used to ensure theme is initialized
    // Actual initialization is done when store is created
    const savedTheme = localStorage.getItem("vibebase_theme") as Theme | null;
    if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
      set({ theme: savedTheme });
    }
  },
}));






