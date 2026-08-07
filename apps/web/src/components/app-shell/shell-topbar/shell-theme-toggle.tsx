"use client";

import { useEffect, useState } from "react";
import IconButton from "@/components/saqeel/icon-button/icon-button";
import type { IconName } from "@/components/saqeel/icon/icon-registry";

type ThemeMode = "system" | "light" | "dark";
type ResolvedTheme = "light" | "dark";

const MODE_KEY = "saqeel-theme-mode";
const RESOLVED_KEY = "saqeel-theme";
const NEXT_MODE: Readonly<Record<ThemeMode, ThemeMode>> = {
  system: "light",
  light: "dark",
  dark: "system",
};
const MODE_ICON: Readonly<Record<ThemeMode, IconName>> = {
  system: "themeSystem",
  light: "themeLight",
  dark: "themeDark",
};

function systemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function readMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(MODE_KEY);
    if (stored === "system" || stored === "light" || stored === "dark") return stored;
    const legacy = localStorage.getItem(RESOLVED_KEY);
    return legacy === "light" || legacy === "dark" ? legacy : "system";
  } catch {
    return "system";
  }
}

function applyTheme(mode: ThemeMode): void {
  const resolved: ResolvedTheme = mode === "system" ? systemTheme() : mode;
  document.documentElement.setAttribute("data-theme", resolved);
  try {
    localStorage.setItem(MODE_KEY, mode);
    localStorage.setItem(RESOLVED_KEY, resolved);
  } catch {
    document.documentElement.setAttribute("data-theme", resolved);
  }
}

export default function ShellThemeToggle({ labels }: {
  labels: Readonly<Record<ThemeMode, string>>;
}) {
  const [mode, setMode] = useState<ThemeMode>("dark");

  useEffect(() => {
    const initial = readMode();
    setMode(initial);
    applyTheme(initial);
  }, []);

  useEffect(() => {
    if (mode !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const sync = () => applyTheme("system");
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [mode]);

  const next = NEXT_MODE[mode];

  function cycle(): void {
    setMode(next);
    applyTheme(next);
  }

  return (
    <IconButton
      icon={MODE_ICON[mode]}
      label={labels[next]}
      title={labels[mode]}
      onClick={cycle}
    />
  );
}
