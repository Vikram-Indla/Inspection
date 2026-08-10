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
// PREVIEW; the supervision submission RPC re-runs every guard in
// one transaction and is the authority. No optimistic "Published" is ever shown;
// a rolled-back publish is never presented as success (P03 all-or-nothing).
import { useActionState, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  publishBulkPlan, loadBulkSelection, validateBulkPlan, saveBulkDraft,
  type BulkResult, type ReviewData, type ValidateResult, type Blocker, type BlockerKind,
  type OverlapEvidence, type SourceState, type BulkDraft, type EligibilityReason, type LookupOption,
} from "../actions";
import Button from "@/components/saqeel/button/button";
import EvidenceLedger, { type LedgerFocus, type EvidenceLedgerStrings } from "./EvidenceLedger";
import { ReviewLoading, ReviewUnavailable, ReviewOutOfScope, ReviewEmpty } from "@/components/sections/planning-bulk/review-standby/review-standby";
import { ReviewPublishing, ReviewFailure, ReviewSuccess } from "@/components/sections/planning-bulk/review-outcome/review-outcome";
import ReviewReadiness, { type ReadinessItem, type ReadinessTone } from "@/components/sections/planning-bulk/review-readiness/review-readiness";
import ReviewContext from "@/components/sections/planning-bulk/review-context/review-context";
import ReviewEligibility from "@/components/sections/planning-bulk/review-eligibility/review-eligibility";
import ReviewTargets, { type TargetRow } from "@/components/sections/planning-bulk/review-targets/review-targets";
import ReviewAssignmentSplit from "@/components/sections/planning-bulk/review-assignment-split/review-assignment-split";
import ReviewConsequenceLedger, { type ConsequenceGroup, type ConsequenceMark } from "@/components/sections/planning-bulk/review-consequence-ledger/review-consequence-ledger";
import ReviewPublishForm from "@/components/sections/planning-bulk/review-publish-form/review-publish-form";
import Stack from "@/components/saqeel/stack/stack";
import DiscardDraftButton from "../../DiscardDraftButton";
import PlanningNotice from "@/components/sections/planning-single/planning-notice/planning-notice";

const SEL_KEY = "cd021-bulk-selection";

