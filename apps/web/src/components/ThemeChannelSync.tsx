"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Companion to ThemeScript. The blocking head script resolves the channel
// default once, on document load. Client-side navigation between the web
// console and the field channel does not re-run it, so a soft transition from
// /login to /login/field would otherwise keep the console default.
//
// This re-applies the same rule on every pathname change, and only when the
// user has expressed no explicit preference — a persisted `saqeel-theme` value
// still wins everywhere, exactly as in the head script.

const isFieldChannel = (pathname: string) =>
  pathname === "/field" ||
  pathname.startsWith("/field/") ||
  pathname === "/login/field" ||
  pathname.startsWith("/login/field/");

export default function ThemeChannelSync() {
  const pathname = usePathname();

  useEffect(() => {
    let persisted: string | null = null;
    try {
      persisted = localStorage.getItem("saqeel-theme");
    } catch {
      /* private mode */
    }
    if (persisted === "light" || persisted === "dark") return;

    document.documentElement.setAttribute(
      "data-theme",
      isFieldChannel(pathname ?? "") ? "dark" : "light",
    );
  }, [pathname]);

  return null;
}
