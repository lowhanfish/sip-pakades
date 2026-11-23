"use client";

import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/store/useThemeStore";
import { useEffect, useState } from "react";

export function AdminThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl admin-glass flex items-center justify-center opacity-70" />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Ubah ke Mode Light" : "Ubah ke Mode Dark"}
      aria-label={isDark ? "Ubah ke Mode Light" : "Ubah ke Mode Dark"}
      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold admin-glass hover:scale-[1.02] transition cursor-pointer"
    >
      {isDark ? (
        <>
          <Sun className="w-4 h-4 text-yellow-300" />
          <span className="hidden sm:inline">Light</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-sky-600" />
          <span className="hidden sm:inline">Dark</span>
        </>
      )}
    </button>
  );
}
