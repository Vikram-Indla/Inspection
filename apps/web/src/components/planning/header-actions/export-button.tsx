"use client";

import { useState, useTransition } from "react";
import IconButton from "@/components/saqeel/icon-button/icon-button";
import { Text } from "@/components/saqeel/type";
import { exportPlanningVisitsCsv } from "@/app/(app)/planning/export-actions";
import type { PlanningListParams } from "@/lib/planning/visit-list";
import styles from "./header-actions.module.css";

export type ExportButtonStrings = {
  label: string;
  busyLabel: string;
  unauthorized: string;
  unavailable: string;
  cappedNote: string;
};

export default function ExportButton({ params, strings }: {
  params: PlanningListParams;
  strings: ExportButtonStrings;
}) {
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
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.filename;
      anchor.click();
      URL.revokeObjectURL(url);
      if (result.capped) setMessage(strings.cappedNote.replace("{n}", String(result.rowCount)));
    });
  };
  return (
    <span className={styles.exportWrap}>
      <IconButton icon="export" label={pending ? strings.busyLabel : strings.label} disabled={pending} onClick={run} />
      {message ? <Text as="span" tone="secondary" live="status">{message}</Text> : null}
    </span>
  );
}
