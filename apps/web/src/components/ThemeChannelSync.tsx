"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Companion to ThemeScript. The blocking head script resolves the channel
// theme once, on document load. Client-side navigation between the web console
// and the field channel does not re-run it, so a soft transition from /login to
// /login/field would otherwise keep the console theme.
//
// This re-applies the same rule on every pathname change, using the identical
// precedence as the head script: the dark-locked channels (the field channel
// and the unified sign-in) are always dark and ignore any persisted preference;
// every other route honours the persisted choice and otherwise falls back to
// the sponsor-approved light theme.

const isDarkChannel = (pathname: string) =>
  pathname === "/field" ||
  pathname.startsWith("/field/") ||
  pathname === "/login" ||
  pathname.startsWith("/login/") ||
  pathname === "/reset" ||
  pathname.startsWith("/reset/");

export default function ThemeChannelSync() {
  const pathname = usePathname();

  useEffect(() => {
    // Dark-locked channel (field + sign-in): fixed dark, persisted preference
    // deliberately ignored.
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
