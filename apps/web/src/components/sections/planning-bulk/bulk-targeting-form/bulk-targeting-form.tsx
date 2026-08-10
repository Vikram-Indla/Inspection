"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Stack from "@/components/saqeel/stack/stack";
import Toolbar from "@/components/saqeel/toolbar/toolbar";
import Button from "@/components/saqeel/button/button";
import Field from "@/components/saqeel/field/field";
import TextInput from "@/components/saqeel/text-input/text-input";
import CountBadge from "@/components/saqeel/count-badge/count-badge";
import PlanningNotice from "@/components/sections/planning-single/planning-notice/planning-notice";
import BulkEvidenceTable, { type EvidenceTableStrings, type TableEmptyReason } from "@/components/sections/planning-bulk/bulk-evidence-table/bulk-evidence-table";
import BulkCampaignSummary, { type CampaignSummaryStrings } from "@/components/sections/planning-bulk/bulk-campaign-summary/bulk-campaign-summary";
import BulkSelectionBar, { type SelectionBarStrings } from "@/components/sections/planning-bulk/bulk-selection-bar/bulk-selection-bar";
import BulkResultsPager, { type ResultsPagerStrings } from "@/components/sections/planning-bulk/bulk-results-pager/bulk-results-pager";
import { saveBulkDraft } from "@/app/(app)/planning/bulk/actions";
import { countSelectionBy, hasActiveVisit, matchesQuery, readStoredSelection, writeStoredSelection } from "@/features/planning-bulk/selection";
import type { CriteriaFactory } from "@/features/planning-bulk/view";
import { formatDate } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import styles from "./bulk-targeting-form.module.css";

export type BulkFormStrings = EvidenceTableStrings & CampaignSummaryStrings & SelectionBarStrings & ResultsPagerStrings & {
  filterLabel: string; filterPlaceholder: string; resultsCount: string;
  selectVisible: string; selectAllResults: string;
  provSynced: string; provNoSync: string;
  invalidTitle: string; invalidBody: string; invalidKeep: string; invalidClear: string;
  selectAllConfirmTitle: string; selectAllConfirmBody: string; selectAllConfirmInputLabel: string;
  selectAllConfirmButton: string; selectAllConfirmCancel: string;
  savingDraft: string; filtering: string;
};

function isFocusedRow(factory: CriteriaFactory, field?: string | null, value?: string | null): boolean {
  if (field == null || value == null) return false;
  const record: Record<string, unknown> = factory;
  const cell = record[field];
  return typeof cell === "string" && cell.toLowerCase() === value.toLowerCase();
}

const PAGE_SIZE = 25;
const DRAFT_PERSISTENCE_EXECUTABLE = false;

function emptyReasonFor(criteriaApplied: boolean, inScope: number): TableEmptyReason {
  if (!criteriaApplied) return "noCriteria";
  return inScope === 0 ? "noMatch" : "noFilterMatch";
}

