import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AdminThemeMode = "light" | "dark";

interface ThemeState {
  theme: AdminThemeMode;
  setTheme: (theme: AdminThemeMode) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "light",
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === "light" ? "dark" : "light" }),
    }),
    {
      name: "sippakades-admin-theme",
    }
  )
);
