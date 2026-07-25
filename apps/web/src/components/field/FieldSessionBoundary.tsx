"use client";

import { useEffect, type ReactNode } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { bootstrapFieldSession, safeFieldReturnPath } from "@/lib/field-auth";

function recoveryUrl(reason: "expired" | "unauthorized"): string {
  const intended = safeFieldReturnPath(`${window.location.pathname}${window.location.search}${window.location.hash}`);
  return `/login?reason=${reason}&next=${encodeURIComponent(intended)}`;
}

export default function FieldSessionBoundary({ children }: { children: ReactNode }) {
  useEffect(() => {
    const sb = supabaseBrowser();
    let active = true;
    const recover = async () => {
      const result = await bootstrapFieldSession(sb, navigator.onLine);
      if (!active || result.status === "ready" || result.status === "offline_known") return;
      window.location.replace(recoveryUrl(result.status === "unauthorized" ? "unauthorized" : "expired"));
    };
    const online = () => { void recover(); };
    window.addEventListener("online", online);
    const { data } = sb.auth.onAuthStateChange(event => {
      if (!active) return;
      if (event === "SIGNED_OUT") window.location.replace(recoveryUrl("expired"));
      if (event === "TOKEN_REFRESHED") void recover();
    });
    return () => {
      active = false;
      window.removeEventListener("online", online);
      data.subscription.unsubscribe();
    };
  }, []);
  return children;
}
