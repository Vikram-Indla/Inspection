"use client";

import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import DefinitionList from "@/components/saqeel/definition-list/definition-list";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import type { AdminWorkflowsMessages } from "@/features/admin-workflows/strings";
import type { WfTransition } from "@/lib/workflow/validate";
import styles from "./workflows.module.css";

export type ShownTransition = { t: WfTransition; i: number };

function TransitionLabel({ t }: { t: WfTransition }) {
  return <Text as="span" role="mono" dir="ltr">{`${t.from} → ${t.to}${t.trigger ? ` (${t.trigger})` : ""}`}</Text>;
}

export default function WfInspector({ shown, selectedIdx, onSelect, inspected, strings }: {
  shown: readonly ShownTransition[];
  selectedIdx: number | null;
  onSelect: (index: number) => void;
  inspected: WfTransition | null;
  strings: AdminWorkflowsMessages;
}) {
  const d = strings.deck;
  const columns: readonly DataColumn<ShownTransition>[] = [
    { key: "transition", header: d.transition, isRowHeader: true, cell: ({ t, i }) => (
      <button type="button" className={styles.linkButton} onClick={() => onSelect(i)}><TransitionLabel t={t} /></button>
    ) },
    { key: "actor", header: d.actor, cell: ({ t }) => t.actor
      ? <Text as="span">{t.actor}</Text>
      : <StatusPill tone="danger">{d.noActor}</StatusPill> },
    { key: "guards", header: d.guards, cell: ({ t }) => <Text as="span" tone="muted">{(t.guards ?? []).join(", ") || d.none}</Text> },
    { key: "fx", header: d.sideEffects, cell: ({ t }) => (t.fx ?? []).length === 0
      ? <Text as="span" tone="muted">{d.none}</Text>
      : <span className={styles.headActions}>{(t.fx ?? []).map((f, k) => (
          <StatusPill key={k} tone={f.idempotencyKey ? "success" : "warning"}>{`${f.kind} · ${f.idempotencyKey ? d.idempotent : d.noIdempotencyKey}`}</StatusPill>
        ))}</span> },
  ];

  return (
    <Card as="section">
      <CardHeader level="h3" title={inspected ? `${d.transition} — ${inspected.from} → ${inspected.to}` : d.inspector} />
      <CardBody>
        {inspected ? (
          <div className={styles.fieldStack}>
            <div className={styles.inspectorGrid}>
              <DefinitionList items={[{ label: d.allowedRole, value: inspected.actor || d.none }]} />
              <DefinitionList items={[{ label: d.trigger, value: inspected.trigger || d.none }]} />
            </div>
            <div>
              <Text role="label" tone="muted">{d.guards}</Text>
              {(inspected.guards ?? []).length === 0
                ? <Text tone="muted">{d.none}</Text>
                : <span className={styles.headActions}>{(inspected.guards ?? []).map(g => <StatusPill key={g} tone="neutral">{g}</StatusPill>)}</span>}
            </div>
            <div>
              <Text role="label" tone="muted">{d.sideEffects}</Text>
              {(inspected.fx ?? []).length === 0
                ? <Text tone="muted">{d.none}</Text>
                : <span className={styles.headActions}>{(inspected.fx ?? []).map((f, k) => (
                    <StatusPill key={k} tone={f.idempotencyKey ? "success" : "warning"}>{`${f.kind} · ${f.idempotencyKey ? d.idempotent : d.noIdempotencyKey}`}</StatusPill>
                  ))}</span>}
            </div>
            <Text tone="muted">{d.authoredElsewhere}</Text>
          </div>
        ) : (
          <Text tone="muted">{d.selectTransition}</Text>
        )}
        <DataTable
          columns={columns}
          rows={shown}
          getRowId={row => String(row.i)}
          getRowSelected={row => row.i === selectedIdx}
          empty={{ icon: "workflow", title: d.noTransitions }}
          bleed={false}
        />
        <Text role="label" tone="muted">{d.selectHint}</Text>
      </CardBody>
    </Card>
  );
}
