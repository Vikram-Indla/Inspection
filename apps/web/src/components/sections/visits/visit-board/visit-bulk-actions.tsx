"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Button from "@/components/saqeel/button/button";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect from "@/components/saqeel/select/select";
import DateRangePicker from "@/components/saqeel/date-range-picker/date-range-picker";
import type { DateRangePreset } from "@/components/saqeel/date-range-picker/date-range-picker";
import { formatDate } from "@/lib/dates";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { Text } from "@/components/saqeel/type";
import {
  bulkCancelVisits, bulkRescheduleVisits, bulkReassignVisits, bulkEditVisits,
  type ActionResult, type BulkVerb,
} from "@/app/(app)/visits/actions";
import type { VisitBoardRow } from "@/features/visits/rows";
import type { VisitsBoardStrings } from "@/features/visits/board-strings";
import type { VisitReassignmentInspector } from "@/features/visits/queries";
import VisitOutcomeLedger from "./visit-outcome-ledger";
import styles from "./visit-board.module.css";

const EMPTY: ActionResult = {};

export default function VisitBulkActions({ selectedRows, inspectors, reassignmentAvailable, visitTypeOptions, strings, routeBase, locale, datePresets, monthLabels, onClearSelection }: {
  selectedRows: readonly VisitBoardRow[];
  inspectors: readonly VisitReassignmentInspector[];
  reassignmentAvailable: boolean;
  visitTypeOptions: readonly { readonly value: string; readonly label: string }[];
  strings: VisitsBoardStrings;
  routeBase: string;
  locale: "ar" | "en";
  datePresets: readonly DateRangePreset[];
  monthLabels: { previous: string; next: string };
  onClearSelection: () => void;
}) {
  const [lastVerb, setLastVerb] = useState<BulkVerb | null>(null);
  const [inspectorId, setInspectorId] = useState("");
  const [visitType, setVisitType] = useState("");
  const [window, setWindow] = useState({ from: "", to: "" });
  const [identity, setIdentity] = useState<Record<BulkVerb, { key: string; correlation: string }> | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  const [cancelResult, cancelAction, cancelPending] = useActionState<ActionResult, FormData>(bulkCancelVisits, EMPTY);
  const [rescheduleResult, rescheduleAction, reschedulePending] = useActionState<ActionResult, FormData>(bulkRescheduleVisits, EMPTY);
  const [reassignResult, reassignAction, reassignPending] = useActionState<ActionResult, FormData>(bulkReassignVisits, EMPTY);
  const [editResult, editAction, editPending] = useActionState<ActionResult, FormData>(bulkEditVisits, EMPTY);

  const resultByVerb: Record<BulkVerb, ActionResult> = {
    cancel: cancelResult, reschedule: rescheduleResult, reassign: reassignResult, edit: editResult,
  };
  const busy = cancelPending || reschedulePending || reassignPending || editPending;
  const result = lastVerb ? resultByVerb[lastVerb] : null;
  const hasLedger = Boolean(result?.items?.length);
  const formError = result?.formErrorCode ? strings.error[result.formErrorCode] : null;

  useEffect(() => {
    const make = () => ({ key: crypto.randomUUID(), correlation: crypto.randomUUID() });
    setIdentity({ cancel: make(), reschedule: make(), reassign: make(), edit: make() });
  }, []);

  useEffect(() => {
    if (!busy && (hasLedger || formError)) summaryRef.current?.focus();
  }, [busy, hasLedger, formError]);

  const selectedIds = selectedRows.map(row => row.id);
  const plans = new Set(selectedRows.map(row => row.planId));
  const samePlan = plans.size === 1 && [...plans].every(planId => planId.length > 0);
  const eligible = {
    reschedule: selectedRows.filter(row => row.reschedulable).length,
    notStarted: selectedRows.filter(row => row.notStarted).length,
  };
  const eligibleInspectors = inspectors.filter(inspector =>
    selectedIds.every(id => inspector.eligibleVisitIds.includes(id)));
  const eligLine = (value: number) =>
    strings.eligCount.replace("{n}", String(value)).replace("{total}", String(selectedRows.length));

  const hidden = selectedIds.map(id => <input key={id} type="hidden" name="visit_ids" value={id} />);
  const identityFields = (verb: BulkVerb) => identity && (
    <>
      <input type="hidden" name="idempotency_key" value={`visits.${verb}.${identity[verb].key}`} />
      <input type="hidden" name="correlation_id" value={identity[verb].correlation} />
    </>
  );
  const readableWindow = (value: string) => {
    const [day, time] = value.split("T");
    if (!day) return strings.bulkWindowEmpty;
    const date = formatDate(`${day}T00:00:00`, locale);
    return time ? `${date} ${time}` : date;
  };
  const windowDisplay = window.from || window.to
    ? `${readableWindow(window.from)} — ${readableWindow(window.to)}`
    : strings.bulkWindowEmpty;
  const disabled = busy || !identity;

  return (
    <>
      <Card as="section" labelledBy="visit-bulk-heading">
        <CardHeader
          level="h2"
          titleId="visit-bulk-heading"
          title={strings.bulkHeading}
          description={strings.eligVerified}
          trailing={
            <span className={styles.summary}>
              <StatusPill tone="info">{strings.selected.replace("{n}", String(selectedRows.length))}</StatusPill>
              <Button variant="tertiary" onClick={onClearSelection}>{strings.clearSelection}</Button>
            </span>
          }
        />
        <CardBody>
          <ul className={styles.eligibility} aria-label={strings.eligHeading}>
            <li>{strings.eligReschedule}: <strong>{eligLine(eligible.reschedule)}</strong></li>
            <li>{strings.eligCancel}: <strong>{eligLine(eligible.reschedule)}</strong></li>
            <li>{strings.eligReassign}: <strong>{eligLine(eligible.notStarted)}</strong></li>
            <li>{strings.eligEdit}: <strong>{samePlan ? eligLine(eligible.reschedule) : "—"}</strong></li>
          </ul>
          {!samePlan ? <EmptyState variant="inline" tone="warning" size="sm" title={strings.eligSamePlanBlocked} /> : null}

          <div className={styles.forms}>
            <form className={styles.form} action={rescheduleAction} onSubmit={() => setLastVerb("reschedule")}>
              {hidden}{identityFields("reschedule")}
              <input type="hidden" name="window_start" value={window.from} />
              <input type="hidden" name="window_end" value={window.to} />
              <DateRangePicker
                from={window.from}
                to={window.to}
                onChange={setWindow}
                label={strings.bulkWindowStart}
                displayValue={windowDisplay}
                presets={datePresets}
                locale={locale}
                monthLabels={monthLabels}
                strings={{
                  from: strings.bulkWindowStart,
                  to: strings.bulkWindowEnd,
                  pickStart: strings.bulkWindowStart,
                  pickEnd: strings.bulkWindowEnd,
                  reset: strings.clearSelection,
                  apply: strings.bulkRescheduleBtn,
                  empty: strings.bulkWindowEmpty,
                }}
                timeLabels={{ from: strings.bulkWindowStart, to: strings.bulkWindowEnd }}
                withTime
              />
              <Field label={strings.bulkReason} htmlFor="bulk-reschedule-reason">
                <input id="bulk-reschedule-reason" className={styles.control} name="mutation_reason" required />
              </Field>
              <Button type="submit" variant="secondary" disabled={disabled}>{strings.bulkRescheduleBtn}</Button>
            </form>

            {reassignmentAvailable ? (
              <form className={styles.form} action={reassignAction} onSubmit={() => setLastVerb("reassign")}>
                {hidden}{identityFields("reassign")}
                <input type="hidden" name="inspector_id" value={inspectorId} />
                <Field label={strings.bulkReassignTo}>
                  <SaqeelSelect
                    label={strings.bulkReassignTo}
                    value={inspectorId}
                    onChange={setInspectorId}
                    options={[
                      { value: "", label: strings.bulkSelectOption },
                      ...eligibleInspectors.map(inspector => ({ value: inspector.userId, label: inspector.fullName })),
                    ]}
                  />
                </Field>
                <Field label={strings.bulkReason} htmlFor="bulk-reassign-reason">
                  <input id="bulk-reassign-reason" className={styles.control} name="mutation_reason" required />
                </Field>
                <Button type="submit" variant="secondary"
                  disabled={disabled || eligibleInspectors.length === 0}>{strings.bulkReassignBtn}</Button>
                {eligibleInspectors.length === 0 ? (
                  <EmptyState variant="inline" size="sm" title={strings.reassignNoInspectors} />
                ) : null}
              </form>
            ) : (
              <div className={styles.form}>
                <EmptyState variant="inline" size="sm" icon="restricted"
                  title={strings.bulkReassignTo} description={strings.reassignUnavailable} />
              </div>
            )}

            <form className={styles.form} action={cancelAction} onSubmit={() => setLastVerb("cancel")}>
              {hidden}{identityFields("cancel")}
              <Field label={strings.bulkCancelNote} htmlFor="bulk-cancel-note" hint={strings.bulkCancelPlaceholder}>
                <input id="bulk-cancel-note" className={styles.control} name="note" />
              </Field>
              <Button type="submit" variant="danger" disabled={disabled}>{strings.bulkCancelBtn}</Button>
            </form>

            <form className={styles.form} action={editAction} onSubmit={() => setLastVerb("edit")}>
              {hidden}{identityFields("edit")}
              <input type="hidden" name="visit_type" value={visitType} />
              <Field label={strings.bulkEditType}>
                <SaqeelSelect
                  label={strings.bulkEditType}
                  value={visitType}
                  onChange={setVisitType}
                  options={[
                    { value: "", label: strings.bulkSelectOption },
                    ...visitTypeOptions,
                  ]}
                />
              </Field>
              <Field label={strings.bulkEditNotes} htmlFor="bulk-edit-notes">
                <input id="bulk-edit-notes" className={styles.control} name="notes"
                  placeholder={strings.bulkEditNotesPlaceholder} />
              </Field>
              <label className={styles.choice} htmlFor="bulk-set-notes">
                <input id="bulk-set-notes" type="checkbox" name="set_notes" value="1" />
                <Text as="span" role="label" tone="inherit">{strings.bulkEditSetNotes}</Text>
              </label>
              <Field label={strings.bulkReason} htmlFor="bulk-edit-reason">
                <input id="bulk-edit-reason" className={styles.control} name="mutation_reason" required />
              </Field>
              <Button type="submit" variant="secondary" disabled={disabled || !samePlan}>{strings.bulkEditBtn}</Button>
            </form>
          </div>
        </CardBody>
      </Card>

      {busy ? (
        <EmptyState variant="inline" size="sm" busy
          title={`${strings.progressBusy.replace("{n}", String(selectedRows.length))} · ${strings.frozenSelection}`} />
      ) : null}

      {!busy && formError ? (
        <div className={styles.formError} ref={summaryRef} tabIndex={-1} role="alert">
          <Text tone="danger">{formError}</Text>
        </div>
      ) : null}

      {!busy && hasLedger && lastVerb && result ? (
        <VisitOutcomeLedger result={result} verb={lastVerb} strings={strings}
          routeBase={routeBase} summaryRef={summaryRef} />
      ) : null}
    </>
  );
}
