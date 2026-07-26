"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Companion to ThemeScript. The blocking head script resolves the theme once
// on document load; this reapplies the same rule after client-side navigation.
//
// This re-applies the same rule on every pathname change, using the identical
// precedence as the head script: sign-in/reset are dark-locked, while every
// authenticated application route—including Field—honours the persisted
// preference and otherwise falls back to the approved light theme.

const isDarkChannel = (pathname: string) =>
  pathname === "/login" ||
  pathname.startsWith("/login/") ||
  pathname === "/reset" ||
  pathname.startsWith("/reset/");

export default function ThemeChannelSync() {
  const pathname = usePathname();

  useEffect(() => {
    // Authentication surfaces remain fixed dark; application routes use the
    // persisted user preference below.
    if (isDarkChannel(pathname ?? "")) {
      document.documentElement.setAttribute("data-theme", "dark");
      return;
    }

    let persisted: string | null = null;
    try {
      persisted = localStorage.getItem("saqeel-theme");
    } catch {
      /* private mode */
    }
    document.documentElement.setAttribute(
      "data-theme",
      persisted === "light" || persisted === "dark" ? persisted : "light",
    );
  }, [pathname]);

  return null;
}
