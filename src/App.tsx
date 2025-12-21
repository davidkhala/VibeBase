import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { useThemeStore } from "./stores/themeStore";
import { useWorkspaceStore } from "./stores/workspaceStore";
import MainLayout from "./components/layout/MainLayout";
import WelcomeScreen from "./components/WelcomeScreen";
import Header from "./components/layout/Header";

function App() {
  const { theme, initTheme } = useThemeStore();
  const { workspace } = useWorkspaceStore();
  const isFirstRender = useRef(true);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  useEffect(() => {
    // Skip first render as index.html and main.tsx already handled initial theme
    if (isFirstRender.current) {
      isFirstRender.current = false;
      console.log("⏭️ Skipping first render theme update (already handled by main.tsx)");
      return;
    }

    console.log("=== Theme changed to:", theme);

    const updateTheme = async () => {
      const root = document.documentElement;
      root.classList.remove("light", "dark");

      let effectiveTheme: string;
      if (theme === "system") {
        // First apply matchMedia detected theme synchronously to avoid flicker
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const immediateTheme = isDark ? "dark" : "light";
        root.classList.add(immediateTheme);
        console.log("⚡ Immediately applied theme:", immediateTheme);

        // Then try to get more accurate system theme from Rust API
        try {
          console.log("🔍 Fetching real system theme from Rust...");
          effectiveTheme = await invoke<string>("get_system_theme");
          console.log("✅ Got system theme from Rust:", effectiveTheme);

          // If Rust returns different theme than immediate one, update it
          if (effectiveTheme !== immediateTheme) {
            root.classList.remove("light", "dark");
            root.classList.add(effectiveTheme);
            console.log("🔄 Updated to Rust theme:", effectiveTheme);
          }
        } catch (error) {
          console.error("❌ Failed to get system theme from Rust:", error);
          // Use the already applied matchMedia result
          effectiveTheme = immediateTheme;
          console.log("⚠️ Using fallback matchMedia:", effectiveTheme);
        }

        console.log("📱 SYSTEM THEME (final):", {
          theme,
          effectiveTheme,
          timestamp: Date.now()
        });
      } else {
        // Direct theme selection
        effectiveTheme = theme;
        root.classList.add(theme);
        console.log("🎨 Direct theme:", effectiveTheme);
      }

      // Update window theme (for native title bar on macOS)
      console.log("🪟 Calling set_window_theme with:", effectiveTheme);
      invoke("set_window_theme", { theme: effectiveTheme })
        .then(() => console.log("✅ set_window_theme succeeded"))
        .catch((error) => console.error("❌ set_window_theme failed:", error));
    };

    // Execute update
    updateTheme();
  }, [theme]);

  // Listen for system theme changes when using "system" theme
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      const systemTheme = e.matches ? "dark" : "light";
      root.classList.add(systemTheme);

      // Update window theme
      invoke("set_window_theme", { theme: systemTheme }).catch((error) => {
        console.error("Failed to set window theme:", error);
      });
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  if (!workspace) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1">
          <WelcomeScreen />
        </div>
      </div>
    );
  }

  return <MainLayout />;
}

export default App;






