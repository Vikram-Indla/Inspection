/* @retiring 2026-08-12 · replaced-by components/visits/visit-detail/visit-detail · pending none · delete-when 0-imports */
"use client";
// M10 / PLN-REQ-009 — scrolls a focused block into view after navigation from
// a notification deep-link (e.g. /visits/<id>?focus=return → the return
// banner). Rendered only when the page resolved a known focus target.
import { useEffect } from "react";

export default function FocusScroll({ targetId }: { targetId: string }) {
  useEffect(() => {
    document.getElementById(targetId)?.scrollIntoView({ block: "center" });
  }, [targetId]);
  return null;
}
