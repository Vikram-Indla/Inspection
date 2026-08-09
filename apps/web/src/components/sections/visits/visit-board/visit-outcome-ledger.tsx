"use client";
import { type Ref } from "react";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { CellLink, CellMuted, type DataColumn } from "@/components/saqeel/data-table/data-table";
import DefinitionList from "@/components/saqeel/definition-list/definition-list";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import type { ActionResult, BulkVerb, ItemResult, OutcomeCode } from "@/app/(app)/visits/actions";
import type { VisitsBoardStrings } from "@/features/visits/board-strings";
import styles from "./visit-board.module.css";

const OUTCOME_TONE: Record<OutcomeCode, StatusTone> = {
  applied: "success",
  applied_no_notification: "warning",
  blocked_not_publishable: "warning",
  blocked_started: "warning",
  blocked_no_assignment: "warning",
  error: "danger",
};

export default function VisitOutcomeLedger({ result, verb, strings, routeBase, summaryRef }: {
  result: ActionResult;
  verb: BulkVerb;
  strings: VisitsBoardStrings;
  routeBase: string;
  summaryRef: Ref<HTMLDivElement>;
}) {
  const items = result.items ?? [];
  const applied = items.filter(item => item.outcome === "applied").length;
  const noNotification = items.filter(item => item.outcome === "applied_no_notification").length;
  const blocked = items.filter(item => item.outcome.startsWith("blocked") || item.outcome === "error").length;
  const anyProblem = blocked > 0 || noNotification > 0;
  const count = (template: string, value: number) => template.replace("{n}", String(value));

  const columns: DataColumn<ItemResult>[] = [
    {
      key: "visit",
      header: strings.ledgerColVisit,
      isRowHeader: true,
      cell: item => <CellLink href={`${routeBase}/${item.id}`}><bdi>{item.id.slice(0, 8)}</bdi></CellLink>,
    },
    {
      key: "outcome",
      header: strings.ledgerColOutcome,
      cell: item => <StatusPill tone={OUTCOME_TONE[item.outcome]}>{strings.outcomeShort[item.outcome]}</StatusPill>,
    },
    { key: "reason", header: strings.ledgerColReason, cell: item => strings.outcome[item.outcome] },
  ];

  return (
    <div ref={summaryRef} tabIndex={-1} role={anyProblem ? "alert" : "status"} aria-live="polite">
      <Card as="section" labelledBy="visit-ledger-heading">
        <CardHeader
          level="h2"
          titleId="visit-ledger-heading"
          title={strings.verb[verb]}
          trailing={
            <span className={styles.summary}>
              {applied > 0 ? <StatusPill tone="success">{count(strings.ledgerSummaryApplied, applied)}</StatusPill> : null}
              {blocked > 0 ? <StatusPill tone="warning">{count(strings.ledgerSummaryBlocked, blocked)}</StatusPill> : null}
              {noNotification > 0 ? <StatusPill tone="warning">{count(strings.ledgerSummaryNoNotif, noNotification)}</StatusPill> : null}
            </span>
          }
        />
        <CardBody>
          {result.receipt ? (
            <DefinitionList
              columns="two"
              items={[
                { label: strings.receiptCommand, value: <bdi>{result.receipt.commandId}</bdi> },
                { label: strings.receiptStatus, value: result.receipt.status },
                {
                  label: strings.receiptProgress,
                  value: `${result.receipt.appliedCount + result.receipt.blockedCount + result.receipt.failedCount} / ${result.receipt.targetCount}`,
                },
                { label: strings.receiptInventory, value: <bdi>{result.receipt.inventoryHash || strings.receiptUnknown}</bdi> },
              ]}
            />
          ) : null}
          <DataTable
            rows={items}
            columns={columns}
            getRowId={item => item.id}
            empty={{ icon: "calendar", title: strings.ledgerColOutcome }}
            density="compact"
          />
          {blocked > 0 ? <CellMuted>{strings.ledgerRetrySafe}</CellMuted> : null}
        </CardBody>
      </Card>
    </div>
  );
}
