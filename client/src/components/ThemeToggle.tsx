import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme, switchable } = useTheme();

  if (!switchable || !toggleTheme) return null;

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={isDark}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="fixed right-4 top-4 z-[100] inline-flex h-10 items-center gap-2 rounded-full border border-[#e8dff0] bg-white/90 px-3 text-xs font-semibold text-[#5b3b92] shadow-lg backdrop-blur transition hover:border-[#b99cda] hover:bg-white dark:border-[rgba(212,175,55,0.35)] dark:bg-[#0F1B3D]/95 dark:text-[#F5D76E] dark:hover:border-[#D4AF37] dark:hover:bg-[#172554]"
    >
      {isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
      <span className="hidden sm:inline">{isDark ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}
