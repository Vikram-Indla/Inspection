"use client";
// CD-025 / SCR-WEB-150 / P03 — Plan Review & Publish workspace.
//
// Route-neutral staged review, mounted on the governed /planning/bulk/review
// route. The targeting screen (CD-024) hands off a client-held selection via
// sessionStorage; nothing is persisted until publish. The body is blocker-first:
//   context → readiness → targets → assignment evidence → consequence ledger →
//   corrections → publish action  (identical DOM/reading order desktop↔narrow).
//
// The one signature pattern is the Publish Consequence Ledger: four groups
// (created / referenced / recorded-or-queued / will-not-happen) bound to the
// current retained scope, recalculated live. validateBulkPlan is a server-side
// PREVIEW; publish_bulk_plan (migration 20260714091727) re-runs every guard in
// one transaction and is the authority. No optimistic "Published" is ever shown;
// a rolled-back publish is never presented as success (P03 all-or-nothing).
import { useActionState, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  publishBulkPlan, loadBulkSelection, validateBulkPlan, saveBulkDraft,
  type BulkResult, type ReviewData, type ValidateResult, type Blocker, type BlockerKind,
  type OverlapEvidence, type SourceState, type BulkDraft, type EligibilityReason, type LookupOption,
} from "../actions";
import EvidenceLedger, { type LedgerFocus, type EvidenceLedgerStrings } from "./EvidenceLedger";
import DiscardDraftButton from "../../DiscardDraftButton";
import { IconLock } from "@/app/icons";

const SEL_KEY = "cd021-bulk-selection";

export type ReviewStrings = {
  // phases
  loading: string; loadingNote: string; stagedBanner: string; stagedSub: string;
  unavailable: string; emptyTitle: string; emptyBody: string; backToTargeting: string;
  scopeTitle: string; scopeBody: string; scopeReduced: string;
  // context
  method: string; freshnessPrefix: string; selected: string; retained: string; visits: string;
  assignments: string; manual: string; auto: string; packageLabel: string; visitType: string;
  /** M7 — zero-many packages: preparation hint, ledger zero-state and count. */
  packageHint: string; packageNone: string; packageCount: string;
  /** M7 — lookups-driven config: priority field + honest bulk-unavailable tag. */
  priorityLabel: string; priorityNone: string; notBulkYet: string;
  /** M7 — publish-time dropped-rows ledger (accepted-subset commit). */
  droppedH: string; droppedD: string;
  typePeriodic: string; mode: string; physical: string; window: string; scope: string;
  // config
  configTitle: string; windowStart: string; windowEnd: string; notes: string; notesPlaceholder: string;
  // readiness
  readiness: string; blockedTag: string; readyTag: string; blockersN: string; clearAll: string;
  // targets table
  targetsH: string; selectedLabel: string; retainedLabel: string;
  colFactory: string; colCity: string; colRisk: string; colVisit: string; colAssign: string;
  riskHigh: string; riskMedium: string; riskLow: string;
  autoLabel: string; autoNote: string; excludedLozenge: string; chooseInspector: string;
  assignH: string; manualNamed: string; autoChosen: string; manualEvidenceNote: string; splitLine: string;
  // ledger
  ledgerH: string; ledgerLead: string;
  gCreate: string; gRef: string; gRecord: string; gNot: string;
  cPlan: string; cPlanD: string; cVisits: string; cVisitsD: string; cAssign: string; cAssignD: string;
  rType: string; rTypeD: string; rWin: string; rWinD: string; rMethod: string; rMethodD: string;
  recAudit: string; recAuditD: string; recNotif: string; recNotifD: string;
  notStart: string; notStartD: string; notDeliver: string; notDeliverD: string;
  notDrop: string; notDropD: string; notPartial: string; notPartialD: string; notFinal: string;
  // corrections / action
  correctH: string; backConfig: string; backConfigD: string; willRecheck: string;
  disabledPrefix: string; allClear: string; removeExcluded: string;
  publishReady: string; publishBlocked: string; publishing: string; checking: string;
  fix: string; change: string; review: string; remove: string; skipToPublish: string;
  // publishing / result
  publishingTitle: string; publishingBody: string; publishingSub: string;
  failTitle: string; failBody: string; failSub: string; tryAgain: string;
  successTitle: string; successBody: string; successSub: string;
  sPlan: string; sVisits: string; sAssign: string; sNotif: string;
  goVisits: string; openPlan: string;
  // M6 — eligibility partition + acknowledgement + persisted drafts
  eligH: string; eligTotal: string; eligEligible: string; eligIneligible: string;
  eligToCreate: string; eligMissingLoc: string; eligConflicts: string; eligManualOverride: string;
  reasonDup: string; reasonScope: string; reasonLocation: string; reasonInspector: string;
  ackRequired: string; ackLabel: string;
  saveDraft: string; savingDraft: string; draftSaved: string; draftSaveFailed: string;
  draftBanner: string; draftUnavailable: string; discardDraft: string;
  // CD-024 — Assignment Evidence Ledger + per-row evidence cells
  evTitle: string; evLead: string; evReview: string;
  ecInPool: string; ecOverlaps: string; ecSkills: string; ecAuto: string;
  ecBlockedN: string; ecFail: string; ecSetWindow: string;
  ev: EvidenceLedgerStrings;
  // blocker copy (kind → title/detail); {targets} / {n} interpolated
  bl: Record<BlockerKind, { title: string; detail: string }>;
};

type Phase = "loading" | "unavailable" | "scope" | "empty" | "review" | "publishing" | "success" | "failure";

