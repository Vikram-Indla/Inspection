"use client";
import { useState, useTransition } from "react";
import Button from "@/components/saqeel/button/button";
import CountBadge from "@/components/saqeel/count-badge/count-badge";
import Toolbar from "@/components/saqeel/toolbar/toolbar";
import { authorizeOperationsExport } from "./actions";
import styles from "./OpsExport.module.css";
import { Text } from "@/components/saqeel/type";
// M08-017 — Operations Center CSV export. One button per table (live monitoring,
// SLA watch, high-risk board); each exports the CURRENT region/city-scoped view.
// Rows + headers are formatted server-side and passed in, so this module owns no
// enum labels or i18n — it only escapes and downloads. A UTF-8 BOM is prefixed
// so Arabic factory/inspector names survive Excel (parity with the localization
// export pattern, Manager.tsx).
export type ExportDataset = {
  key: "visits" | "alerts" | "kpis";
  label: string;
  filename: string;
  headers: string[];
  rows: string[][];
  filters: Record<string, string>;
};

export type OpsExportStrings = {
  heading: string;
  scopeNote: string;
  authorizing: string;
  authorized: string;
  unavailable: string;
};

const BOM = "﻿";

function toCsv(headers: string[], rows: string[][]): string {
  const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.map(esc).join(","), ...rows.map(r => r.map(esc).join(","))];
  // BOM keeps Arabic intact when the CSV lands in Excel; CRLF for Excel parity.
  return BOM + lines.join("\r\n");
}

function download(ds: ExportDataset) {
  const blob = new Blob([toCsv(ds.headers, ds.rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = ds.filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function OpsExport({ datasets, strings }: { datasets: ExportDataset[]; strings: OpsExportStrings }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const requestDownload = (dataset: ExportDataset) => {
    const correlationId = crypto.randomUUID();
    const formData = new FormData();
    formData.set("dataset", dataset.key);
    formData.set("row_count", String(dataset.rows.length));
    formData.set("filters", JSON.stringify(dataset.filters));
    formData.set("correlation_id", correlationId);
    setMessage(strings.authorizing);
    startTransition(async () => {
      const result = await authorizeOperationsExport({}, formData);
      if (!result.ok) {
        // Detailed RPC/RLS diagnostics stay server-side. The client always
        // presents the localized, fail-closed recovery message.
        setMessage(strings.unavailable);
        return;
      }
      download(dataset);
      setMessage(`${strings.authorized} ${result.receiptId ?? ""}`.trim());
    });
  };
  return (
    <Toolbar
      label={strings.heading}
      trailing={
        <>
          <Text as="span" tone="muted">{strings.scopeNote}</Text>
          {message ? <Text as="span" tone="muted" live="status">{message}</Text> : null}
        </>
      }
    >
      <Text as="span" role="label" tone="secondary">{strings.heading}</Text>
      {datasets.map(dataset => (
        <Button
          key={dataset.key}
          variant="secondary"
          size="sm"
          disabled={pending || dataset.rows.length === 0}
          onClick={() => requestDownload(dataset)}
          label={`${dataset.label} — ${dataset.rows.length}`}
        >
          {dataset.label}
          <CountBadge value={dataset.rows.length} />
        </Button>
      ))}
    </Toolbar>
  );
}