export type ReviewStrings = {
  // phases
  loading: string; loadingNote: string; stagedBanner: string; stagedSub: string;
  unavailable: string; unavailableTag: string; emptyTitle: string; emptyBody: string; backToTargeting: string;
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
  windowPick: string; windowClear: string; windowApply: string; windowEmpty: string;
  windowStartTime: string; windowEndTime: string; previousMonth: string; nextMonth: string;
  presetNext7: string; presetNext30: string; presetNext90: string;
  // readiness
  readiness: string; blockedTag: string; readyTag: string; blockersN: string; clearAll: string;
  // targets table
  targetsH: string; selectedLabel: string; retainedLabel: string;
  colFactory: string; colCity: string; colRisk: string; colVisit: string; colAssign: string;
  riskHigh: string; riskMedium: string; riskLow: string;
  autoLabel: string; autoNote: string; excludedLozenge: string; chooseInspector: string;
  assignH: string; manualNamed: string; autoChosen: string; manualEvidenceNote: string; splitLine: string;
  // ledger
  ledgerH: string; ledgerLead: string; markOk: string; markPending: string; markWont: string; markBlocked: string;
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
  sPlan: string; sVisits: string; sAssign: string; sNotif: string; queued: string;
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

// per-kind presentation + which correction the Fix control performs
const BLK_META: Record<BlockerKind, { tone: ReadinessTone; fix: "remove" | "focusRow" | "focusWindow" | "review" | "none" }> = {
  duplicate: { tone: "danger", fix: "remove" },
  overlap: { tone: "danger", fix: "focusRow" },
  coverage: { tone: "warning", fix: "focusWindow" },
  capacity: { tone: "danger", fix: "focusWindow" },
  nopackage: { tone: "warning", fix: "none" },
  packageInvalid: { tone: "danger", fix: "review" },
  nopool: { tone: "danger", fix: "none" },
  configMissing: { tone: "warning", fix: "focusWindow" },
  windowImplausible: { tone: "danger", fix: "focusWindow" },
  srcFactory: { tone: "neutral", fix: "review" },
  srcPackage: { tone: "neutral", fix: "review" },
  srcInspector: { tone: "neutral", fix: "review" },
  srcDuplicate: { tone: "neutral", fix: "review" },
};

export default function ReviewClient({ strings: s, initialDraft, draftUnavailable, transitionsExecutable, locale }: {
  strings: ReviewStrings;
  initialDraft?: BulkDraft | null;
  draftUnavailable?: boolean;
  transitionsExecutable: boolean;
  locale: "en" | "ar";
}) {
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

  if (phase === "loading") return <ReviewLoading strings={s} />;
  if (phase === "unavailable") return <ReviewUnavailable strings={s} />;
  if (phase === "scope") return <ReviewOutOfScope missingCount={data?.missingFactoryIds?.length ?? 0} strings={s} />;
  if (phase === "empty") return <ReviewEmpty draftUnavailable={draftUnavailable === true} strings={s} />;
  if (phase === "publishing") return <ReviewPublishing strings={s} />;
  if (phase === "failure") {
    return (
      <ReviewFailure
        reason={state.error ?? ""}
        headingRef={failHeadingRef}
        strings={s}
        retryForm={
          <form action={formAction}>
            {hiddenPublishFields(workingIds, pkgIds, windowStart, windowEnd, notes, picks, priority)}
            <Button variant="primary" type="submit">{s.tryAgain}</Button>
          </form>
        }
      />
    );
  }
  if (phase === "success") {
    return (
      <ReviewSuccess
        created={state.created ?? val?.ledger?.toCreate ?? val?.retained ?? 0}
        proposed={Object.values(picks).filter(Boolean).length}
        planId={state.planId ?? null}
        headingRef={successHeadingRef}
        strings={s}
        dropped={(state.dropped ?? []).map(row => ({
          id: row.id,
          name: row.name,
          reasons: row.reasons.map(reasonText).join(" · "),
        }))}
      />
    );
  }

  if (data === null) return null;

  // ---------------- review phase ----------------
  const v = val;
  const validating = v === null;            // preview not yet resolved — never show a false "ready"
  const blockers = v?.blockers ?? [];
  const retained = v?.retained ?? nonDupIds.length;
  const manual = v?.manual ?? 0;
  const auto = v?.auto ?? Math.max(0, retained - manual);

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
      overlapSamples: (ov?.samples ?? []).map(sm => ({ label: s.ecBlockedN.replace("{n}", "1"), window: `${fmtWin(sm.window_start)}→${fmtWin(sm.window_end)}` })),
    };
  })();



  const toReadinessItem = (b: Blocker, index: number): ReadinessItem => {
    const { title, detail } = blockerCopy(b);
    const meta = BLK_META[b.kind];
    return {
      key: b.kind + index,
      tone: meta.tone,
      label: meta.tone === "warning" ? s.readyTag : s.blockedTag,
      title,
      detail,
      fixLabel: meta.fix === "none" ? null : fixLabel(b),
    };
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

  const createMark: "ok" | "pending" = committable ? "ok" : "pending";

  const keepGovernedValue = () => undefined;

  const optionsFrom = (rows: LookupOption[] | undefined, fallbackKey: string, fallbackLabel: string, allowed: string) =>
    (rows?.length ? rows : [{ key: fallbackKey, label_en: fallbackLabel, label_ar: null }]).map(o => ({
      value: o.key,
      label: lk(o),
      disabled: o.key !== allowed,
      note: o.key === allowed ? undefined : s.notBulkYet,
    }));

  const evidenceOf = (fid: string): TargetRow["evidence"] => {
    const pick = picks[fid] ?? "";
    if (!pick) return { tone: "pending", text: s.ecAuto };
    if (!(data?.inspectors ?? []).some(i => i.user_id === pick)) return { tone: "blocked", text: s.ev.bNotPool };
    if (overlapSource === "failed") return { tone: "blocked", text: s.ecFail };
    if (!windowSet || overlapSource === "not-evaluated") return { tone: "pending", text: s.ecSetWindow };
    const ov = overlapFor(pick);
    if (ov && ov.count > 0) {
      const sample = ov.samples[0];
      const window = sample ? ` · ${fmtWin(sample.window_start)}→${fmtWin(sample.window_end)}` : "";
      return { tone: "blocked", text: interp(s.ecBlockedN, { n: ov.count }) + window };
    }
    return { tone: "ok", text: `${s.ecInPool} · ${interp(s.ecOverlaps, { n: 0 })} · ${s.ecSkills}` };
  };

  const riskLabelOf = (band: string | null) =>
    band === "high" ? s.riskHigh : band === "medium" ? s.riskMedium : band === "low" ? s.riskLow : "—";

  const targetRows: TargetRow[] = data.factories
    .filter(f => (workingIds.includes(f.id) || dupIds.has(f.id)) && !(dupIds.has(f.id) && removedDups))
    .map(f => ({
      id: f.id,
      name: f.name,
      factoryCode: f.factory_code,
      crNumber: f.cr_number,
      city: f.city,
      riskBand: f.risk_band,
      riskLabel: riskLabelOf(f.risk_band),
      excluded: dupIds.has(f.id),
      reasons: (eligById.get(f.id)?.reasons ?? []).map(reasonText),
      pick: picks[f.id] ?? "",
      evidence: evidenceOf(f.id),
    }));

  const packageLabelOf = (id: string) => data.packages.find(p => p.id === id)?.code ?? id.slice(0, 8);
  const createMarkOf = (ready: boolean): ConsequenceMark => (ready ? "ok" : "pending");

  const ledgerGroups: ConsequenceGroup[] = [
    {
      key: "create", heading: s.gCreate,
      footnote: committable ? undefined : s.notFinal,
      rows: [
        { key: "plan", mark: createMark, value: s.cPlan, detail: s.cPlanD },
        { key: "visits", mark: createMarkOf(committable), value: interp(s.cVisits, { n: retained }), detail: s.cVisitsD },
        { key: "assign", mark: createMarkOf(committable), value: interp(s.cAssign, { n: retained }), detail: s.cAssignD },
      ],
    },
    {
      key: "reference", heading: s.gRef,
      rows: [
        {
          key: "package", mark: createMarkOf(pkgIds.length > 0),
          value: pkgIds.length ? `${interp(s.packageCount, { n: pkgIds.length })} · ${pkgIds.map(packageLabelOf).join(" · ")}` : s.packageNone,
          detail: pkgIds.length ? s.rTypeD : s.packageHint,
        },
        { key: "type", mark: "ok", value: s.rType, detail: s.rTypeD },
        { key: "window", mark: createMarkOf(Boolean(windowStart && windowEnd)), value: s.rWin, detail: s.rWinD },
        { key: "method", mark: "ok", value: interp(s.rMethod, { manual, auto }), detail: s.rMethodD },
      ],
    },
    {
      key: "record", heading: s.gRecord,
      rows: [
        { key: "audit", mark: createMarkOf(committable), value: s.recAudit, detail: s.recAuditD },
        { key: "notif", mark: createMarkOf(committable), value: interp(s.recNotif, { n: retained }), detail: s.recNotifD },
      ],
    },
    {
      key: "not", heading: s.gNot, negative: true,
      rows: [
        { key: "start", mark: "wont", value: s.notStart, detail: s.notStartD },
        { key: "deliver", mark: "wont", value: s.notDeliver, detail: s.notDeliverD },
        { key: "drop", mark: "wont", value: s.notDrop, detail: s.notDropD },
        { key: "partial", mark: "wont", value: s.notPartial, detail: s.notPartialD },
      ],
    },
  ];

  const blockedReason = committable ? null
    : validating ? s.checking
      : needsAck && !acknowledged ? interp(s.ackRequired, { n: ineligibleIds.length })
        : interp(s.blockersN, { n: blockers.length });
  return (
    <Stack gap="section">
      <p className="sqx-visually-hidden" role="status" aria-live="polite">{announce}</p>

      <ReviewContext
        freshness={freshness}
        selectedCount={workingIds.length}
        retainedCount={retained}
        manual={manual}
        auto={auto}
        visitType="periodic"
        visitTypeOptions={optionsFrom(data.lookups?.visitTypes, "periodic", s.typePeriodic, "periodic")}
        mode="physical"
        modeOptions={optionsFrom(data.lookups?.visitModes, "physical", s.physical, "physical")}
        priority={priority}
        priorityOptions={(data.lookups?.priorities ?? []).map(o => ({ value: o.key, label: lk(o) }))}
        packages={data.packages.map(p => ({ id: p.id, label: `${p.code} · ${p.version_label}`, checked: pkgIds.includes(p.id) }))}
        windowStart={windowStart}
        windowEnd={windowEnd}
        draftUnavailable={draftUnavailable === true}
        strings={s}
        locale={locale}
        onGovernedValueChange={keepGovernedValue}
        onPriorityChange={setPriority}
        onPackageToggle={(id, checked) => setPkgIds(ids => checked ? [...ids, id] : ids.filter(x => x !== id))}
        onWindowChange={range => { setWindowStart(range.from); setWindowEnd(range.to); }}
        draftBanner={initialDraft ? (
          <PlanningNotice tone="info" label={interp(s.draftBanner, { ref: initialDraft.planReference })}>
            <DiscardDraftButton planId={initialDraft.planId} expectedVersion={initialDraft.version} label={s.discardDraft}
              discardAria={`${s.discardDraft} — ${initialDraft.planReference}`} />
          </PlanningNotice>
        ) : null}
      />

      <ReviewReadiness
        validating={validating}
        items={blockers.map(toReadinessItem)}
        warnings={(v?.warnings ?? []).map(toReadinessItem)}
        headingRef={readinessHeadingRef}
        strings={s}
        onFix={key => { const target = blockers.find((b, i) => b.kind + i === key); if (target) runFix(target); }}
      />

      <ReviewEligibility counts={validating ? null : v?.ledger ?? null} strings={s} />

      <ReviewTargets
        rows={targetRows}
        inspectors={data.inspectors.map(i => ({ value: i.user_id, label: i.full_name }))}
        selectedCount={workingIds.length}
        retainedCount={retained}
        strings={s}
        onPick={(factoryId, inspectorId) => setPicks(p => ({ ...p, [factoryId]: inspectorId }))}
        onFocusRow={setFocusedId}
      />

      <section aria-label={s.evTitle}>
        <EvidenceLedger focus={ledgerFocus} strings={s.ev} ledgerStrings={s} />
      </section>

      <ReviewAssignmentSplit manual={manual} auto={auto} strings={s} />

      <ReviewConsequenceLedger groups={ledgerGroups} strings={s} />

      <ReviewPublishForm
        action={formAction}
        hiddenFields={hiddenPublishFields(publishIds, pkgIds, windowStart, windowEnd, notes, picks, priority)}
        notes={notes}
        onNotesChange={setNotes}
        acknowledgement={needsAck && !validating
          ? { required: true, checked: acknowledged, onChange: setAcknowledged }
          : null}
        savedMessage={draftSavedMsg}
        saveFailed={draftSaveError}
        saving={savingDraft}
        canSaveDraft={transitionsExecutable && workingIds.length > 0}
        canPublish={transitionsExecutable && committable}
        onSaveDraft={() => { void onSaveDraft(); }}
        strings={{
          ...s,
          ackRequired: interp(s.ackRequired, { n: ineligibleIds.length }),
          ackLabel: interp(s.ackLabel, { n: eligibleIds.length }),
          blockedReason,
          transitionsBlocked: transitionsExecutable ? null : s.draftUnavailable,
          publishLabel: committable
            ? interp(s.publishReady, { n: baseReady ? retained : eligibleIds.length })
            : validating ? s.checking
              : interp(s.publishBlocked, { n: needsAck && !acknowledged ? ineligibleIds.length : blockers.length }),
        }}
      />
    </Stack>
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