const RISK_TONE: Record<string, string> = { high: "sq-lozenge--critical", medium: "sq-lozenge--warning", low: "sq-lozenge--success" };
// per-kind presentation + which correction the Fix control performs
const BLK_META: Record<BlockerKind, { cls: string; glyph: string; fix: "remove" | "focusRow" | "focusWindow" | "review" | "none" }> = {
  duplicate:     { cls: "critical",    glyph: "▣", fix: "remove" },
  overlap:       { cls: "critical",    glyph: "◆", fix: "focusRow" },
  coverage:      { cls: "warning",     glyph: "▲", fix: "focusWindow" },
  capacity:      { cls: "critical",    glyph: "▲", fix: "focusWindow" },
  nopackage:     { cls: "warning",     glyph: "⟳", fix: "none" },
  packageInvalid:{ cls: "critical",    glyph: "⟳", fix: "review" },
  nopool:        { cls: "critical",    glyph: "●", fix: "none" },
  configMissing: { cls: "warning",     glyph: "▲", fix: "focusWindow" },
  windowImplausible: { cls: "critical", glyph: "▲", fix: "focusWindow" },
  srcFactory:    { cls: "unavailable", glyph: "▣", fix: "review" },
  srcPackage:    { cls: "unavailable", glyph: "⟳", fix: "review" },
  srcInspector:  { cls: "unavailable", glyph: "●", fix: "review" },
  srcDuplicate:  { cls: "unavailable", glyph: "◆", fix: "review" },
};

