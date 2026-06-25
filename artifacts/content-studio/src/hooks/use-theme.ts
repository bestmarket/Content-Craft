import { useState, useEffect } from "react";

export type Theme = "light" | "dark" | "system";

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

function applyTheme(theme: Theme) {
  const resolved = resolveTheme(theme);
  if (resolved === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem("selovox-theme") as Theme | null;
    if (stored === "dark" || stored === "light" || stored === "system") return stored;
    return "system";
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("selovox-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = (t: Theme) => setThemeState(t);
  const toggle = () => setThemeState((t) => {
    const resolved = resolveTheme(t);
    return resolved === "dark" ? "light" : "dark";
  });

  const isDark = resolveTheme(theme) === "dark";

  return { theme, setTheme, toggle, isDark };
}

export function initTheme() {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem("selovox-theme") as Theme | null;
  const theme: Theme =
    stored === "dark" || stored === "light" || stored === "system"
      ? stored
      : "system";
  applyTheme(theme);
}
