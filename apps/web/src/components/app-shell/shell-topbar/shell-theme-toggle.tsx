"use client";

import { useEffect, useState } from "react";
import IconButton from "@/components/saqeel/icon-button/icon-button";

// Light/dark only. Precedence is explicit stored choice > dark, matching
// ThemeScript, ThemeChannelSync and ThemeToggle — all four have to agree or the
// first client navigation flips the document back.
//
// This control used to carry a third "system" mode behind its own
// `saqeel-theme-mode` key. Nothing else in the application read that key: the
// pre-paint resolver and the channel sync both read `saqeel-theme`, so a user on
// "system" had a preference only this button could see, and any navigation
// re-resolved the document from the light/dark value instead.
type Theme = "light" | "dark";

const THEME_KEY = "saqeel-theme";
const RETIRED_MODE_KEY = "saqeel-theme-mode";

function currentTheme(): Theme {
  const applied = document.documentElement.getAttribute("data-theme");
  if (applied === "light" || applied === "dark") return applied;
  const stored = localStorage.getItem(THEME_KEY);
  return stored === "light" ? "light" : "dark";
}

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
    localStorage.removeItem(RETIRED_MODE_KEY);
  } catch {
    /* private mode: the document attribute above still holds for this session */
  }
}

export default function ShellThemeToggle({ labels }: {
  labels: Readonly<Record<Theme, string>>;
}) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    try {
      setTheme(currentTheme());
    } catch {
      setTheme("dark");
    }
  }, []);

  const next: Theme = theme === "dark" ? "light" : "dark";

  return (
    <IconButton
      icon={theme === "dark" ? "themeDark" : "themeLight"}
      label={labels[next]}
      title={labels[next]}
      onClick={() => {
        setTheme(next);
        applyTheme(next);
      }}
    />
  );
}