export default function ReviewClient({ strings: s, initialDraft, draftUnavailable, locale }: {
  strings: ReviewStrings;
  initialDraft?: BulkDraft | null;
  draftUnavailable?: boolean;
  locale: "en" | "ar";
}) {
  // PLN-S08/PLN-S11 — the corrected compiler keeps draft persistence and
  // publish blocked until frozen-target durable receipts are effective.
  const transitionsExecutable = false;
  const [state, formAction, pending] = useActionState<BulkResult, FormData>(publishBulkPlan, {});
  const [data, setData] = useState<ReviewData | null>(null);
  const [allIds, setAllIds] = useState<string[]>([]);
  const [removedDups, setRemovedDups] = useState(false);
  const [picks, setPicks] = useState<Record<string, string>>({});
  // M7 — zero-or-more packages; empty = preparation chooses later (warning).
  const [pkgIds, setPkgIds] = useState<string[]>([]);
  const [windowStart, setWindowStart] = useState("");
  const [windowEnd, setWindowEnd] = useState("");
  const [notes, setNotes] = useState("");
  // M7 — governed priority ("" = unset) and the lookup-label picker.
  const [priority, setPriority] = useState("");
  const lk = useCallback((o: LookupOption) => (locale === "ar" ? (o.label_ar ?? o.label_en) : o.label_en), [locale]);
  const [val, setVal] = useState<ValidateResult | null>(null);
  const [freshness, setFreshness] = useState("");
  // M6 — persisted-draft working state: the acknowledgement choice and the
  // draft identity (so repeat saves upsert the same visit_plans row).
  const [acknowledged, setAcknowledged] = useState(false);
  const [draftMeta, setDraftMeta] = useState<{ planId: string; planReference: string; version: number } | null>(
    initialDraft ? { planId: initialDraft.planId, planReference: initialDraft.planReference, version: initialDraft.version } : null
  );
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSaveError, setDraftSaveError] = useState(false);
  const [draftSavedMsg, setDraftSavedMsg] = useState<string | null>(null);
  const [, startValidate] = useTransition();
  const validateSeq = useRef(0); // guards against stale preview responses resolving out of order
  // CD-024 — selection-time overlap evidence + focused candidate for the ledger
  const [evidence, setEvidence] = useState<{ overlaps: OverlapEvidence[]; overlapSource: SourceState } | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const evSeq = useRef(0);
  const windowRef = useRef<HTMLInputElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const failHeadingRef = useRef<HTMLHeadingElement>(null);
  const readinessHeadingRef = useRef<HTMLHeadingElement>(null);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  // CD-025 S10 — polite announcement + focus target for the scope-reduction (12→10)
  // correction, whose Fix control unmounts on click (WIRING leg 2/4).
  const [announce, setAnnounce] = useState("");

  // ---- load the staged working set ----
  // M6 — a persisted draft (?plan=<id>, loaded server-side) is authoritative:
  // selection, inspector picks, package, window, notes and the acknowledgement
  // all hydrate from it. The browser-held sessionStorage selection remains the
  // fallback path when no draft is referenced (legacy targeting hand-off).
  useEffect(() => {
    setFreshness(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    if (initialDraft) {
      const ids = initialDraft.selection;
      setAllIds(ids);
      setPicks(initialDraft.config.picks);
      if (initialDraft.config.package_version_ids.length) setPkgIds(initialDraft.config.package_version_ids);
      setWindowStart(initialDraft.config.window_start);
      setWindowEnd(initialDraft.config.window_end);
      setNotes(initialDraft.config.notes);
      setPriority(initialDraft.config.priority);
      setAcknowledged(initialDraft.acknowledged);
      if (ids.length) loadBulkSelection(ids).then(setData).catch(() => setData({ factories: [], packages: [], inspectors: [], unavailable: true }));
      else setData({ factories: [], packages: [], inspectors: [] });
      return;
    }
    let stored: string[] = [];
    try { stored = JSON.parse(sessionStorage.getItem(SEL_KEY) ?? "[]"); } catch { stored = []; }
    const clean = Array.isArray(stored) ? stored.map(String) : [];
    setAllIds(clean);
    if (clean.length) loadBulkSelection(clean).then(setData).catch(() => setData({ factories: [], packages: [], inspectors: [], unavailable: true }));
    else setData({ factories: [], packages: [], inspectors: [] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Default to the first available published/locked package — ONCE. A draft
  // resume or an explicit deselect-all is a deliberate zero-package choice
  // (M7: preparation chooses later) and must never be overridden.
  const pkgTouched = useRef(!!initialDraft);
  useEffect(() => {
    if (!pkgTouched.current && data?.packages.length && pkgIds.length === 0) {
      setPkgIds([data.packages[0].id]);
      pkgTouched.current = true;
    }
  }, [data, pkgIds, initialDraft]);

  const dupIds = useMemo(() => new Set((data?.factories ?? []).filter(f => f.dup).map(f => f.id)), [data]);
  const nonDupIds = useMemo(() => allIds.filter(id => !dupIds.has(id)), [allIds, dupIds]);
  const workingIds = removedDups ? nonDupIds : allIds;

  // ---- live readiness preview (debounced); publish re-checks authoritatively ----
  useEffect(() => {
    if (!data || data.unavailable || allIds.length === 0) return;
    const handle = setTimeout(() => {
      const seq = ++validateSeq.current;
      startValidate(() => {
        validateBulkPlan({
          ids: workingIds, package_version_ids: pkgIds,
          window_start: windowStart, window_end: windowEnd,
          visit_type: "periodic", picks,
        })
          .then(r => { if (seq === validateSeq.current) setVal(r); })   // ignore stale out-of-order responses
          .catch(() => { if (seq === validateSeq.current) setVal(null); });
      });
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, workingIds.join(","), pkgIds.join(","), windowStart, windowEnd, JSON.stringify(picks)]);

  // ---- CD-024 selection-time overlap evidence (loadBulkSelection with window) ----
  // Feeds the per-row evidence cells and the Assignment Evidence Ledger from the
  // SAME overlap query publish uses. Requires a valid window; without one, overlap
  // is honestly "not evaluated" rather than silently "no conflict".
  useEffect(() => {
    const startMs = Date.parse(windowStart);
    const endMs = Date.parse(windowEnd);
    const windowOk = !!windowStart && !!windowEnd && Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs;
    if (!data || data.unavailable || !windowOk || workingIds.length === 0) { setEvidence(null); return; }
    const handle = setTimeout(() => {
      const seq = ++evSeq.current;
      loadBulkSelection(workingIds, { start: windowStart, end: windowEnd })
        .then(d => { if (seq === evSeq.current) setEvidence({ overlaps: d.overlaps ?? [], overlapSource: d.sources?.overlap ?? "not-evaluated" }); })
        .catch(() => { if (seq === evSeq.current) setEvidence(null); });
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, workingIds.join(","), windowStart, windowEnd]);

  const removeExcluded = useCallback(() => {
    const removed = dupIds.size;
    setRemovedDups(true);
    setPicks(p => { const next = { ...p }; for (const id of dupIds) delete next[id]; return next; });
    // S10 — announce the named removal and new retained count politely; the Fix
    // button that triggered this is about to unmount, so focus moves in the effect.
    setAnnounce(s.scopeReduced.replace("{removed}", String(removed)).replace("{retained}", String(nonDupIds.length)));
  }, [dupIds, nonDupIds.length, s.scopeReduced]);

  // Restore focus after the scope-reduction Fix control unmounts: land on the
  // readiness heading so the (now recomputed) state is where focus resumes.
  useEffect(() => { if (removedDups) readinessHeadingRef.current?.focus(); }, [removedDups]);

  const focusWindow = useCallback(() => windowRef.current?.focus(), []);
  const focusRow = useCallback((code?: string) => {
    // move focus to the first overlapping/manual row's inspector control
    const entry = Object.entries(rowRefs.current).find(([, el]) => el?.dataset.code && code?.includes(el.dataset.code));
    const target = entry?.[1] ?? Object.values(rowRefs.current).find(Boolean);
    target?.querySelector<HTMLSelectElement>("select")?.focus();
  }, []);

  const interp = (tpl: string, map: Record<string, string | number>) =>
    tpl.replace(/\{(\w+)\}/g, (_, k) => String(map[k] ?? ""));

  const reasonText = (r: EligibilityReason): string =>
    r === "duplicate_active_visit" ? s.reasonDup
      : r === "out_of_scope" ? s.reasonScope
        : r === "missing_location" ? s.reasonLocation
          : s.reasonInspector;

  // ---- phase resolution ----
  const phase: Phase =
    data === null ? "loading"
    : data.unavailable ? "unavailable"
    : (data.missingFactoryIds?.length ?? 0) > 0 ? "scope"
    : (allIds.length === 0 || data.factories.length === 0) ? "empty"
    : pending ? "publishing"
    : state.ok ? "success"
    : state.error ? "failure"
    : "review";

  useEffect(() => { if (phase === "success") successHeadingRef.current?.focus(); }, [phase]);
  useEffect(() => { if (phase === "failure") failHeadingRef.current?.focus(); }, [phase]);

  if (phase === "loading") {
    return (
      <div className="panel sq-panel cd-panelpad" id="cd-main">
        <div className="sq-banner sq-banner--immutable">
          <div><strong>{s.stagedBanner}</strong><div className="t-caption">{s.stagedSub}</div></div>
        </div>
        <div className="stack">{[0, 1, 2, 3].map(i => <div key={i} className="sq-skeleton" />)}</div>
        <p className="t-caption" role="status">{s.loadingNote}</p>
      </div>
    );
  }
  if (phase === "unavailable") {
    return <div className="sq-banner sq-banner--critical" role="alert" id="cd-main">{s.unavailable}</div>;
  }
  if (phase === "scope") {
    const missing = data?.missingFactoryIds?.length ?? 0;
    return (
      <div className="panel cd-panelpad" id="cd-main">
        <div className="sq-state">
          <span className="sq-state__glyph" aria-hidden="true">◌</span>
          <h3>{s.scopeTitle}</h3>
          <p className="t-caption">{s.scopeBody.replace("{n}", String(missing))}</p>
          <a className="sq-btn sq-btn--prominent" href="/planning/bulk">{s.backToTargeting}</a>
        </div>
      </div>
    );
  }
  if (phase === "empty") {
    return (
      <div className="panel cd-panelpad" id="cd-main">
        {draftUnavailable && (
          <div className="sq-banner sq-banner--warning" role="alert">
            {s.draftUnavailable}
          </div>
        )}
        <h3>{s.emptyTitle}</h3>
        <p className="t-caption">{s.emptyBody}</p>
        <a className="sq-btn sq-btn--prominent" href="/planning/bulk">{s.backToTargeting}</a>
      </div>
    );
  }
  if (phase === "publishing") {
    return (
      <section className="panel sq-panel cd-panelpad cd-result" id="cd-main">
        <div className="cd-result__row">
          <div className="cd-result__icon lock" aria-hidden="true"><IconLock size={24} /></div>
          <div className="cd-stack">
            <h3>{s.publishingTitle}</h3>
            <p role="status">{s.publishingBody}</p>
            <p className="t-caption">{s.publishingSub}</p>
            <div className="sq-skeleton" />
          </div>
        </div>
      </section>
    );
  }
  if (phase === "failure") {
    return (
      <section className="panel sq-panel cd-panelpad cd-result" id="cd-main">
        <div className="cd-result__row">
          <div className="cd-result__icon fail" aria-hidden="true">✕</div>
          <div className="cd-stack">
            <h3 tabIndex={-1} ref={failHeadingRef} role="alert">{s.failTitle}</h3>
            <p>{state.error}</p>
            <p className="t-caption">{s.failSub}</p>
          </div>
        </div>
        <div className="row">
          <form action={formAction}>{hiddenPublishFields(workingIds, pkgIds, windowStart, windowEnd, notes, picks, priority)}
            <button className="sq-btn sq-btn--prominent">{s.tryAgain}</button></form>
          <a className="sq-btn sq-btn--secondary" href="/planning/bulk">{s.backConfig}</a>
        </div>
      </section>
    );
  }
  if (phase === "success") {
    // M7 — the published count is the committed eligible subset from the
    // authoritative result; the preview ledger is only the fallback.
    const created = state.created ?? val?.ledger?.toCreate ?? val?.retained ?? 0;
    const cells: [string, string][] = [[s.sPlan, "1"], [s.sVisits, String(created)], [s.sAssign, String(created)], [s.sNotif, String(created)]];
    return (
      <section className="panel sq-panel cd-panelpad cd-result" id="cd-main">
        <div className="cd-result__row">
          <div className="cd-result__icon ok" aria-hidden="true">✓</div>
          <div className="cd-stack">
            <h3 tabIndex={-1} ref={successHeadingRef} role="status">{s.successTitle}</h3>
            <p>{s.successBody}</p>
            <div className="cd-resultgrid">
              {cells.map(([k, v]) => (
                <div key={k} className="panel cd-panelpad">
                  <div className="sq-overline">{k}</div><div className="cd-count">{v}</div>
                </div>
              ))}
            </div>
            {/* M7 — accepted-subset honesty: rows dropped at the authoritative
                publish-time re-check are NAMED, never silently absent. */}
            {(state.dropped?.length ?? 0) > 0 && (
              <div className="sq-banner sq-banner--warning" role="status">
                <strong>{interp(s.droppedH, { n: state.dropped!.length })}</strong>
                <p className="t-caption">{s.droppedD}</p>
                <ul>
                  {state.dropped!.map(d => (
                    <li key={d.id}><bdi>{d.name}</bdi> — {d.reasons.map(reasonText).join(" · ")}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="t-caption">{s.successSub}</p>
          </div>
        </div>
        <div className="row">
          <a className="sq-btn sq-btn--prominent" href="/visits">{s.goVisits}</a>
          {/* optional read-only plan link — only when the publisher returned a plan ID */}
          {state.planId && <a className="sq-btn sq-btn--secondary" href={`/planning/plans/${state.planId}`}>{s.openPlan}</a>}
        </div>
      </section>
    );
  }

  // ---------------- review phase ----------------
  const v = val;
  const validating = v === null;            // preview not yet resolved — never show a false "ready"
  const blockers = v?.blockers ?? [];
  const retained = v?.retained ?? nonDupIds.length;
  const manual = v?.manual ?? 0;
  const auto = v?.auto ?? Math.max(0, retained - manual);
  const reasonId = "cd-disabled-reason";

  // ---- M6 eligibility partition + acknowledgement ----
  // Every selected row is classified server-side (validateBulkPlan rows). Rows
  // with no blocker-bound ineligibility (e.g. missing official location) still
  // require the explicit acknowledgement before publish; when acknowledged the
  // publish submits ONLY the eligible subset, with ineligible rows named.
  const eligById = new Map((v?.rows ?? []).map(r => [r.id, r]));
  const eligibleIds = workingIds.filter(id => eligById.get(id)?.eligible === true);
  const ineligibleIds = workingIds.filter(id => eligById.has(id) && !eligById.get(id)!.eligible);
  const needsAck = !validating && ineligibleIds.length > 0;
  // Row-bound blockers (duplicate / overlap) name exactly the rows the
  // partition excludes; every other blocker kind always blocks publishing.
  const hardBlockers = blockers.filter(b => b.kind !== "duplicate" && b.kind !== "overlap");
  const baseReady = !!v?.committable && !needsAck;
  const ackReady = needsAck && acknowledged && eligibleIds.length > 0 && hardBlockers.length === 0;
  const committable = (baseReady || ackReady) && !pending;
  const publishIds = baseReady ? workingIds : eligibleIds;

  // M6 — persist the current working state as a bulk draft (upserts the same
  // visit_plans row when this session resumed from or already saved a draft).
  const onSaveDraft = async () => {
    setSavingDraft(true); setDraftSaveError(false); setDraftSavedMsg(null);
    try {
      const res = await saveBulkDraft({
        planId: draftMeta?.planId,
        criteriaTree: initialDraft?.criteriaTree ?? undefined,
        selection: workingIds,
        config: { picks, package_version_ids: pkgIds, window_start: windowStart, window_end: windowEnd, notes, priority },
        validation: v ?? undefined,
        acknowledged,
      });
      if (res.error || !res.planId) { setDraftSaveError(true); return; }
      setDraftMeta({ planId: res.planId, planReference: res.planReference ?? "", version: res.version ?? 0 });
      setDraftSavedMsg(interp(s.draftSaved, { ref: res.planReference ?? "", n: res.version ?? 0 }));
    } catch {
      setDraftSaveError(true);
    } finally {
      setSavingDraft(false);
    }
  };

  // ---- CD-024 evidence derivations ----
  const windowSet = !!windowStart && !!windowEnd && Number.isFinite(Date.parse(windowStart)) && Number.isFinite(Date.parse(windowEnd)) && Date.parse(windowEnd) > Date.parse(windowStart);
  const packagePublished = pkgIds.length > 0 && pkgIds.every(id => (data?.packages ?? []).some(p => p.id === id));
  const overlapSource: SourceState = evidence?.overlapSource ?? "not-evaluated";
  const fmtWin = (iso: string) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? iso : d.toLocaleString([], { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }); };
  const overlapFor = (inspectorId: string) => (evidence?.overlaps ?? []).find(o => o.inspector_id === inspectorId);

  // Focus derivation for the ledger — reflects the row currently focused in the
  // candidate table (focusin) or opened via "Review evidence".
  const focusedFactory = focusedId ? (data?.factories ?? []).find(f => f.id === focusedId) ?? null : null;
  const ledgerFocus: LedgerFocus | null = (() => {
    if (!focusedFactory) return null;
    const excluded = dupIds.has(focusedFactory.id);
    const pick = picks[focusedFactory.id] ?? "";
    const mode: LedgerFocus["mode"] = excluded ? "excluded" : pick ? "manual" : "auto";
    const ov = pick ? overlapFor(pick) : undefined;
    return {
      factoryName: focusedFactory.name,
      factoryCode: focusedFactory.factory_code,
      mode,
      inspectorName: pick ? (data?.inspectors ?? []).find(i => i.user_id === pick)?.full_name : undefined,
      inPool: pick ? (data?.inspectors ?? []).some(i => i.user_id === pick) : undefined,
      packagePublished,
      windowSet,
      overlapEvaluated: overlapSource === "ok" && windowSet,
      overlapFailed: overlapSource === "failed",
      overlapCount: ov?.count ?? 0,
      overlapSamples: (ov?.samples ?? []).map(sm => ({ label: sm.visit_id.slice(0, 8), window: `${fmtWin(sm.window_start)}→${fmtWin(sm.window_end)}` })),
    };
  })();

  // Per-row evidence cell (glyph + text; never colour alone).
  const rowEvidence = (fid: string) => {
    const pick = picks[fid] ?? "";
    if (!pick) return <span className="t-caption">◐ {s.ecAuto}</span>;
    const inPool = (data?.inspectors ?? []).some(i => i.user_id === pick);
    if (!inPool) return <span className="t-caption cd-disabledreason">✕ {s.ev.bNotPool}</span>;
    if (overlapSource === "failed") return <span className="t-caption cd-disabledreason">✕ {s.ecFail}</span>;
    if (!windowSet || overlapSource === "not-evaluated") return <span className="t-caption">○ {s.ecSetWindow}</span>;
    const ov = overlapFor(pick);
    if (ov && ov.count > 0) {
      const sm = ov.samples[0];
      return <span className="t-caption cd-disabledreason">✕ {interp(s.ecBlockedN, { n: ov.count })}{sm ? <> · <bdi>{sm.visit_id.slice(0, 8)}</bdi> {fmtWin(sm.window_start)}→{fmtWin(sm.window_end)}</> : null}</span>;
    }
    return <span className="t-caption">✓ {s.ecInPool} · ✓ {interp(s.ecOverlaps, { n: 0 })} · {s.ecSkills}</span>;
  };

  const blockerCopy = (b: Blocker) => {
    const c = s.bl[b.kind];
    const targets = (b.targets ?? []).join(" · ");
    const n = b.targets?.[0] ?? "";
    return { title: interp(c.title, { targets, n }), detail: interp(c.detail, { targets, n }) };
  };
  const runFix = (b: Blocker) => {
    const meta = BLK_META[b.kind];
    if (meta.fix === "remove") removeExcluded();
    else if (meta.fix === "focusWindow") focusWindow();
    else if (meta.fix === "focusRow") focusRow((b.targets ?? [])[0]);
  };
  const fixLabel = (b: Blocker) => {
    const meta = BLK_META[b.kind];
    return meta.fix === "remove" ? s.removeExcluded : meta.fix === "review" ? s.review : meta.fix === "focusWindow" ? s.change : s.fix;
  };

  const mark = (kind: "ok" | "blocked" | "wont" | "pending") => (
    <span className={`cd-lrow__mark ${kind}`} aria-hidden="true">{kind === "ok" ? "✓" : kind === "blocked" ? "✕" : kind === "wont" ? "—" : "○"}</span>
  );
  const createMark: "ok" | "pending" = committable ? "ok" : "pending";

  return (
    <div className="stack" id="cd-main">
      <a href="#cd-publish" className="sq-link cd-skip">{s.skipToPublish}</a>
      {/* S10 — polite scope-reduction announcement (visually hidden, does not shift layout) */}
      <p className="sq-sr-only" role="status" aria-live="polite">{announce}</p>

      {/* ---- context card ---- */}
      <section className="panel sq-panel">
        <div className="cd-methodline cd-panelpad">
          <span className="sq-lozenge sq-lozenge--plan">{s.method}</span>
          {freshness && <span className="sq-freshness">{s.freshnessPrefix} {freshness}</span>}
        </div>
        <p className="t-caption cd-panelpad">{s.stagedBanner}</p>
        {/* M6 — resumed-draft provenance / failed-draft honesty */}
        {initialDraft && (
          <p className="t-caption cd-panelpad" role="status">
            <span className="sq-lozenge sq-lozenge--info">{interp(s.draftBanner, { ref: initialDraft.planReference })}</span>
            {/* M8 / PLN-CON-018 — discard the resumed draft (never-published);
                distinct from cancelling a published visit. */}
            {" "}
            <DiscardDraftButton planId={initialDraft.planId} expectedVersion={initialDraft.version} label={s.discardDraft}
              discardAria={`${s.discardDraft} — ${initialDraft.planReference}`} />
          </p>
        )}
        {draftUnavailable && (
          <div className="sq-banner sq-banner--warning" role="alert">
            {s.draftUnavailable}
          </div>
        )}
        <dl className="cd-context cd-ctx">
          <div><dt>{s.selected} / {s.retained}</dt><dd className="cd-count">{workingIds.length}{workingIds.length !== retained ? <> <small>→</small> {retained}</> : null}</dd></div>
          <div><dt>{s.visits}</dt><dd className="cd-count">{retained}</dd></div>
          <div><dt>{s.assignments}</dt><dd>{manual} {s.manual} · {auto} {s.auto}</dd></div>
          <div><dt>{s.visitType}</dt><dd>
            {/* M7 — options flow from planning_lookups; publish_bulk_plan still
                commits periodic-only, so other governed types are listed
                honestly as not-yet-available instead of failing at publish. */}
            <select className="select" aria-label={s.visitType} value="periodic" onChange={() => {}}>
              {(data!.lookups?.visitTypes?.length ? data!.lookups.visitTypes : [{ key: "periodic", label_en: s.typePeriodic, label_ar: null }]).map(o => (
                <option key={o.key} value={o.key} disabled={o.key !== "periodic"}>
                  {lk(o)}{o.key !== "periodic" ? ` — ${s.notBulkYet}` : ""}
                </option>
              ))}
            </select></dd></div>
          <div><dt>{s.mode}</dt><dd>
            <select className="select" aria-label={s.mode} value="physical" onChange={() => {}}>
              {(data!.lookups?.visitModes?.length ? data!.lookups.visitModes : [{ key: "physical", label_en: s.physical, label_ar: null }]).map(o => (
                <option key={o.key} value={o.key} disabled={o.key !== "physical"}>
                  {lk(o)}{o.key !== "physical" ? ` — ${s.notBulkYet}` : ""}
                </option>
              ))}
            </select></dd></div>
          <div><dt>{s.priorityLabel}</dt><dd>
            <select className="select" aria-label={s.priorityLabel} value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="">{s.priorityNone}</option>
              {(data!.lookups?.priorities ?? []).map(o => <option key={o.key} value={o.key}>{lk(o)}</option>)}
            </select></dd></div>
          <div><dt>{s.packageLabel}</dt><dd>
            <div className="stack" role="group" aria-label={s.packageLabel}>
              {data!.packages.map(p => (
                <label key={p.id} className="sq-choice">
                  <input type="checkbox" value={p.id} checked={pkgIds.includes(p.id)}
                    onChange={e => setPkgIds(ids => e.target.checked ? [...ids, p.id] : ids.filter(x => x !== p.id))} />
                  <span>{p.code} · {p.version_label}</span>
                </label>
              ))}
            </div>
            {pkgIds.length === 0 && (
              <p className="sq-banner sq-banner--info" role="status">{s.packageHint}</p>
            )}
          </dd></div>
          <div><dt>{s.window}</dt><dd className="row">
            <input ref={windowRef} className="input cd-mono" name="window_start" type="datetime-local" aria-label={s.windowStart} value={windowStart} onChange={e => setWindowStart(e.target.value)} />
            <span aria-hidden="true">→</span>
            <input className="input cd-mono" name="window_end" type="datetime-local" aria-label={s.windowEnd} value={windowEnd} onChange={e => setWindowEnd(e.target.value)} />
          </dd></div>
        </dl>
      </section>

      {/* ---- readiness rail (error summary) ---- */}
      <section className={`sq-surface sq-panel cd-panelpad cd-ready ${validating ? "" : blockers.length ? "is-blocked" : "is-clear"}`}
        role={blockers.length ? "alert" : "status"} aria-label={s.readiness}>
        <div className="cd-sectionhead"><h3 tabIndex={-1} ref={readinessHeadingRef}>{s.readiness}</h3></div>
        {validating ? (
          <p className="t-caption" role="status">{s.loadingNote}</p>
        ) : blockers.length ? (
          <>
            <div className="row">
              <span className="sq-lozenge sq-lozenge--critical">{s.blockedTag}</span>
              <strong>{interp(s.blockersN, { n: blockers.length })}</strong>
            </div>
            <ul className="cd-blockerlist">
              {blockers.map((b, i) => {
                const { title, detail } = blockerCopy(b);
                const meta = BLK_META[b.kind];
                return (
                  <li key={b.kind + i} className={`cd-blocker cd-blocker--${meta.cls}`}>
                    <span className="cd-blocker__glyph" aria-hidden="true">{meta.glyph}</span>
                    <div className="cd-blocker__body">
                      <span className="cd-blocker__title">{title}</span>
                      {detail && <div className="cd-blocker__detail">{detail}</div>}
                      {meta.fix !== "none" && (
                        <div className="cd-fix"><button type="button" className="sq-btn sq-btn--secondary" onClick={() => runFix(b)}>{fixLabel(b)}</button></div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <div className="row">
            <span className="sq-lozenge sq-lozenge--success">{s.readyTag}</span>
            <strong>{s.clearAll}</strong>
          </div>
        )}
        {/* M7 — non-blocking warnings (e.g. zero packages: preparation chooses
            later). Honest, visible, never gating publish. */}
        {!validating && (v?.warnings?.length ?? 0) > 0 && (
          <div className="sq-banner sq-banner--warning" role="status">
            {v!.warnings.map((w, i) => {
              const { title, detail } = blockerCopy(w);
              return <p key={w.kind + i}><strong>{title}</strong>{detail ? <> — {detail}</> : null}</p>;
            })}
          </div>
        )}
      </section>

      {/* ---- M6 eligibility partition (7 counts from the live preview) ---- */}
      <section className="panel sq-panel cd-panelpad" aria-label={s.eligH}>
        <div className="cd-sectionhead"><h3>{s.eligH}</h3></div>
        {validating || !v?.ledger ? (
          <p className="t-caption" role="status">{s.loadingNote}</p>
        ) : (
          <div className="sq-kpi-row">
            <div><span className="t-caption">{s.eligTotal}</span><div className="cd-count">{v.ledger.total}</div></div>
            <div><span className="t-caption">{s.eligEligible}</span><div className="cd-count sq-lozenge--success">{v.ledger.eligible}</div></div>
            <div><span className="t-caption">{s.eligIneligible}</span><div className="cd-count">{v.ledger.ineligible}</div></div>
            <div><span className="t-caption">{s.eligToCreate}</span><div className="cd-count">{v.ledger.toCreate}</div></div>
            <div><span className="t-caption">{s.eligMissingLoc}</span><div className="cd-count">{v.ledger.missingLocation}</div></div>
            <div><span className="t-caption">{s.eligConflicts}</span><div className="cd-count">{v.ledger.activeConflicts}</div></div>
            <div><span className="t-caption">{s.eligManualOverride}</span><div className="cd-count">{v.ledger.manualOverrideRequired}</div></div>
          </div>
        )}
      </section>

      {/* ---- targets & proposed visits ---- */}
      <section>
        <div className="cd-sectionhead">
          <h3>{s.targetsH}</h3>
          <span className="t-caption cd-mono">{workingIds.length} {s.selectedLabel} · {retained} {s.retainedLabel}</span>
        </div>
        <div className="sq-tablewrap"><table className="sq-table">
          <thead><tr>
            <th scope="col">{s.colFactory}</th><th scope="col">{s.colCity}</th>
            <th scope="col">{s.colRisk}</th><th scope="col">{s.colVisit}</th><th scope="col">{s.colAssign}</th>
          </tr></thead>
          <tbody>
            {data!.factories.filter(f => workingIds.includes(f.id) || dupIds.has(f.id)).map(f => {
              const excluded = dupIds.has(f.id);
              const removed = excluded && removedDups;
              if (removed) return null;
              const pick = picks[f.id] ?? "";
              return (
                <tr key={f.id} className={`cd-obj ${excluded ? "is-removed" : ""}`} data-code={f.factory_code}
                  ref={el => { rowRefs.current[f.id] = el; }} aria-selected={excluded ? true : undefined}
                  onFocus={() => setFocusedId(f.id)}>
                  <td><div className="cd-fname">{f.name}</div><div className="cd-fmeta cd-mono"><bdi>{f.factory_code}</bdi> · CR <bdi>{f.cr_number}</bdi></div>
                    {/* M6 — per-row ineligibility reasons from the partition */}
                    {(eligById.get(f.id)?.reasons.length ?? 0) > 0 && (
                      <div className="row">
                        {eligById.get(f.id)!.reasons.map(r => (
                          <span key={r} className="sq-lozenge sq-lozenge--warning">{reasonText(r)}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>{f.city ?? "—"}</td>
                  <td><span className={`sq-lozenge ${RISK_TONE[f.risk_band ?? ""] ?? ""}`}>{f.risk_band === "high" ? s.riskHigh : f.risk_band === "medium" ? s.riskMedium : f.risk_band === "low" ? s.riskLow : "—"}</span></td>
                  <td>{excluded ? <span className="t-caption">—</span> : <span className="sq-lozenge sq-lozenge--plan">{s.typePeriodic}</span>}</td>
                  <td>
                    {excluded ? (
                      <span className="sq-lozenge sq-lozenge--critical sq-lozenge--plan">{s.excludedLozenge}</span>
                    ) : (
                      <div className="cd-assignee">
                        <select className="select" name={`inspector_${f.id}`} value={pick} aria-label={s.chooseInspector}
                          onChange={e => setPicks(p => ({ ...p, [f.id]: e.target.value }))}>
                          <option value="">{s.autoLabel}</option>
                          {data!.inspectors.map(i => <option key={i.user_id} value={i.user_id}>{i.full_name}</option>)}
                        </select>
                        {rowEvidence(f.id)}
                        <button type="button" className="btn btn-ghost"
                          aria-controls="cd-evidence-ledger" onClick={() => setFocusedId(f.id)}>{s.evReview}</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </section>

      {/* ---- CD-024 assignment evidence ledger (signature pattern) ---- */}
      <section id="cd-evidence-ledger">
        <div className="cd-sectionhead"><h3>{s.evTitle}</h3></div>
        <p className="t-caption">{s.evLead}</p>
        <EvidenceLedger focus={ledgerFocus} strings={s.ev} />
      </section>

      {/* ---- assignment evidence ---- */}
      <section>
        <div className="cd-sectionhead"><h3>{s.assignH}</h3><span className="t-caption cd-mono">{interp(s.splitLine, { manual, auto })}</span></div>
        <div className="sq-grid-2">
          <div className="panel sq-panel cd-panelpad"><div className="sq-overline">{s.manualNamed}</div>
            <div className="cd-count">{manual}</div>
            <p className="t-caption">{s.manualEvidenceNote}</p></div>
          <div className="panel sq-panel cd-panelpad"><div className="sq-overline">{s.autoChosen}</div>
            <div className="cd-count">{auto}</div>
            <p className="t-caption">{s.autoNote}</p></div>
        </div>
      </section>

      {/* ---- publish consequence ledger (signature pattern) ---- */}
      <section>
        <div className="cd-sectionhead"><h3>{s.ledgerH}</h3></div>
        <p className="t-caption">{s.ledgerLead}</p>
        <div className="cd-ledger">
          <div className="cd-lgroup">
            <div className="cd-lgroup__head">1 · {s.gCreate}</div>
            <div className="cd-lrow">{mark(createMark)}<div className="cd-lrow__body"><div className="cd-lrow__v">{s.cPlan}</div><div className="cd-lrow__d">{s.cPlanD}</div></div></div>
            <div className="cd-lrow">{mark(committable ? "ok" : "pending")}<div className="cd-lrow__body"><div className="cd-lrow__v">{interp(s.cVisits, { n: retained })}</div><div className="cd-lrow__d">{s.cVisitsD}</div></div></div>
            <div className="cd-lrow">{mark(committable ? "ok" : "pending")}<div className="cd-lrow__body"><div className="cd-lrow__v">{interp(s.cAssign, { n: retained })}</div><div className="cd-lrow__d">{s.cAssignD}</div></div></div>
            {!committable && <div className="cd-notfinal">{s.notFinal}</div>}
          </div>
          <div className="cd-lgroup">
            <div className="cd-lgroup__head">2 · {s.gRef}</div>
            <div className="cd-lrow">{mark(pkgIds.length ? "ok" : "pending")}<div className="cd-lrow__body"><div className="cd-lrow__v">{pkgIds.length ? interp(s.packageCount, { n: pkgIds.length }) + " · " + pkgIds.map(id => data!.packages.find(p => p.id === id)?.code ?? id.slice(0, 8)).join(" · ") : s.packageNone}</div><div className="cd-lrow__d">{pkgIds.length ? s.rTypeD : s.packageHint}</div></div></div>
            <div className="cd-lrow">{mark("ok")}<div className="cd-lrow__body"><div className="cd-lrow__v">{s.rType}</div><div className="cd-lrow__d">{s.rTypeD}</div></div></div>
            <div className="cd-lrow">{mark(windowStart && windowEnd ? "ok" : "pending")}<div className="cd-lrow__body"><div className="cd-lrow__v">{s.rWin}</div><div className="cd-lrow__d">{s.rWinD}</div></div></div>
            <div className="cd-lrow">{mark("ok")}<div className="cd-lrow__body"><div className="cd-lrow__v">{interp(s.rMethod, { manual, auto })}</div><div className="cd-lrow__d">{s.rMethodD}</div></div></div>
          </div>
          <div className="cd-lgroup">
            <div className="cd-lgroup__head">3 · {s.gRecord}</div>
            <div className="cd-lrow">{mark(committable ? "ok" : "pending")}<div className="cd-lrow__body"><div className="cd-lrow__v">{s.recAudit}</div><div className="cd-lrow__d">{s.recAuditD}</div></div></div>
            <div className="cd-lrow">{mark(committable ? "ok" : "pending")}<div className="cd-lrow__body"><div className="cd-lrow__v">{interp(s.recNotif, { n: retained })}</div><div className="cd-lrow__d">{s.recNotifD}</div></div></div>
          </div>
          <div className="cd-lgroup cd-lgroup--not">
            <div className="cd-lgroup__head">4 · {s.gNot}</div>
            <div className="cd-lrow">{mark("wont")}<div className="cd-lrow__body"><div className="cd-lrow__v">{s.notStart}</div><div className="cd-lrow__d">{s.notStartD}</div></div></div>
            <div className="cd-lrow">{mark("wont")}<div className="cd-lrow__body"><div className="cd-lrow__v">{s.notDeliver}</div><div className="cd-lrow__d">{s.notDeliverD}</div></div></div>
            <div className="cd-lrow">{mark("wont")}<div className="cd-lrow__body"><div className="cd-lrow__v">{s.notDrop}</div><div className="cd-lrow__d">{s.notDropD}</div></div></div>
            <div className="cd-lrow">{mark("wont")}<div className="cd-lrow__body"><div className="cd-lrow__v">{s.notPartial}</div><div className="cd-lrow__d">{s.notPartialD}</div></div></div>
          </div>
        </div>
      </section>

      {/* ---- corrections & publish action ---- */}
      <form action={formAction} className="cd-actionbar" id="cd-publish" aria-label={s.correctH}>
        {hiddenPublishFields(publishIds, pkgIds, windowStart, windowEnd, notes, picks, priority)}
        <div className="cd-sectionhead"><h3>{s.correctH}</h3></div>
        <div className="row">
          <a className="sq-link" href="/planning/bulk">{s.backConfig}</a>
          <span className="t-caption">{s.backConfigD}</span>
        </div>
        <div className="field">
          <label className="sq-field__label" htmlFor="cd-notes">{s.notes}</label>
          {/* value submitted via the mirrored hidden field so notes survive the source failure form too */}
          <textarea id="cd-notes" className="sq-textarea" rows={2} placeholder={s.notesPlaceholder} value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
        {/* M6 — eligibility acknowledgement: with ineligible rows present the
            publish stays disabled until the reviewer explicitly proceeds with
            the eligible subset only; the choice persists into the draft. */}
        {needsAck && !validating && (
          <div className="sq-banner sq-banner--warning" role="alert">
            <p>{interp(s.ackRequired, { n: ineligibleIds.length })}</p>
            <label className="sq-choice">
              <input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} />
              <span>{interp(s.ackLabel, { n: eligibleIds.length })}</span>
            </label>
          </div>
        )}
        <p className="t-caption">{s.willRecheck}</p>
        {!transitionsExecutable && (
          <div className="sq-banner sq-banner--warning" role="status">
            <div>{s.draftUnavailable}</div>
          </div>
        )}
        <div className="cd-actionbar__row">
          <div className="cd-grow">
            {committable
              ? <div className="t-caption">{s.allClear}</div>
              : <div className="cd-disabledreason" id={reasonId}>{s.disabledPrefix}{validating ? s.checking : needsAck && !acknowledged ? interp(s.ackRequired, { n: ineligibleIds.length }) : interp(s.blockersN, { n: blockers.length })}</div>}
            {draftSavedMsg && <div className="t-caption" role="status">{draftSavedMsg}</div>}
            {draftSaveError && <div className="cd-disabledreason" role="alert">{s.draftSaveFailed}</div>}
          </div>
          <button type="button" className="sq-btn sq-btn--secondary"
            disabled={!transitionsExecutable || savingDraft || workingIds.length === 0}
            onClick={() => { void onSaveDraft(); }}>
            {savingDraft ? s.savingDraft : s.saveDraft}
          </button>
          <button className="sq-btn sq-btn--prominent cd-publishbtn"
            disabled={!transitionsExecutable || !committable}
            aria-describedby={committable ? undefined : reasonId}>
            {committable ? interp(s.publishReady, { n: baseReady ? retained : eligibleIds.length }) : validating ? s.checking : interp(s.publishBlocked, { n: needsAck && !acknowledged ? ineligibleIds.length : blockers.length })}
          </button>
        </div>
      </form>
    </div>
  );
}

// Hidden fields carrying the retained working set into the publish server action.
// Only non-excluded factory ids are submitted; the server + RPC re-validate.
// M7 — one package_version_id field per checked package (zero fields = zero
// packages, an allowed preparation-time choice).
function hiddenPublishFields(ids: string[], pkgIds: string[], ws: string, we: string, notes: string, picks: Record<string, string>, priority: string) {
  return (
    <>
      {pkgIds.map(id => <input key={`p-${id}`} type="hidden" name="package_version_id" value={id} />)}
      <input type="hidden" name="window_start" value={ws} />
      <input type="hidden" name="window_end" value={we} />
      <input type="hidden" name="visit_type" value="periodic" />
      <input type="hidden" name="priority" value={priority} />
      <input type="hidden" name="notes" value={notes} />
      {ids.map(id => <input key={id} type="hidden" name="factory_id" value={id} />)}
      {ids.map(id => (picks[id] ? <input key={`i-${id}`} type="hidden" name={`inspector_${id}`} value={picks[id]} /> : null))}
    </>
  );
}
