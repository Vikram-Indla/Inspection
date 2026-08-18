"use client";

import { useState } from "react";
import Tabs, { tabPanelProps } from "@/components/saqeel/tabs/tabs";
import type { LookupRow } from "@/features/admin-planning-lookups/queries";
import type { Messages } from "@/i18n/messages";
import { humaniseEnum } from "@/lib/text";
import LookupsEditor from "./lookups-editor";
import LookupsTable from "./lookups-table";
import styles from "./lookups-screen.module.css";

const ID_BASE = "lookup-kinds";

export type LookupsCopy = Messages["adminPlanningLookups"];

export default function LookupsManager({ rows, kinds, canConfigure, locale, copy }: {
  rows: readonly LookupRow[];
  kinds: readonly string[];
  canConfigure: boolean;
  locale: "en" | "ar";
  copy: LookupsCopy;
}) {
  const [kind, setKind] = useState(kinds[0] ?? "");
  const [editingId, setEditingId] = useState<string | null>(null);

  const kindLabel = (value: string): string =>
    copy.kinds[value as keyof typeof copy.kinds] ?? humaniseEnum(value, locale);

  const visible = rows.filter(row => row.kind === kind);
  const editingRow = editingId ? visible.find(row => row.id === editingId) : undefined;

  function selectKind(next: string): void {
    setKind(next);
    setEditingId(null);
  }

  return (
    <div className={styles.manager}>
      <Tabs
        items={kinds.map(value => ({ value, label: kindLabel(value) }))}
        value={kind}
        onChange={selectKind}
        label={copy.tabsLabel}
        idBase={ID_BASE}
      />
      <div className={styles.panel} {...tabPanelProps(ID_BASE, kind)}>
        {canConfigure ? (
          <LookupsEditor
            key={editingRow?.id ?? `add-${kind}`}
            row={editingRow}
            kind={kind}
            kinds={kinds}
            locale={locale}
            copy={copy}
            kindLabel={kindLabel}
            onDone={() => setEditingId(null)}
          />
        ) : null}
        <LookupsTable
          rows={visible}
          canConfigure={canConfigure}
          locale={locale}
          copy={copy}
          onEdit={setEditingId}
        />
      </div>
    </div>
  );
}
