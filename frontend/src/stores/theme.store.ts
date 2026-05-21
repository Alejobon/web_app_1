import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ThemePreference } from "@/types/common.types";

type ThemeState = { theme: ThemePreference; setTheme: (theme: ThemePreference) => void; applyTheme: () => void };
function resolveTheme(theme: ThemePreference) { return theme === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : theme; }
export const useThemeStore = create<ThemeState>()(persist((set, get) => ({
  theme: "light",
  setTheme: (theme) => { set({ theme }); document.documentElement.classList.toggle("dark", resolveTheme(theme) === "dark"); },
  applyTheme: () => document.documentElement.classList.toggle("dark", resolveTheme(get().theme) === "dark"),
}), { name: "desahogate-theme", onRehydrateStorage: () => (state) => state?.applyTheme() }));
