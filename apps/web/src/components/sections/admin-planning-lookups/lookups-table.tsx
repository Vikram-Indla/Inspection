"use client";

import { useState, useTransition } from "react";
import { setLookupActive, type LookupResult } from "@/app/(app)/admin/planning/lookups/actions";
import Button from "@/components/saqeel/button/button";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Mono, Text } from "@/components/saqeel/type";
import type { LookupRow } from "@/features/admin-planning-lookups/queries";
import { humaniseEnum } from "@/lib/text";
import type { LookupsCopy } from "./lookups-manager";
import styles from "./lookups-screen.module.css";

export default function LookupsTable({ rows, canConfigure, locale, copy, onEdit }: {
  rows: readonly LookupRow[];
  canConfigure: boolean;
  locale: "en" | "ar";
  copy: LookupsCopy;
  onEdit: (id: string) => void;
}) {
  const c = copy.table;
  const [feedback, setFeedback] = useState<LookupResult>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const flagLabel = (flag: string): string =>
    copy.flags[flag as keyof typeof copy.flags] ?? humaniseEnum(flag, locale);

  const activeFlags = (metadata: Record<string, unknown>): string[] =>
    Object.entries(metadata)
      .filter(([, value]) => value !== false && value != null)
      .map(([flag]) => flagLabel(flag));

  const toggle = (row: LookupRow): void => {
    const form = new FormData();
    form.set("lookup_id", row.id);
    form.set("active", row.is_active ? "0" : "1");
    setFeedback({});
    setPendingId(row.id);
    startTransition(async () => {
      setFeedback(await setLookupActive(form));
      setPendingId(null);
    });
  };

  const baseColumns: DataColumn<LookupRow>[] = [
    {
      key: "key",
      header: c.colKey,
      isRowHeader: true,
      cell: row => (
        <span className={styles.keyCell}>
          <bdi><Mono>{row.key}</Mono></bdi>
          <Text role="label" tone="muted" as="span">{`#${row.sort_order}`}</Text>
        </span>
      ),
    },
    {
      key: "labels",
      header: c.colLabels,
      cell: row => (
        <span className={styles.labels}>
          <Text as="span" dir="auto">{row.label_en}</Text>
          {row.label_ar ? <Text role="label" tone="secondary" as="span" dir="auto">{row.label_ar}</Text> : null}
        </span>
      ),
    },
    {
      key: "flags",
      header: c.colFlags,
      cell: row => {
        const flags = activeFlags(row.metadata);
        return flags.length === 0 ? (
          <Text tone="muted" as="span">{c.noFlags}</Text>
        ) : (
          <span className={styles.chips}>
            {flags.map(flag => (
              <span key={flag} className={styles.chip}>
                <Text role="label" tone="secondary" as="span">{flag}</Text>
              </span>
            ))}
          </span>
        );
      },
    },
    {
      key: "status",
      header: c.colStatus,
      cell: row => (
        <StatusPill tone={row.is_active ? "success" : "neutral"} ping={false}>
          {row.is_active ? c.active : c.inactive}
        </StatusPill>
      ),
    },
  ];

  const actionsColumn: DataColumn<LookupRow> = {
    key: "actions",
    header: c.colActions,
    align: "end",
    cell: row => (
      <span className={styles.rowActions}>
        <Button variant="tertiary" size="sm" disabled={pendingId !== null} onClick={() => onEdit(row.id)}>
          {c.edit}
        </Button>
        <Button
          variant={row.is_active ? "tertiary" : "primary"}
          size="sm"
          busy={pendingId === row.id}
          disabled={pendingId !== null}
          onClick={() => toggle(row)}
        >
          {row.is_active ? c.deactivate : c.activate}
        </Button>
      </span>
    ),
  };

  const columns = canConfigure ? [...baseColumns, actionsColumn] : baseColumns;

  return (
    <div className={styles.tableWrap}>
      {feedback.ok ? <Text tone="success" live="status">{feedback.ok}</Text> : null}
      {feedback.error ? <Text tone="danger" live="alert">{feedback.error}</Text> : null}
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={row => row.id}
        caption={copy.title}
        empty={{ title: c.emptyTitle, description: c.emptyBody, icon: "forms" }}
      />
    </div>
  );
}
