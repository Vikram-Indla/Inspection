"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Companion to ThemeScript. The blocking head script resolves the channel
// theme once, on document load. Client-side navigation between the web console
// and the field channel does not re-run it, so a soft transition from /login to
// /login/field would otherwise keep the console theme.
//
// This re-applies the same rule on every pathname change, using the identical
// precedence as the head script: the field channel is always dark and ignores
// any persisted preference; every other route honours the persisted choice and
// otherwise falls back to the sponsor-approved light theme.

const isFieldChannel = (pathname: string) =>
  pathname === "/field" ||
  pathname.startsWith("/field/") ||
  pathname === "/login/field" ||
  pathname.startsWith("/login/field/");

export default function ThemeChannelSync() {
  const pathname = usePathname();

  useEffect(() => {
    // Field channel: fixed dark, persisted preference deliberately ignored.
    if (isFieldChannel(pathname ?? "")) {
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
