"use client";
import { useState, useTransition } from "react";
import Button from "@/components/saqeel/button/button";
import { exportPlanningVisitsCsv } from "./export-actions";
import type { PlanningListParams } from "@/lib/planning/visit-list";
import styles from "./ExportButton.module.css";

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
    <span>
      <Button variant="secondary" disabled={pending} onClick={run}>
        {pending ? strings.busyLabel : strings.label}
      </Button>
      {message && <span className={styles.note} role="status">{message}</span>}
    </span>
  );
}