export default function BulkTargetingForm({
  factories, strings, criteriaApplied, focusedField, focusedValue, locale, criteriaTree,
}: {
  factories: readonly CriteriaFactory[];
  strings: BulkFormStrings;
  criteriaApplied: boolean;
  focusedField?: string | null;
  focusedValue?: string | null;
  locale: Locale;
  criteriaTree: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [droppedCount, setDroppedCount] = useState(0);
  const [confirmingSelectAll, setConfirmingSelectAll] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftReference, setDraftReference] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const availableIds = useMemo(() => new Set(factories.map(factory => factory.id)), [factories]);

  useEffect(() => {
    const restored = readStoredSelection(availableIds);
    if (restored.kept.size === 0 && restored.dropped === 0) return;
    setSelected(restored.kept);
    setDroppedCount(restored.dropped);
  }, [availableIds]);

  useEffect(() => { writeStoredSelection(selected); }, [selected]);

  const settledQuery = useDeferredValue(query);
  const isFiltering = settledQuery !== query;
  const matched = useMemo(() => matchesQuery(factories, settledQuery), [factories, settledQuery]);
  const pageCount = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageRows = matched.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);
  const selectedFactories = factories.filter(factory => selected.has(factory.id));

  const addAll = (rows: readonly CriteriaFactory[]) => setSelected(current => {
    const next = new Set(current);
    for (const factory of rows) if (!hasActiveVisit(factory)) next.add(factory.id);
    return next;
  });
  const toggle = (id: string, checked: boolean) => setSelected(current => {
    const next = new Set(current);
    if (checked) next.add(id); else next.delete(id);
    return next;
  });
  const clearSelection = () => setSelected(new Set());
  const confirmSelectAll = () => {
    addAll(matched);
    setConfirmingSelectAll(false);
    setConfirmInput("");
  };

  const persistDraft = async (): Promise<string | null> => {
    setSaving(true);
    setSaveFailed(false);
    try {
      const result = await saveBulkDraft({ planId: draftId ?? undefined, criteriaTree, selection: [...selected] });
      if (result.error || !result.planId) { setSaveFailed(true); return null; }
      setDraftId(result.planId);
      setDraftReference(result.planReference ?? null);
      return result.planId;
    } catch {
      setSaveFailed(true);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleReview = async () => {
    if (!DRAFT_PERSISTENCE_EXECUTABLE) { router.push("/planning/bulk/review"); return; }
    const planId = await persistDraft();
    if (planId !== null) router.push(`/planning/bulk/review?plan=${planId}`);
  };

  const provenanceOf = (factory: CriteriaFactory) => factory.source_synced_at === null
    ? strings.provNoSync
    : strings.provSynced.replace("{d}", formatDate(factory.source_synced_at, locale));

  return (
    <Stack gap="default">
      {droppedCount > 0 && (
        <PlanningNotice tone="warning" label={strings.invalidTitle}>
          {strings.invalidBody.replace("{n}", String(droppedCount))}
          <span className={styles.noticeActions}>
            <Button variant="secondary" onClick={() => setDroppedCount(0)}>{strings.invalidKeep}</Button>
            <Button variant="tertiary" onClick={() => { clearSelection(); setDroppedCount(0); }}>{strings.invalidClear}</Button>
          </span>
        </PlanningNotice>
      )}

      <Toolbar
        label={strings.filterLabel}
        trailing={
          <>
            <Button variant="secondary" onClick={() => addAll(pageRows)}>{strings.selectVisible}</Button>
            <Button variant="secondary" onClick={() => setConfirmingSelectAll(true)}>{strings.selectAllResults}</Button>
            <span className={styles.filterStatus} role="status" aria-live="polite">
              {isFiltering
                ? strings.filtering
                : <CountBadge value={matched.length} label={strings.resultsCount.replace("{n}", String(matched.length))} />}
            </span>
          </>
        }
      >
        <div className={styles.filter}>
          <Field label={strings.filterLabel} htmlFor="bulk-filter">
            <TextInput
              id="bulk-filter"
              type="search"
              value={query}
              placeholder={strings.filterPlaceholder}
              onChange={value => { setQuery(value); setPage(0); }}
            />
          </Field>
        </div>
      </Toolbar>

      {confirmingSelectAll && (
        <PlanningNotice tone="warning" label={strings.selectAllConfirmTitle}>
          {strings.selectAllConfirmBody.replaceAll("{n}", String(matched.length))}
          <span className={styles.noticeActions}>
            <Field label={strings.selectAllConfirmInputLabel} htmlFor="bulk-select-all-confirm">
              <TextInput id="bulk-select-all-confirm" value={confirmInput} inputMode="numeric" onChange={setConfirmInput} />
            </Field>
            <Button
              variant="primary"
              disabled={confirmInput.trim() !== String(matched.length)}
              onClick={confirmSelectAll}
            >
              {strings.selectAllConfirmButton.replace("{n}", String(matched.length))}
            </Button>
            <Button variant="tertiary" onClick={() => { setConfirmingSelectAll(false); setConfirmInput(""); }}>
              {strings.selectAllConfirmCancel}
            </Button>
          </span>
        </PlanningNotice>
      )}

      <BulkEvidenceTable
        busy={isFiltering}
        emptyReason={emptyReasonFor(criteriaApplied, factories.length)}
        rows={pageRows}
        strings={strings}
        isSelected={factory => selected.has(factory.id)}
        isDuplicate={hasActiveVisit}
        isFocused={factory => isFocusedRow(factory, focusedField, focusedValue)}
        provenanceOf={provenanceOf}
        onToggle={toggle}
      />

      <BulkResultsPager
        page={currentPage}
        pageCount={pageCount}
        pageSize={PAGE_SIZE}
        total={matched.length}
        strings={strings}
        onPageChange={setPage}
      />

      <BulkCampaignSummary
        selectedCount={selectedFactories.length}
        byBand={countSelectionBy(selectedFactories, "risk_band")}
        byRegion={countSelectionBy(selectedFactories, "region")}
        strings={strings}
      />

      <BulkSelectionBar
        selectedCount={selected.size}
        draftReference={draftReference}
        draftPersistable={DRAFT_PERSISTENCE_EXECUTABLE}
        saveFailed={saveFailed}
        saving={saving}
        strings={strings}
        onClear={clearSelection}
        onSaveDraft={() => { void persistDraft(); }}
        onReview={() => { void handleReview(); }}
      />
    </Stack>
  );
}
