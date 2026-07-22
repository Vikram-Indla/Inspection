"use client";
// Export page action (PLN-REQ-017). Calls the planning.export-capability-gated
// server action with the CURRENT URL filter state and downloads the returned
// CSV client-side. Failures surface as neutral inline copy — never provider text.
import { useState, useTransition } from "react";
import { exportPlanningVisitsCsv } from "./export-actions";
import type { PlanningListParams } from "@/lib/planning/visit-list";

export type ExportButtonStrings = {
  label: string;
  busyLabel: string;
  unauthorized: string;
  unavailable: string;
  cappedNote: string; // e.g. "Exported the first {n} rows — refine filters for the rest."
};

export default function ExportButton({ params, strings }: { params: PlanningListParams; strings: ExportButtonStrings }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const run = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await exportPlanningVisitsCsv(params);
      if (!result.ok) {
        setMessage(result.error === "unauthorized" ? strings.unauthorized : strings.unavailable);
        return;
      }
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      if (result.capped) setMessage(strings.cappedNote.replace("{n}", String(result.rowCount)));
    });
  };
  return (
    <span className="ax-row" style={{ gap: "var(--space-3)", alignItems: "center" }}>
      <button type="button" className="ax-btn ax-btn--secondary" disabled={pending} onClick={run}>
        {pending ? strings.busyLabel : strings.label}
      </button>
      {message && <span className="ax-caption" role="status">{message}</span>}
    </span>
  );
}
