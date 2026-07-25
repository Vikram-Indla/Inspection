"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { localForUser, processOutbox, promptLegacyOfflineRestore, sha256b64, type SyncState, type Conflict, type OutboxOp } from "@/lib/offline";
import { supabaseBrowser } from "@/lib/supabase";
import {
  type Item, type Answer, type FormDef, type FormDraft, type FindingDraft, type VioConfig, type Section, type ItemStates,
  isVisible, contextFlags, conditionContext, scoreExcluded, computeHealthScore, evidenceLeg, formRequired, formComplete,
  sectionProgress, summarize, impliedViolations, computeBlockers, type SectionBlockers, effectiveSections, ADDED_SECTION_KEY,
} from "./runtime";
import SignaturePad, { type SignaturePadStrings, type SignatureAck } from "./SignaturePad";
import FieldConnectivityBanner from "@/components/field/FieldConnectivityBanner";
import ImageAnnotator, { compressImageFile, type AnnotatorStrings } from "@/components/ImageAnnotator";
import ContextualAiPanel from "@/components/ContextualAiPanel";
import Modal from "@/components/Modal";
import { IconLock, IconLightbulb, IconDocument, IconVideo } from "@/app/icons";
import { requestActiveCancellationAction } from "../../[visitId]/actions";
import styles from "./workspace.module.css";

type Ins = { id: string; status: string; visit_id: string; package_versions: { definition: { sections: Section[]; action_forms?: FormDef[]; item_snapshot?: Record<string, unknown>; item_rules?: Record<string, { requirement?: "required" | "optional" | "conditional" }> } }; submission_versions?: { version_number: number }[]; reviews?: { returned_sections: string[] | null; decision_reason: string | null; decided_at: string | null }[] };
type SResp = { item_id: string; response: Answer | null; updated_at: string };
type SEv = {
  id: string; linked_type: string; linked_id: string; evidence_type: string;
  storage_path?: string | null; captured_at?: string | null;
  // Phase 6 — sha rides the submission evidence manifest (compared by id+sha, D-020).
  content_sha256?: string | null;
  // lifecycle columns land in migration 0020 — optional so the page degrades pre-migration
  archived_at?: string | null; superseded_by?: string | null; deleted_at?: string | null;
};
// F2 — Factory/Visit context panel data (M04-054/068) + previous-inspection comparison (M04-136/137)
export type WorkspacePanel = {
  factory: { name: string; code: string | null; region: string | null; city: string | null; license: string | null; activity: string | null };
  visit: { window_start: string; window_end: string; visit_type: string; execution_mode: string };
  pkg: { code: string; label: string };
};
export type PrevComparison = { label: string; date: string | null; answers: Record<string, string>; evidence: Record<string, number> };
type SForm = { id: string; item_id: string | null; violation_id: string | null; form_type: string; owner_name: string | null; owner_role: string | null; due_at: string | null; required_correction: string | null; status: string };
type SVio = { id: string; violation_code_id: string; invalidated_at?: string | null; invalidate_reason?: string | null };
type SFinding = { id: string; item_id: string | null; severity: string; description: string };
// Phase 5 (§15) — per-visit item lifecycle row from inspection_item_states.
type SItemState = { item_id: string; state: "added" | "deselected"; reason: string | null; reverted_at: string | null };
// Phase 5 (§18) — published action_form configuration template for manual add.
type ActionTemplate = { id: string; key: string; title: string };
type QueuedEvidence = Extract<OutboxOp, { kind: "evidence" }>;
type EvidenceLimits = Record<string, { formats?: string[]; max_mb?: number }>;
// Phase 4B — latest active-session cancellation request for the visit (§12).
export type WorkspaceCancellation = {
  id: string; status: "pending" | "approved" | "rejected" | "cancelled";
  reason_key: string; requested_at: string; decision_reason: string | null;
};

// SB19 — every display string (incl. the sync-state LABEL map) is built
// server-side with t() and passed as props; offline logic is untouched.
export type WorkspaceStrings = {
  sync: { [K in SyncState]: string };
  // O-12/IPAD-FIGMA-DELTA §2A — "في حال ان الاتصال ضعيف": a degraded-connection
  // signal distinct from the sync chip above (which reports write/queue
  // outcome, not network quality).
  connectivityOffline: string; connectivityWeak: string;
  answered: string;
  conflictHead: string; thisDevice: string; server: string; keepMine: string; keepServer: string;
  returnedScope: string; returnedNote: string;
  submittedTitle: string; submittedBody: string;
  lockedSection: string;
  mandatoryPhoto: string; submitBtn: string;
  autoViolation: string; plusActionForm: string; plusPhoto: string;
  evidenceQueued: string; blockers: string; submitting: string; queuedOffline: string; retryNow: string;
  exitBtn: string; exitTitle: string; exitSavedSynced: string; exitSavedLocal: string; exitConfirm: string; exitCancel: string;
  // Phase 4B — active-session cancellation request (§12; Operations decides)
  cancelHeading: string; cancelCaption: string; cancelSelectReason: string;
  cancelCommentPlaceholder: string; cancelSubmit: string; cancelPending: string;
  cancelApprovedTitle: string; cancelApprovedBody: string;
  cancelRejected: string; cancelFailed: string; cancelReasonsMissing: string;
  enumLabels: { [k: string]: string };
  // — Slice E2 runtime depth —
  progress: string;
  summaryTitle: string; sumAnswered: string; sumPending: string; sumCompliant: string; sumNonCompliant: string; sumViolations: string; sumEvidence: string;
  ctxTitle: string; ctxHint: string; ctxYes: string; ctxNo: string; ctxLabels: { [k: string]: string };
  guidanceLabel: string; conditionalBadge: string;
  aiExplainTitle: string; aiExplainDescription: string; aiExplain: string; aiUnavailable: string; aiEvidence: string; aiAdvisory: string;
  noteLabel: string; notePlaceholder: string;
  naExcluded: string; dateLabel: string;
  evAdd: string; evAddDoc: string; evCount: string; evRequired: string; evQueuedAlt: string; evTooLarge: string; evBadFormat: string;
  afBlocking: string; afComplete: string; afIncomplete: string; afSaved: string; afFieldLabels: { [k: string]: string };
  vioTitle: string; vioNone: string; vioPenalty: string; vioLevel: string; vioAction: string;
  vioInvalidated: string; vioPenaltyConflict: string;
  findingTitle: string; findingHint: string; findingClassification: string; findingSeverity: string;
  findingNarrative: string; findingPlaceholder: string; findingRequired: string; findingSaved: string;
  findingPending: string; findingFailed: string; findingRetry: string;
  // — Phase 5 item lifecycle (§15) —
  libTitle: string; libHint: string; libAdd: string; libEmpty: string; libAddedGroup: string; libAddedMsg: string;
  deselectBtn: string; deselectTitle: string; deselectReason: string; deselectReasonPh: string;
  deselectConfirm: string; deselectCancel: string; deselectNeedsReason: string;
  deselectedTitle: string; deselectedAudit: string; restoreBtn: string; restoredMsg: string;
  // — Phase 5 manual action forms (§18) —
  afAddTitle: string; afAddHint: string; afAddPick: string; afAddBtn: string; afAddedMsg: string; afNone: string;
  valTitle: string; valUnanswered: string; valEvidence: string; valForms: string; valFindings: string;
  ready: string; notReady: string;
  sig: SignaturePadStrings;
  // — Slice F2 evidence & media depth —
  panelTitle: string; panelFactory: string; panelVisit: string;
  panelCode: string; panelLicense: string; panelRegion: string; panelActivity: string;
  panelWindow: string; panelTypeMode: string; panelPkg: string;
  prevSource: string; prevLine: string; prevNoAnswer: string;
  evSyncedAlt: string; evArchived: string; evReplace: string; evDelete: string;
  evDeletedMsg: string; evDeleteQueuedOffline: string; evArchiveQueued: string; saveFailed: string;
  evDeleteTitle: string; evDeleteReason: string; evDeleteReasonPh: string;
  evDeleteConfirm: string; evDeleteCancel: string; evDeleteNeedsReason: string;
  annot: AnnotatorStrings;
};

const fmt = (s: string, vars: Record<string, string | number>) => { return s.replace(/\{(\w+)\}/g, (m, k) => String(vars[k] ?? m)); };
const acceptFor = (type: string) => type === "document" ? ".pdf,application/pdf" : type === "video" ? "video/*" : "image/*";

export default function Workspace({ inspection, items, library, serverResponses, serverEvidence, serverForms, serverFindings, serverViolations, serverItemStates, actionTemplates, serverContext, vioConfig, evidenceLimits, actionDueDays, strings, evidenceUrls, prev, panel, inspectionNo, locale, userId, cancellation, cancelReasons, journeySchemaAvailable }: {
  inspection: Ins; items: Item[]; library: Item[]; serverResponses: SResp[]; serverEvidence: SEv[]; serverForms: SForm[]; serverViolations: SVio[];
  serverFindings: SFinding[];
  userId: string;
  serverItemStates: SItemState[]; actionTemplates: ActionTemplate[];
  serverContext: Record<string, string>; vioConfig: Record<string, VioConfig>; evidenceLimits: EvidenceLimits; actionDueDays: number; strings: WorkspaceStrings;
  evidenceUrls: Record<string, string>; prev: PrevComparison | null; panel: WorkspacePanel; inspectionNo: string | null; locale: "en" | "ar";
  // Phase 4B — active-session cancellation (inert unless the schema probe passed)
  cancellation?: WorkspaceCancellation | null; cancelReasons?: { key: string; label: string }[]; journeySchemaAvailable?: boolean;
}) {
  const local = useMemo(() => localForUser(userId), [userId]);
  const router = useRouter();
  const [sync, setSync] = useState("synced" as SyncState);
  const [detail, setDetail] = useState(undefined as string | undefined);
  const [exiting, setExiting] = useState(false);
  const [answers, setAnswers] = useState(() =>
    Object.fromEntries(serverResponses.filter(r => { return !!r.response; }).map(r => [r.item_id, r.response!])) as { [k: string]: Answer });
  const [ctx, setCtx] = useState(serverContext);
  const [forms, setForms] = useState(() => Object.fromEntries(serverForms.filter(f => !!f.item_id).map(f =>
    [f.item_id!, { owner_name: f.owner_name ?? "", owner_role: f.owner_role ?? "", due_at: f.due_at ? f.due_at.slice(0, 10) : "", required_correction: f.required_correction ?? "" }])) as { [itemId: string]: FormDraft });
  const [findings, setFindings] = useState(() => Object.fromEntries(serverFindings.filter(f => !!f.item_id).map(f => [
    f.item_id!, { id: f.id, description: f.description, severity: f.severity, classification: "", sync: "synced" },
  ])) as Record<string, FindingDraft>);
  const [queuedEv, setQueuedEv] = useState([] as QueuedEvidence[]);
  const [commentDrafts, setCommentDrafts] = useState({} as Record<string, string>);
  // F2 — captured photos awaiting the annotation overlay (pre-enqueue, offline-safe)
  const [pendingShots, setPendingShots] = useState([] as { item: Item; b64: string; mime: string; fname: string; replaceId?: string }[]);
  // F2 — local overlay for archive/delete applied before the server round-trip lands
  const [evState, setEvState] = useState({} as Record<string, { archived?: boolean; deleted?: boolean }>);
  const [deleting, setDeleting] = useState(null as { ev: SEv; reason: string } | null);
  const [conflicts, setConflicts] = useState([] as Conflict[]);
  const [msg, setMsg] = useState(null as string | null);
  const [validation, setValidation] = useState(null as SectionBlockers[] | null);
  const [signing, setSigning] = useState(false);
  const [submitted, setSubmitted] = useState(inspection.status === "submitted");
  // Phase 4B / D-016 — active-session cancellation is NON-BLOCKING until
  // Operations decides: a pending request shows a banner while the inspector
  // keeps working; only an approval locks the workspace read-only (terminal).
  const [cancelState, setCancelState] = useState<WorkspaceCancellation | null>(cancellation ?? null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelComment, setCancelComment] = useState("");
  const [cancelBusy, setCancelBusy] = useState(false);
  const cancelIdemRef = useRef(null as string | null);
  const cancelApproved = cancelState?.status === "approved";
  const cancelPending = cancelState?.status === "pending";
  useEffect(() => { void promptLegacyOfflineRestore(userId).catch(() => {}); }, [userId]);
  useEffect(() => { setCancelState(cancellation ?? null); }, [cancellation]);
  useEffect(() => {
    if (!cancelPending) return;
    const timer = window.setInterval(() => router.refresh(), 15_000);
    return () => window.clearInterval(timer);
  }, [cancelPending, router]);

  // §12 — the inspector files a request; Operations decides. Idempotency key
  // is stable across retries inside this mounted workspace.
  async function requestCancellation() {
    if (!cancelReason || !journeySchemaAvailable) return;
    if (cancelReason === "other" && !cancelComment.trim()) return;
    if (!cancelIdemRef.current) cancelIdemRef.current = crypto.randomUUID();
    setCancelBusy(true);
    try {
      const r = await requestActiveCancellationAction({
        visitId: inspection.visit_id,
        reasonKey: cancelReason,
        comment: cancelComment.trim() || null,
        idempotencyKey: cancelIdemRef.current,
      });
      if (r.error || !r.request) { setMsg(strings.cancelFailed); return; }
      setCancelState({
        id: r.request.id, status: r.request.status, reason_key: r.request.reason_key,
        requested_at: r.request.requested_at, decision_reason: r.request.decision_reason,
      });
      setExiting(false);
      router.refresh();
    } finally { setCancelBusy(false); }
  }
  const codeById = useMemo(() => Object.fromEntries(Object.values(vioConfig).map(c => [c.id, c.code])), [vioConfig]);
  const [vioIds, setVioIds] = useState(() => {
    const m: { [code: string]: string } = {};
    for (const v of serverViolations) { if (v.invalidated_at) continue; const code = codeById[v.violation_code_id]; if (code) m[code] = v.id; }
    return m;
  });
  // Phase 5 (§18, D-018) — invalidated candidates stay VISIBLE with state
  // (audit preserved, never deleted). Seeded from server rows + this session.
  const [invalidatedVios, setInvalidatedVios] = useState(() => {
    const m: Record<string, boolean> = {};
    for (const v of serverViolations) { if (!v.invalidated_at) continue; const code = codeById[v.violation_code_id]; if (code) m[code] = true; }
    return m;
  });
  // Phase 5 (§15, D-017) — per-visit item lifecycle (added / deselected +
  // pre-submit restore). A state is ACTIVE while reverted_at is null.
  const [itemStates, setItemStates] = useState(() => Object.fromEntries(
    serverItemStates.map(r => [r.item_id, { state: r.state, reason: r.reason, active: r.reverted_at == null }]),
  ) as ItemStates);
  const [deselecting, setDeselecting] = useState(null as { item: Item; reason: string } | null);
  // Phase 5 (§18) — manually added action forms (offline-pending ones ride a
  // durable draft until the reconnect flush inserts them).
  const [manualForms, setManualForms] = useState([] as { id: string; form_type: string; title: string; status: string }[]);
  const [afPick, setAfPick] = useState("");
  const baseline = useMemo(() => Object.fromEntries(serverResponses.map(r => [r.item_id, r.updated_at])), [serverResponses]);
  const imap = useMemo(() => Object.fromEntries(items.map(i => [i.code, i])), [items]);
  // Effective-scope item map: frozen configured items + the full active library
  // (added items resolve against the library). Configured rows win on conflict.
  const allMap = useMemo(() => ({ ...Object.fromEntries(library.map(i => [i.code, i])), ...imap }), [library, imap]);
  const sections = inspection.package_versions.definition.sections.filter(s => { return !!s.items?.length; });
  const itemRules = inspection.package_versions.definition.item_rules ?? {};
  const formDefs = useMemo(() => inspection.package_versions.definition.action_forms ?? [], [inspection]);
  // §15/§20 — effective scope: snapshot MINUS actively deselected PLUS added
  // (added land in the synthetic "Added items" section; no item→section
  // metadata exists outside the frozen section code lists).
  const displaySections = useMemo(
    () => effectiveSections(sections, allMap, itemStates, strings.libAddedGroup),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allMap, itemStates, strings.libAddedGroup]);
  const sectionItems = useMemo(() => displaySections.flatMap(s => s.items ?? []).map(c => allMap[c]).filter((i): i is Item => !!i),
    [displaySections, allMap]);
  const flags = useMemo(() => contextFlags(sectionItems), [sectionItems]);
  // §15 — deselect affordance: OPTIONAL items only (response_model.requirement,
  // else the frozen item_rules; metadata absent → fail closed as required,
  // same rule as D-007). Inspector-ADDED items can always be removed again.
  const canDeselect = useCallback((it: Item) => {
    if (itemStates[it.id]?.active && itemStates[it.id]?.state === "added") return true;
    const requirement = it.response_model.requirement ?? itemRules[it.code]?.requirement ?? "required";
    return requirement === "optional";
  }, [itemStates, itemRules]);

  // Latest-state mirrors so async pushes and the reconnect flush never act on stale closures.
  const answersRef = useRef(answers); answersRef.current = answers;
  const ctxRef = useRef(ctx); ctxRef.current = ctx;
  const formsRef = useRef(forms); formsRef.current = forms;
  const findingsRef = useRef(findings); findingsRef.current = findings;
  const vioIdsRef = useRef(vioIds); vioIdsRef.current = vioIds;
  const itemStatesRef = useRef(itemStates); itemStatesRef.current = itemStates;
  const manualFormsRef = useRef(manualForms); manualFormsRef.current = manualForms;
  const pending = useRef({ ctx: false, forms: new Set(), findings: new Set(), vios: new Set(), manual: [] as { id: string; form_type: string; title: string }[] } as { ctx: boolean; forms: Set<string>; findings: Set<string>; vios: Set<string>; manual: { id: string; form_type: string; title: string }[] });
  const flushRef = useRef(() => {});
  // F2 — durable media pendings (replace-archive M04-163 · soft delete M04-164);
  // persisted as local drafts so they survive reload while offline.
  const pendingArch = useRef([] as { oldId: string; newPath: string }[]);
  const pendingDel = useRef([] as { id: string; reason: string }[]);
  useEffect(() => {
    local.getDrafts(inspection.id).then(rows => {
      for (const r of rows) {
        const k = String(r.k);
        if (k === `${inspection.id}:__arch`) pendingArch.current = (r.v as typeof pendingArch.current) ?? [];
        if (k === `${inspection.id}:__del`) pendingDel.current = (r.v as typeof pendingDel.current) ?? [];
        if (k === `${inspection.id}:__manual_forms`) {
          pending.current.manual = (r.v as typeof pending.current.manual) ?? [];
          if (pending.current.manual.length) {
            setManualForms(f => {
              const have = new Set(f.map(x => x.id));
              return [...f, ...pending.current.manual.filter(m => !have.has(m.id)).map(m => ({ ...m, status: "open" }))];
            });
          }
        }
        if (k.startsWith(`${inspection.id}:finding:`)) {
          const itemId = k.slice(`${inspection.id}:finding:`.length);
          const draft = r.v as FindingDraft;
          if (itemId && draft) setFindings(current => ({ ...current, [itemId]: { ...draft, sync: "pending" } }));
        }
      }
      if (pendingArch.current.length || pendingDel.current.length) {
        setEvState(s => {
          const n = { ...s };
          for (const a of pendingArch.current) n[a.oldId] = { ...n[a.oldId], archived: true };
          for (const d of pendingDel.current) n[d.id] = { ...n[d.id], deleted: true };
          return n;
        });
      }
    });
  }, [inspection.id, local]);

  const onState = useCallback((s: SyncState, d?: string) => {
    // A replay started while online can finish after the browser goes offline.
    // Do not let that stale completion overwrite the durable offline state.
    const effective = !navigator.onLine && s !== "offline" ? "offline" : s;
    setSync(effective);
    setDetail(effective === "offline" ? undefined : d);
    local.conflicts().then(setConflicts);
  }, [local]);
  const refreshQueued = useCallback(async () => {
    const ops = await local.peekAll();
    setQueuedEv(ops.filter((o): o is QueuedEvidence => o.kind === "evidence" && o.inspection_id === inspection.id));
  }, [inspection.id]);
  useEffect(() => {
    const tick = () => { processOutbox(userId, onState); refreshQueued(); flushRef.current(); };
    tick();
    const goOffline = () => onState("offline");
    window.addEventListener("online", tick); window.addEventListener("offline", goOffline);
    const iv = setInterval(tick, 8000);
    return () => { clearInterval(iv); window.removeEventListener("online", tick); window.removeEventListener("offline", goOffline); };
  }, [onState, refreshQueued, userId]);

  // --- Persistence beyond the outbox (context · action forms · runtime violations) ---
  // The offline engine is untouched: these use direct writes when online plus a
  // local draft + reconnect flush when offline (RLS is the authority; provider
  // errors are diagnostic-only and the UI receives stable recovery copy).
  async function pushCtx(next: Record<string, string>) {
    if (!navigator.onLine) { pending.current.ctx = true; return; }
    const { error } = await supabaseBrowser().from("inspections").update({ context: next }).eq("id", inspection.id);
    if (error) { console.error("[field workspace context]", error.message); setMsg(strings.saveFailed); pending.current.ctx = true; } else pending.current.ctx = false;
  }
  async function saveCtx(key: string, value: string) {
    const next = { ...ctxRef.current, [key]: value };
    setCtx(next);
    await local.saveDraft(inspection.id, "__ctx", next);   // durable local home while offline
    await pushCtx(next);
  }
  async function ensureViolation(code: string): Promise<string | null> {
    const known = vioIdsRef.current[code]; if (known) return known;
    const cfg = vioConfig[code];
    if (!cfg?.mapping_version) return null;                 // no accepted penalty mapping → never invent one
    if (!navigator.onLine) { pending.current.vios.add(code); return null; }
    const sb = supabaseBrowser();
    // Phase 5 (§18, D-018) — reuse only the ACTIVE candidate; an invalidated
    // row stays in audit and a fresh candidate is created on re-trigger.
    // Tolerant: pre-migration the invalidated_at column is missing → fall back
    // to the unfiltered read (exactly the pre-Phase-5 behavior).
    let existing: { id: string } | null = null;
    {
      const r = await sb.from("violations").select("id").eq("inspection_id", inspection.id).eq("violation_code_id", cfg.id).is("invalidated_at", null).maybeSingle();
      if (r.error) {
        const fallback = await sb.from("violations").select("id").eq("inspection_id", inspection.id).eq("violation_code_id", cfg.id).maybeSingle();
        if (fallback.error) { console.error("[field workspace violation read]", fallback.error.message); setMsg(strings.saveFailed); pending.current.vios.add(code); return null; }
        existing = fallback.data;
      } else existing = r.data;
    }
    if (existing?.id) { setVioIds(m => ({ ...m, [code]: existing.id })); pending.current.vios.delete(code); return existing.id; }
    const { data, error } = await sb.from("violations").insert({ inspection_id: inspection.id, violation_code_id: cfg.id, mapping_version: cfg.mapping_version }).select("id").single();
    if (error) { console.error("[field workspace violation]", error.message); setMsg(strings.saveFailed); pending.current.vios.add(code); return null; }
    setVioIds(m => ({ ...m, [code]: data.id })); pending.current.vios.delete(code);
    return data.id;
  }
  /** Phase 5 (§18, D-018) — response flipped back to Compliant: INVALIDATE the
   *  active candidate (never delete). The outbox op replays after the response
   *  op (FIFO) and the replay also cancels open trigger-generated action forms
   *  LINKED to the candidate; package-included forms are never touched. */
  async function invalidateViolation(code: string) {
    const vid = vioIdsRef.current[code] ?? null;
    if (!vid && !invalidatedVios[code] && !pending.current.vios.has(code)) return;  // nothing active to invalidate
    pending.current.vios.delete(code);
    setVioIds(m => { const n = { ...m }; delete n[code]; return n; });
    setInvalidatedVios(m => ({ ...m, [code]: true }));
    await local.enqueue({
      kind: "violation_invalidate", inspection_id: inspection.id,
      violation_id: vid, violation_code_id: vid ? null : (vioConfig[code]?.id ?? null),
      reason: "Response changed to compliant", queued_at: new Date().toISOString(),
    });
    processOutbox(userId, onState);
  }
  /** Phase 5 (§15, D-017) — one op kind covers add / deselect / restore: the
   *  payload is the DESIRED final row, upserted on (inspection_id, item_id). */
  async function pushItemState(item: Item, state: "added" | "deselected", reason: string | null, reverted: boolean) {
    const reverted_at = reverted ? new Date().toISOString() : null;
    setItemStates(m => ({ ...m, [item.id]: { state, reason, active: !reverted } }));
    await local.enqueue({ kind: "item_state", inspection_id: inspection.id, item_id: item.id, state, reason, reverted_at, queued_at: new Date().toISOString() });
    processOutbox(userId, onState);
  }
  async function confirmDeselect() {
    if (!deselecting) return;
    const reason = deselecting.reason.trim();
    if (!reason) { setMsg(strings.deselectNeedsReason); return; }
    const item = deselecting.item;
    setDeselecting(null);
    await pushItemState(item, "deselected", reason, false);
  }
  /** Phase 5 (§18) — manual action form from a published configuration
   *  template: included ≠ completed. Client-generated id keeps the insert
   *  replay-safe; offline adds ride a durable draft until the flush. */
  async function addManualForm() {
    const tpl = actionTemplates.find(t2 => t2.id === afPick);
    if (!tpl) return;
    if (manualFormsRef.current.some(f => f.form_type === tpl.key) || serverForms.some(f => !f.item_id && f.form_type === tpl.key)) return;  // no duplicates
    const row = { id: crypto.randomUUID(), form_type: tpl.key, title: tpl.title, status: "open" };
    setManualForms(f => [...f, row]);
    setAfPick("");
    setMsg(strings.afAddedMsg);
    if (!navigator.onLine) {
      pending.current.manual.push({ id: row.id, form_type: row.form_type, title: row.title });
      await local.saveDraft(inspection.id, "__manual_forms", pending.current.manual);
      return;
    }
    const { error } = await supabaseBrowser().from("action_forms").insert({
      id: row.id, inspection_id: inspection.id, item_id: null, violation_id: null,
      form_type: row.form_type, status: "open",
    });
    if (error) {
      console.error("[field workspace manual action form]", error.message); setMsg(strings.saveFailed);
      pending.current.manual.push({ id: row.id, form_type: row.form_type, title: row.title });
      await local.saveDraft(inspection.id, "__manual_forms", pending.current.manual);
    }
  }
  async function pushForm(item: Item, def: FormDef) {
    const draft = formsRef.current[item.id] ?? {};
    if (!navigator.onLine) { pending.current.forms.add(item.id); return; }
    const value = answersRef.current[item.id]?.value;
    const vcode = value ? item.response_model.mapping?.[value]?.violation : undefined;
    const violation_id = vcode ? await ensureViolation(vcode) : null;
    const { error } = await supabaseBrowser().from("action_forms").upsert({
      inspection_id: inspection.id, item_id: item.id, violation_id,
      form_type: def.key,
      owner_name: draft.owner_name || null, owner_role: draft.owner_role || null,
      due_at: draft.due_at ? new Date(`${draft.due_at}T00:00:00Z`).toISOString() : null,
      required_correction: draft.required_correction || null,
      status: formComplete(def, draft) ? "complete" : "open",   // M04-183: complete only when mandatory fields pass
    }, { onConflict: "inspection_id,item_id" });
    if (error) { console.error("[field workspace action form]", error.message); setMsg(strings.saveFailed); pending.current.forms.add(item.id); return; }
    pending.current.forms.delete(item.id);
    setMsg(fmt(strings.afSaved, { code: item.code }));
  }
  function editForm(item: Item, field: string, value: string) {
    const next = { ...formsRef.current[item.id], [field]: value };
    setForms(f => ({ ...f, [item.id]: next }));
    local.saveDraft(inspection.id, `af:${item.id}`, next);      // autosave draft (M04-181/182)
  }
  async function saveFinding(item: Item, classification: string, severity: string) {
    const current = findingsRef.current[item.id];
    const description = current?.description.trim() ?? "";
    const id = current?.id ?? crypto.randomUUID();
    const next: FindingDraft = { ...current, id, description, classification, severity, sync: "pending" };
    setFindings(state => ({ ...state, [item.id]: next }));
    await local.saveDraft(inspection.id, `finding:${item.id}`, next);
    if (!description || description.length > 2000) {
      pending.current.findings.add(item.id);
      return;
    }
    if (!navigator.onLine) {
      await local.enqueue({ kind: "finding", id, inspection_id: inspection.id, item_id: item.id, severity, description, queued_at: new Date().toISOString() });
      pending.current.findings.delete(item.id);
      processOutbox(userId, onState);
      return;
    }
    const sb = supabaseBrowser();
    const payload = { inspection_id: inspection.id, item_id: item.id, severity, description };
    const result = await sb.from("findings").upsert({ id, ...payload }, { onConflict: "id" }).select("id").single();
    if (result.error) {
      console.error("[field workspace finding]", result.error.message);
      await local.enqueue({ kind: "finding", id, inspection_id: inspection.id, item_id: item.id, severity, description, queued_at: new Date().toISOString() });
      pending.current.findings.delete(item.id);
      setFindings(state => ({ ...state, [item.id]: { ...next, sync: "failed" } }));
      setMsg(strings.findingFailed);
      processOutbox(userId, onState);
      return;
    }
    pending.current.findings.delete(item.id);
    const saved = { ...next, id: result.data.id, sync: "synced" as const };
    setFindings(state => ({ ...state, [item.id]: saved }));
    await local.saveDraft(inspection.id, `finding:${item.id}`, saved);
    setMsg(fmt(strings.findingSaved, { code: item.code }));
  }
  // F2 — media lifecycle flush: archive rows once their replacement synced
  // (superseded_by needs the new evidence id), apply queued soft deletes.
  // Direct writes when online + durable pendings offline — offline engine untouched.
  async function flushMedia() {
    if (!navigator.onLine) return;
    const sb = supabaseBrowser();
    if (pendingArch.current.length) {
      const rest: typeof pendingArch.current = [];
      for (const a of pendingArch.current) {
        const { data: repl, error: replacementError } = await sb.from("evidence").select("id").eq("storage_path", a.newPath).maybeSingle();
        if (replacementError) { console.error("[field workspace replacement read]", replacementError.message); setMsg(strings.saveFailed); rest.push(a); continue; }
        if (!repl) { rest.push(a); continue; }                    // replacement not synced yet — retry next tick
        const { error } = await sb.from("evidence").update({ archived_at: new Date().toISOString(), superseded_by: repl.id }).eq("id", a.oldId);
        if (error) { console.error("[field workspace evidence archive]", error.message); setMsg(strings.saveFailed); rest.push(a); }
      }
      pendingArch.current = rest;
      await local.saveDraft(inspection.id, "__arch", rest);
    }
    if (pendingDel.current.length) {
      const rest: typeof pendingDel.current = [];
      for (const d of pendingDel.current) {
        const { error } = await sb.from("evidence").update({ deleted_at: new Date().toISOString(), delete_reason: d.reason }).eq("id", d.id);
        if (error) { console.error("[field workspace evidence delete flush]", error.message); setMsg(strings.saveFailed); rest.push(d); }
      }
      pendingDel.current = rest;
      await local.saveDraft(inspection.id, "__del", rest);
    }
  }
  flushRef.current = () => {   // reconnect flush for non-outbox writes
    if (!navigator.onLine) return;
    if (pending.current.ctx) pushCtx(ctxRef.current);
    for (const code of [...pending.current.vios]) ensureViolation(code);
    for (const itemId of [...pending.current.forms]) {
      const item = items.find(i => i.id === itemId); if (!item) continue;
      const def = formRequired(item, answersRef.current[itemId]?.value, formDefs);
      if (def) pushForm(item, def);
    }
    // Phase 5 (§18) — replay queued manual action-form adds (id-keyed inserts).
    if (pending.current.manual.length) {
      const rest: typeof pending.current.manual = [];
      (async () => {
        for (const m of pending.current.manual) {
          const { error } = await supabaseBrowser().from("action_forms").insert({
            id: m.id, inspection_id: inspection.id, item_id: null, violation_id: null,
            form_type: m.form_type, status: "open",
          });
          if (error && !String(error.message).includes("duplicate")) { console.error("[field workspace manual action form flush]", error.message); rest.push(m); }
        }
        pending.current.manual = rest;
        await local.saveDraft(inspection.id, "__manual_forms", rest);
      })();
    }
    flushMedia();
  };

  async function answer(item: Item, patch: Answer) {
    const prevValue = answersRef.current[item.id]?.value;
    const next = { ...answersRef.current[item.id], ...patch };
    setAnswers(a => ({ ...a, [item.id]: next }));                        // instant local state
    await local.saveDraft(inspection.id, item.id, next);                 // durable draft (autosave — FND-005)
    if (next.value) {                                                    // note rides with the answer; note-only stays a local draft
      await local.enqueue({ kind: "response", inspection_id: inspection.id, item_id: item.id, response: next, baseline_updated_at: baseline[item.id] ?? null, queued_at: new Date().toISOString() });
      processOutbox(userId, onState);
    }
    const nc = next.value ? item.response_model.mapping?.[next.value] : undefined;
    if (nc?.violation) {
      setMsg(fmt(strings.autoViolation, { code: item.code, violation: nc.violation, actionForm: nc.action_form ? strings.plusActionForm : "", photo: item.evidence_rule?.mandatory ? strings.plusPhoto : "" }));
      ensureViolation(nc.violation);                                     // runtime violation record (M04-142)
    }
    // Phase 5 (§18, D-018) — the response moved AWAY from a violation-mapped
    // value: invalidate (never delete) the active candidate that this response
    // triggered, and re-evaluate its dependent trigger-generated action forms.
    const prevViolation = prevValue && prevValue !== next.value ? item.response_model.mapping?.[prevValue]?.violation : undefined;
    if (prevViolation && prevViolation !== nc?.violation) invalidateViolation(prevViolation);
    const def = formRequired(item, next.value, formDefs);                // instantiate blocking form (M04-172)
    if (def && !formsRef.current[item.id]) {
      const seeded = { due_at: new Date(Date.now() + actionDueDays * 86400000).toISOString().slice(0, 10) };  // DEC-003 default
      setForms(f => ({ ...f, [item.id]: seeded }));
      await local.saveDraft(inspection.id, `af:${item.id}`, seeded);
    }
  }
  function saveNote(item: Item, note: string) {
    const next = { ...answersRef.current[item.id], note };
    setAnswers(a => ({ ...a, [item.id]: next }));
    local.saveDraft(inspection.id, item.id, next);
  }
  function flushNote(item: Item) {
    const cur = answersRef.current[item.id];
    if (cur?.value) answer(item, {});                                    // re-enqueue merged {value, note, date}
  }
  /** F2 — single enqueue path for evidence; `replaceId` = replace-with-archive (M04-163). */
  async function enqueueEvidence(item: Item, b64: string, mime: string, fname: string, replaceId?: string, evidenceType?: "photo" | "video" | "document" | "comment") {
    const sha = await sha256b64(b64);
    const name = `${item.code}-${Date.now()}-${fname}`;
    await local.enqueue({ kind: "evidence", inspection_id: inspection.id, linked_type: "item", linked_id: item.id, evidence_type: evidenceType, name, mime, data_b64: b64, captured_at: new Date().toISOString(), sha256: sha, queued_at: new Date().toISOString() });
    if (replaceId) {
      // archive (never delete) the superseded row once the replacement syncs — superseded_by needs the new id
      pendingArch.current = [...pendingArch.current, { oldId: replaceId, newPath: `${inspection.id}/${name}` }];
      await local.saveDraft(inspection.id, "__arch", pendingArch.current);
      setEvState(s => ({ ...s, [replaceId]: { ...s[replaceId], archived: true } }));
      setMsg(fmt(strings.evArchiveQueued, { code: item.code }));
    } else {
      setMsg(fmt(strings.evidenceQueued, { code: item.code, sha: sha.slice(0, 12) }));
    }
    await refreshQueued();
    processOutbox(userId, onState);
    flushMedia();
  }
  async function attachFiles(item: Item, files: FileList, replaceId?: string) {
    const rule = evidenceLeg(item, answersRef.current[item.id]?.value) ?? { type: item.evidence_rule?.type ?? "photo", applies: true, mandatory: false, min: 1 };
    const limits = evidenceLimits[rule.type];
    for (const file of Array.from(files)) {
      const ext = (file.name.split(".").pop() ?? "").toLowerCase();
      if (limits?.formats?.length && ext && !limits.formats.includes(ext === "jpg" ? "jpeg" : ext)) {
        setMsg(fmt(strings.evBadFormat, { name: file.name, type: rule.type, formats: limits.formats.join(", ") })); continue;
      }
      if (limits?.max_mb && file.size > limits.max_mb * 1024 * 1024) {
        setMsg(fmt(strings.evTooLarge, { name: file.name, mb: limits.max_mb, type: rule.type })); continue;
      }
      if (file.type.startsWith("image/")) {
        // M04-166 — client-side compression (longest edge 1600, JPEG q0.8) BEFORE enqueue,
        // then the annotation overlay (M04-109/124/147/160) — flattened image replaces the payload pre-sync.
        const c = await compressImageFile(file);
        if (c) {
          setPendingShots(q => [...q, { item, b64: c.b64, mime: c.mime, fname: file.name.replace(/\.[^.]+$/, "") + ".jpg", replaceId }]);
          continue;
        }
      }
      const b64 = btoa(String.fromCharCode(...new Uint8Array(await file.arrayBuffer())));
      await enqueueEvidence(item, b64, file.type || "application/octet-stream", file.name, replaceId, rule.type as "photo" | "video" | "document");
    }
  }
  async function attachComment(item: Item) {
    const value = commentDrafts[item.id]?.trim();
    if (!value) return;
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    await enqueueEvidence(item, btoa(binary), "text/plain;charset=utf-8", "comment.txt", undefined, "comment");
    setCommentDrafts(current => ({ ...current, [item.id]: "" }));
  }
  // F2 — soft delete with mandatory reason; audited by the evidence audit trigger (0020)
  async function confirmDelete() {
    if (!deleting) return;
    const reason = deleting.reason.trim();
    if (!reason) { setMsg(strings.evDeleteNeedsReason); return; }
    const evId = deleting.ev.id;
    setDeleting(null);
    if (navigator.onLine) {
      const { error } = await supabaseBrowser().from("evidence").update({ deleted_at: new Date().toISOString(), delete_reason: reason }).eq("id", evId);
      if (error) { console.error("[field workspace evidence delete]", error.message); setMsg(strings.saveFailed); return; }
      setEvState(s => ({ ...s, [evId]: { ...s[evId], deleted: true } }));
      setMsg(strings.evDeletedMsg);
    } else {
      pendingDel.current = [...pendingDel.current, { id: evId, reason }];
      await local.saveDraft(inspection.id, "__del", pendingDel.current);
      setEvState(s => ({ ...s, [evId]: { ...s[evId], deleted: true } }));
      setMsg(strings.evDeleteQueuedOffline);
    }
  }
  const shot = pendingShots[0] ?? null;
  async function confirmShot(b64: string, mime: string) {
    const s = pendingShots[0]; if (!s) return;
    setPendingShots(q => q.slice(1));
    await enqueueEvidence(s.item, b64, mime, s.fname, s.replaceId, "photo");
  }

  // --- Derived runtime views ---
  // F2 — archived (replaced) and soft-deleted evidence never counts toward legs or summary
  const isActiveEv = useCallback((e: SEv) => {
    const o = evState[e.id];
    return !e.deleted_at && !e.archived_at && !o?.deleted && !o?.archived;
  }, [evState]);
  const activeEvidence = useMemo(() => serverEvidence.filter(isActiveEv), [serverEvidence, isActiveEv]);
  const evidencePerItem = useMemo(() => {
    const m: Record<string, Record<string, number>> = {};
    const add = (itemId: string, type: string) => {
      m[itemId] ??= {};
      m[itemId][type] = (m[itemId][type] ?? 0) + 1;
    };
    for (const e of activeEvidence) if (e.linked_type === "item") add(e.linked_id, e.evidence_type);
    for (const q of queuedEv) if (q.linked_type === "item") add(q.linked_id, q.evidence_type ?? (q.mime.startsWith("image") ? "photo" : q.mime.startsWith("video") ? "video" : "document"));
    return m;
  }, [activeEvidence, queuedEv]);
  const runtimeCtx = conditionContext(sectionItems, answers, ctx);
  // §15/§20 — every runtime view runs over the ACTIVE scope (deselected
  // excluded, added included immediately) via the itemStates-aware signatures.
  const progress = sectionProgress(sections, allMap, answers, runtimeCtx, itemStates);
  const totals = progress.reduce((t, p) => ({ a: t.a + p.answered, b: t.b + p.total }), { a: 0, b: 0 });
  const overallPct = totals.b ? Math.round(100 * totals.a / totals.b) : 100;
  const summary = summarize(sections, allMap, answers, runtimeCtx, activeEvidence.length + queuedEv.length, itemStates);
  const healthScore = computeHealthScore(sectionItems, answers, runtimeCtx, itemStates);
  const implied = impliedViolations(sectionItems, answers, runtimeCtx, vioConfig);
  const liveBlockers = computeBlockers(sections, allMap, answers, runtimeCtx, evidencePerItem, forms, formDefs, itemStates, findings);
  const blockCount = liveBlockers.reduce((n, g) => n + g.unanswered.length + g.evidence.length + g.forms.length + g.findings.length, 0);
  // §15 — actively deselected items stay visible in a collapsed audit list
  // with their reason; restore is available before submit.
  const deselectedItems = useMemo(() => Object.entries(itemStates)
    .filter(([, st]) => st.active && st.state === "deselected")
    .map(([itemId, st]) => {
      const it = Object.values(allMap).find(x => x.id === itemId);
      return it ? { item: it, reason: st.reason } : null;
    })
    .filter((x): x is { item: Item; reason: string | null } => !!x), [itemStates, allMap]);
  // §15 — library candidates: active library items NOT in the effective set
  // (deselected snapshot items are restored, not re-added, so they stay out).
  const libraryCandidates = useMemo(() => {
    const effectiveCodes = new Set(displaySections.flatMap(s => s.items ?? []));
    return library.filter(it => !effectiveCodes.has(it.code));
  }, [library, displaySections]);
  // §18 — invalidated candidates kept visible with state (audit preserved).
  const invalidatedList = useMemo(() => Object.keys(invalidatedVios).filter(c => invalidatedVios[c])
    .map(code => ({ code, config: vioConfig[code] ?? null })), [invalidatedVios, vioConfig]);

  async function submit() {
    // Full readiness re-validation: answers + mandatory evidence + blocking forms (M04-199/204/208).
    const submitCtx = conditionContext(sectionItems, answersRef.current, ctxRef.current);
    const blockers = computeBlockers(sections, allMap, answersRef.current, submitCtx, evidencePerItem, formsRef.current, formDefs, itemStatesRef.current, findingsRef.current);
    if (blockers.length) {
      setValidation(blockers);
      const missing = blockers.flatMap(b => b.unanswered);
      setMsg(missing.length ? fmt(strings.blockers, { items: missing.join(", ") }) : fmt(strings.notReady, { n: blockers.reduce((n, g) => n + g.evidence.length + g.forms.length + g.findings.length, 0) }));
      return;
    }
    setValidation(null);
    setSigning(true);   // DEC-009: acknowledgement signature captured at submit; enqueue happens in finalizeSubmit
  }

  async function finalizeSubmit(ack: SignatureAck) {
    setSigning(false);
    const key = crypto.randomUUID();
    // Phase 6 (D-020): version_number is SERVER-authoritative on the RPC path
    // (submit_inspection computes max+1 under a row lock). This client-side
    // number is computed ONLY as the legacy-fallback payload for
    // pre-20260721160000 servers and for the optimistic queue message.
    const legacyVersion = Math.max(0, ...(inspection.submission_versions ?? []).map(s => s.version_number)) + 1;
    const byCode = (id: string) => (items.find(i => i.id === id) ?? library.find(i => i.id === id))?.code ?? id;
    // Phase 6 (§21/§22, D-020/D-022) — the snapshot carries the frozen
    // contract the server enforces: per-section comparable sub-objects
    // (returned-scope byte-equality), the section membership map (legacy prior
    // versions are sliced with it server-side), and the mandatory-evidence set
    // resolved from the frozen evidence rules at this response state.
    const section_items: Record<string, string[]> = {};
    const sectionSlices: Record<string, { answers: Record<string, string>; notes: Record<string, string>; dates: Record<string, string>; evidence: { id: string; sha: string | null }[] }> = {};
    const evidence_required: string[] = [];
    for (const s of displaySections) {
      const codes = (s.items ?? []).filter(c => !!allMap[c]);
      section_items[s.key] = codes;
      const slice: { answers: Record<string, string>; notes: Record<string, string>; dates: Record<string, string>; evidence: { id: string; sha: string | null }[] } = { answers: {}, notes: {}, dates: {}, evidence: [] };
      const itemIds = new Set<string>();
      for (const c of codes) {
        const it = allMap[c];
        itemIds.add(it.id);
        const a = answers[it.id];
        if (a?.value) slice.answers[c] = a.value;
        if (a?.note) slice.notes[c] = a.note;
        if (a?.date) slice.dates[c] = a.date;
      }
      // Evidence manifest entries travel as {id, sha} — compared by id+sha,
      // never URLs (D-020). Queued (unsynced) evidence has no server id yet;
      // the server's EXE-SUBMIT-EVIDENCE-PENDING precondition covers it.
      slice.evidence = activeEvidence
        .filter(e => e.linked_type === "item" && itemIds.has(e.linked_id))
        .map(e => ({ id: e.id, sha: e.content_sha256 ?? null }))
        .sort((a, b) => a.id.localeCompare(b.id));
      sectionSlices[s.key] = slice;
    }
    const submitRuntimeCtx = conditionContext(sectionItems, answers, ctx);
    for (const it of sectionItems) {
      if (!isVisible(it, submitRuntimeCtx)) continue;
      const leg = evidenceLeg(it, answers[it.id]?.value);
      if (leg?.applies && leg.mandatory) evidence_required.push(it.id);
    }
    const snapshot = {
      // answers stays code→value (shape consumed by the review screen); depth lands in sibling keys.
      answers: Object.fromEntries(Object.entries(answers).filter(([, v]) => !!v.value).map(([id, v]) => [byCode(id), v.value!])),
      notes: Object.fromEntries(Object.entries(answers).filter(([, v]) => !!v.note).map(([id, v]) => [byCode(id), v.note!])),
      dates: Object.fromEntries(Object.entries(answers).filter(([, v]) => !!v.date).map(([id, v]) => [byCode(id), v.date!])),
      context: ctx,
      violations: implied.map(v => ({
        item: v.itemCode, code: v.code, title: v.config?.title ?? null, level: v.config?.level ?? null,
        penalty_ref: v.config?.penalty_ref ?? null, legal_basis: v.config?.legal_basis ?? null,
        mapping_version: v.config?.mapping_version ?? null,
      })),
      findings: implied.map(v => {
        const finding = findings[v.itemId];
        return {
          id: finding?.id ?? null, item: v.itemCode, classification: v.code,
          severity: v.config?.level ?? null, description: finding?.description.trim() ?? "",
          sync: finding?.sync ?? "pending",
        };
      }),
      action_forms: Object.entries(forms).map(([itemId, draft]) => {
        const item = items.find(i => i.id === itemId) ?? library.find(i => i.id === itemId);
        if (!item) return null;
        const def = formRequired(item, answers[itemId]?.value, formDefs);
        return def ? { item: item.code, form_type: def.key, ...draft, status: formComplete(def, draft) ? "complete" : "open" } : null;
      }).filter(Boolean),
      health_score: healthScore,
      // §15/§18 — lifecycle facts ride the final version: deselected items and
      // invalidated candidates stay auditable in the immutable snapshot too.
      item_states: Object.fromEntries(Object.entries(itemStatesRef.current).map(([stateId, st]) => [byCode(stateId), { state: st.state, reason: st.reason, active: st.active }])),
      invalidated_violations: Object.keys(invalidatedVios).filter(c => invalidatedVios[c]),
      evidence: { total: activeEvidence.length + queuedEv.length, by_item_and_type: Object.fromEntries(Object.entries(evidencePerItem).map(([id, counts]) => [byCode(id), counts])) },
      // Phase 6 — frozen submission contract enforced server-side (§21/§22).
      sections: sectionSlices,
      section_items,
      evidence_required,
      submitted_offline: !navigator.onLine,
    };
    await local.enqueue({ kind: "submit", inspection_id: inspection.id, version_number: legacyVersion, snapshot, idempotency_key: key, acknowledgement: { name: ack.name, signed: true, ts: ack.signed_at, signed_at: ack.signed_at, signature_data_url: ack.signature_data_url }, queued_at: new Date().toISOString() });
    setSubmitted(true);
    setMsg(navigator.onLine ? fmt(strings.submitting, { v: legacyVersion }) : strings.queuedOffline);
    // After a successful RPC submit, local state follows the SERVER-assigned
    // version number (D-020); the legacy fallback never reports one back.
    processOutbox(userId, onState, (inspectionId, info) => {
      if (inspectionId === inspection.id) setMsg(fmt(strings.submitting, { v: info.version_number }));
    });
  }

  const tone = sync === "synced" ? "badge-compliant" : sync === "offline" ? "badge-warning" : sync === "syncing" ? "badge-info" : sync === "conflict" ? "badge-critical" : sync === "failed" ? "badge-critical" : "badge-pending";
  return (
    <div className="stack" style={{ gap: "var(--space-4)" }}>
      <div className={styles.toolbar}>
        <span className="row" style={{ gap: "var(--space-2)", alignItems: "center" }}>
          <span className={`badge ${tone}`}><span className="dot" />{strings.sync[sync]}{detail ? ` · ${detail}` : ""}</span>
          {sync === "failed" && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => processOutbox(userId, onState)}>{strings.retryNow}</button>
          )}
        </span>
        <span className="row" style={{ gap: "var(--space-2)", alignItems: "center" }}>
          <span className="t-caption id-code">{inspectionNo ? `${inspectionNo} · ` : ""}{fmt(strings.answered, { a: totals.a, b: totals.b })} · {fmt(strings.progress, { pct: overallPct })}</span>
          {!submitted && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setExiting(true)}>{strings.exitBtn}</button>}
        </span>
      </div>
      <FieldConnectivityBanner offline={strings.connectivityOffline} weak={strings.connectivityWeak} />
      {msg && <div className="alert alert-info"><div>{msg}</div></div>}

      {/* DEC-A — Figma wizard-shell parity as a guided presentation over the existing
          config-driven engine: pure anchor navigation over the unchanged section list
          below, no new state, no altered validation/submit/RLS/offline behaviour. */}
      {!submitted && sections.length > 1 && (
        <nav className="tabs" aria-label={strings.panelTitle} style={{ overflowX: "auto", flexWrap: "nowrap" }}>
          {sections.map(s => (
            <a key={s.key} className="tab" href={`#ax-section-${s.key}`} style={{ whiteSpace: "nowrap" }}>{s.title}</a>
          ))}
        </nav>
      )}

      {/* M04-054 / M04-068 — collapsible Factory/Visit context panel with expandable cards,
          reachable from every wizard step (sticky-header sibling at the top of the workspace) */}
      <details className={styles.card} style={{ padding: "var(--space-4)" }}>
        <summary style={{ cursor: "pointer", fontSize: "var(--type-compact-size)", fontWeight: 600 }}>
          {strings.panelTitle}{inspectionNo ? <span className="id-code"> · {inspectionNo}</span> : null}
        </summary>
        <div className={styles.grid2} style={{ marginBlockStart: "var(--space-3)" }}>
          <details open className={styles.panel} style={{ padding: "var(--space-3)" }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>{strings.panelFactory}</summary>
            <div className="stack" style={{ gap: "var(--space-2)", marginBlockStart: "var(--space-2)" }}>
              <div><strong>{panel.factory.name}</strong></div>
              <div className="row" style={{ justifyContent: "space-between" }}><span className="t-caption">{strings.panelCode}</span><span className="id-code">{panel.factory.code ?? "—"}</span></div>
              <div className="row" style={{ justifyContent: "space-between" }}><span className="t-caption">{strings.panelLicense}</span><span className="id-code">{panel.factory.license ?? "—"}</span></div>
              <div className="row" style={{ justifyContent: "space-between" }}><span className="t-caption">{strings.panelRegion}</span><span>{panel.factory.region ?? "—"} · {panel.factory.city ?? "—"}</span></div>
              <div className="row" style={{ justifyContent: "space-between" }}><span className="t-caption">{strings.panelActivity}</span><span>{panel.factory.activity ?? "—"}</span></div>
            </div>
          </details>
          <details open className={styles.panel} style={{ padding: "var(--space-3)" }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>{strings.panelVisit}</summary>
            <div className="stack" style={{ gap: "var(--space-2)", marginBlockStart: "var(--space-2)" }}>
              <div className="row" style={{ justifyContent: "space-between" }}><span className="t-caption">{strings.panelWindow}</span><span className="id-code">{panel.visit.window_start.slice(0, 16).replace("T", " ")} → {panel.visit.window_end.slice(11, 16)}</span></div>
              <div className="row" style={{ justifyContent: "space-between" }}><span className="t-caption">{strings.panelTypeMode}</span><span>{(strings.enumLabels[panel.visit.visit_type] ?? panel.visit.visit_type)} · {(strings.enumLabels[panel.visit.execution_mode] ?? panel.visit.execution_mode)}</span></div>
              <div className="row" style={{ justifyContent: "space-between" }}><span className="t-caption">{strings.panelPkg}</span><span>{panel.pkg.code} <span className="id-code">{panel.pkg.label}</span></span></div>
            </div>
          </details>
        </div>
        {/* M04-136/137 — source of the previous-inspection comparison shown per item below */}
        {prev && <p className="t-caption" style={{ marginBlockStart: "var(--space-2)" }}>{fmt(strings.prevSource, { ref: prev.label, date: prev.date ?? "—" })}</p>}
      </details>
      {conflicts.map(c => (
        <div key={c.key} className={styles.conflict}>
          <div className={styles.conflictHead}>{fmt(strings.conflictHead, { code: items.find(i => i.id === c.item_id)?.code ?? "" })}</div>
          <div className={styles.conflictGrid}>
            <div className={styles.conflictSide}><h5>{strings.thisDevice}</h5><p>{JSON.stringify(c.local)}</p></div>
            <div className={styles.conflictSide}><h5>{strings.server}</h5><p>{JSON.stringify(c.server)}</p></div>
          </div>
          <div className={styles.conflictFoot}>
            <button className="btn btn-secondary" onClick={async () => { const it = items.find(i => i.id === c.item_id)!; await local.resolveConflict(c.key); await answer(it, c.local as Answer); }}>{strings.keepMine}</button>
            <button className="btn btn-primary" onClick={async () => { setAnswers(a => ({ ...a, [c.item_id]: c.server as Answer })); await local.resolveConflict(c.key); setConflicts(await local.conflicts()); }}>{strings.keepServer}</button>
          </div>
        </div>
      ))}
      {inspection.status === "returned" && (() => {
        const lastReturn = (inspection.reviews ?? []).filter(r => { return !!r.decided_at && !!r.returned_sections; }).slice(-1)[0];
        return lastReturn ? <div className="alert alert-warning"><div><strong>{fmt(strings.returnedScope, { sections: lastReturn.returned_sections!.join(", ") })}</strong> {lastReturn.decision_reason} · {strings.returnedNote}</div></div> : null;
      })()}
      {submitted && <div className="alert alert-immutable"><div><strong>{strings.submittedTitle}</strong> {strings.submittedBody}</div></div>}
      {/* Phase 4B / D-016 — approved cancellation: terminal, read-only lock;
          pending: non-blocking banner, the inspector keeps working (§12). */}
      {cancelApproved && <div className="alert alert-immutable" role="status"><div><strong>{strings.cancelApprovedTitle}</strong> {strings.cancelApprovedBody}</div></div>}
      {cancelPending && <div className="alert alert-warning" role="status"><div>{strings.cancelPending}</div></div>}
      {cancelState?.status === "rejected" && <div className="alert alert-warning" role="status"><div>{fmt(strings.cancelRejected, { reason: cancelState.decision_reason ?? "—" })}</div></div>}

      {/* Live summary — answered / pending / compliant / non-compliant / violations / evidence (M04-149) */}
      {!submitted && (
        <div className="row" style={{ flexWrap: "wrap", gap: "var(--space-2)", alignItems: "center" }}>
          <span className={styles.overline}>{strings.summaryTitle}</span>
          <span className="badge">{strings.sumAnswered} <span className="id-code">{summary.answered}</span></span>
          <span className="badge">{strings.sumPending} <span className="id-code">{summary.pending}</span></span>
          <span className="badge badge-compliant">{strings.sumCompliant} <span className="id-code">{summary.compliant}</span></span>
          <span className={`badge ${summary.nonCompliant ? "badge-critical" : ""}`}>{strings.sumNonCompliant} <span className="id-code">{summary.nonCompliant}</span></span>
          <span className={`badge ${summary.violations ? "badge-critical" : ""}`}>{strings.sumViolations} <span className="id-code">{summary.violations}</span></span>
          <span className="badge">{strings.sumEvidence} <span className="id-code">{summary.evidence}</span></span>
        </div>
      )}

      {/* Phase 4B / D-016 — once Operations approves the cancellation the whole
          editing region stays visible but inert (read-only lock): a disabled
          fieldset disables every descendant control without touching the
          engine's rendering. */}
      <fieldset disabled={cancelApproved} style={{ display: "contents" }}>
      {/* Site conditions — flags feeding conditional.visible_when (M04-119); persisted on the inspection row */}
      {!submitted && flags.length > 0 && (
        <div className={styles.card} style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <h4>{strings.ctxTitle}</h4>
          <p className="t-caption">{strings.ctxHint}</p>
          <div className="row" style={{ flexWrap: "wrap", gap: "var(--space-4)" }}>
            {flags.map(k => (
              <div key={k} className="row" style={{ gap: "var(--space-2)", alignItems: "center" }}>
                <span style={{ fontSize: "var(--type-compact-size)" }}>{strings.ctxLabels[k] ?? k}</span>
                <div className="seg">
                  <button type="button" className="seg-opt" aria-pressed={ctx[k] === "yes"} onClick={() => saveCtx(k, "yes")}>{strings.ctxYes}</button>
                  <button type="button" className="seg-opt" aria-pressed={ctx[k] === "no"} onClick={() => saveCtx(k, "no")}>{strings.ctxNo}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!submitted && displaySections.map(s => {
        if (inspection.status === "returned") {
          const lastReturn = (inspection.reviews ?? []).filter(r => { return !!r.decided_at && !!r.returned_sections; }).slice(-1)[0];
          if (lastReturn && !lastReturn.returned_sections!.includes(s.key)) {
            return <div key={s.key} className={styles.card} style={{ padding: "var(--space-4)", opacity: .6 }}><h4>{s.title} <IconLock size={16} /></h4><p className="t-caption">{strings.lockedSection}</p></div>;
          }
        }
        const sp = progress.find(p => p.key === s.key)!;
        return (
        <div key={s.key} id={`ax-section-${s.key}`} className={styles.card} style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-3)", scrollMarginBlockStart: "var(--space-8)" }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
            <h4>{s.title}</h4>
            <span className="t-caption id-code">{sp.answered}/{sp.total} · {fmt(strings.progress, { pct: sp.pct })}</span>
          </div>
          {/* Per-section progress (M04-081) */}
          <div className={styles.track} role="progressbar" aria-valuenow={sp.pct} aria-valuemin={0} aria-valuemax={100}>
            <div className={styles.trackFill} style={{ inlineSize: `${sp.pct}%` }} />
          </div>
          {(s.items ?? []).map(code => {
            const it = allMap[code]; if (!it) return null;
            if (!isVisible(it, runtimeCtx)) return null;                 // item-answer + site conditional visibility (M04-119/M09-021)
            const val = answers[it.id];
            const isDate = (it.response_model.responses ?? []).includes("value_date");
            const leg = evidenceLeg(it, val?.value);
            const evCount = leg ? (evidencePerItem[it.id]?.[leg.type] ?? 0) : 0;
            const thumbs = queuedEv.filter(q => q.linked_type === "item" && q.linked_id === it.id && q.mime.startsWith("image"));
            const def = formRequired(it, val?.value, formDefs);
            const draft = forms[it.id];
            const complete = def ? formComplete(def, draft) : false;
            const violationCode = val?.value ? it.response_model.mapping?.[val.value]?.violation : undefined;
            const findingConfig = violationCode ? vioConfig[violationCode] : undefined;
            const finding = findings[it.id];
            const conditional = !!it.response_model.conditional?.visible_when;
            return (
              <div key={code} className={`${styles.question} ${val?.value ? styles.questionAnswered : ""}`}>
                <div className="row" style={{ flexWrap: "wrap", gap: "var(--space-2)", alignItems: "baseline" }}>
                  <p className={styles.title}>{code} · {it.title}</p>
                  {it.clause && <span className="t-caption">{it.clause.legal_source ?? ""} §{it.clause.clause_ref}</span>}
                  {conditional && <span className="badge badge-info">{strings.conditionalBadge}</span>}
                  {itemStates[it.id]?.active && itemStates[it.id]?.state === "added" && <span className="badge badge-info">{strings.libAddedGroup}</span>}
                  {/* §15 — optional/added items only; mandatory items never show this (fail closed like D-007) */}
                  {canDeselect(it) && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDeselecting({ item: it, reason: "" })}>{strings.deselectBtn}</button>
                  )}
                </div>
                {it.guidance && <p className="t-caption"><IconLightbulb size={16} /> {strings.guidanceLabel}: {it.guidance}</p>}
                {/* MVP1-M04-138: separate advisory explanation; it cannot alter the answer/evidence/violation controls below. */}
                <ContextualAiPanel
                  surface="inspection_item_explanation"
                  title={strings.aiExplainTitle}
                  description={strings.aiExplainDescription}
                  context={JSON.stringify({ inspection_id: inspection.id, item_id: it.id, item_code: it.code })}
                  evidenceRefs={["MVP1-M04-138", "SCR-IPAD-640", it.code, ...(it.clause?.clause_ref ? [it.clause.clause_ref] : [])]}
                  targetRef={inspection.id}
                  itemId={it.id}
                  locale={locale}
                  generateLabel={strings.aiExplain}
                  unavailableLabel={strings.aiUnavailable}
                  evidenceLabel={strings.aiEvidence}
                  advisoryLabel={strings.aiAdvisory}
                />
                {/* M04-136/137 — same item's answer + evidence count from the factory's latest prior approved inspection */}
                {prev && (
                  <p className="t-caption">
                    ↩ {fmt(strings.prevLine, {
                      value: prev.answers[it.id] ? (strings.enumLabels[prev.answers[it.id]] ?? prev.answers[it.id].replace(/_/g, " ")) : strings.prevNoAnswer,
                      n: prev.evidence[it.id] ?? 0,
                    })}
                  </p>
                )}
                <div className="row" style={{ flexWrap: "wrap" }}>
                  {isDate ? (
                    <label className={styles.fld}>
                      <span>{strings.dateLabel}</span>
                      <input className="input" type="date" value={val?.date ?? ""} onChange={e => e.target.value && answer(it, { value: e.target.value, date: e.target.value })} />
                    </label>
                  ) : (it.response_model.responses ?? []).map(r => (
                    <button key={r} className={val?.value === r ? (r === "non_compliant" ? "btn btn-lg btn-danger" : "btn btn-lg btn-primary") : "btn btn-lg btn-secondary"}
                      onClick={() => answer(it, { value: r })}>{strings.enumLabels[r] ?? r.replace(/_/g, " ")}</button>
                  ))}
                  {leg?.applies && leg.type !== "comment" && (
                    <label className="btn btn-lg btn-secondary" style={{ cursor: "pointer" }}>
                      {val?.value === "non_compliant" && leg.mandatory ? strings.mandatoryPhoto : (leg.type === "document" ? strings.evAddDoc : strings.evAdd)}
                      <input type="file" accept={acceptFor(leg.type)} multiple hidden onChange={e => { if (e.target.files?.length) { attachFiles(it, e.target.files); e.target.value = ""; } }} />
                    </label>
                  )}
                  {leg?.applies && leg.type === "comment" && (
                    <span className="row" style={{ gap: "var(--space-2)", flexWrap: "wrap" }}>
                      <label className={styles.fld}>
                        <span>{strings.noteLabel}</span>
                        <textarea className="input" value={commentDrafts[it.id] ?? ""} onChange={e => setCommentDrafts(current => ({ ...current, [it.id]: e.target.value }))} />
                      </label>
                      <button type="button" className="btn btn-lg btn-secondary" disabled={!commentDrafts[it.id]?.trim()} onClick={() => attachComment(it)}>{strings.evAdd}</button>
                    </span>
                  )}
                  {leg?.applies && leg.mandatory && (
                    <span className={`badge ${evCount >= leg.min ? "badge-compliant" : "badge-warning"}`}>{fmt(strings.evCount, { n: evCount, min: leg.min })}</span>
                  )}
                </div>
                {val?.value && scoreExcluded(it, val.value) && <p className="t-caption">{strings.naExcluded}</p>}
                {leg?.applies && leg.mandatory && evCount < leg.min && <p className="t-caption" style={{ color: "var(--status-critical-text)" }}>{fmt(strings.evRequired, { min: leg.min })}</p>}
                {violationCode && findingConfig && (
                  <div className={styles.panel} style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-2)", borderInlineStart: finding?.description.trim() ? "4px solid var(--status-compliant)" : "4px solid var(--status-critical)" }}>
                    <div className="row" style={{ justifyContent: "space-between", gap: "var(--space-2)", flexWrap: "wrap" }}>
                      <strong>{strings.findingTitle}</strong>
                      <span className={`badge ${finding?.sync === "failed" ? "badge-critical" : finding?.sync === "pending" ? "badge-warning" : "badge-compliant"}`}>
                        {finding?.sync === "failed" ? strings.findingFailed : finding?.sync === "pending" ? strings.findingPending : strings.afComplete}
                      </span>
                    </div>
                    <p className="t-caption">{strings.findingHint}</p>
                    <div className={styles.grid2}>
                      <label className={styles.fld}><span>{strings.findingClassification}</span><input className="input" readOnly value={`${violationCode} · ${findingConfig.title}`} /></label>
                      <label className={styles.fld}><span>{strings.findingSeverity}</span><input className="input" readOnly value={findingConfig.level} /></label>
                    </div>
                    <label className={styles.fld}>
                      <span>{strings.findingNarrative}<span className="req">*</span></span>
                      <textarea className="input" rows={3} maxLength={2000} value={finding?.description ?? ""}
                        placeholder={strings.findingPlaceholder}
                        onChange={e => {
                          const next: FindingDraft = { id: finding?.id, description: e.target.value, classification: violationCode, severity: findingConfig.level, sync: "pending" };
                          setFindings(state => ({ ...state, [it.id]: next }));
                          void local.saveDraft(inspection.id, `finding:${it.id}`, next);
                          pending.current.findings.add(it.id);
                        }}
                        onBlur={() => saveFinding(it, violationCode, findingConfig.level)} />
                    </label>
                    {!finding?.description.trim() && <p className="t-caption" style={{ color: "var(--status-critical-text)" }}>{strings.findingRequired}</p>}
                    {finding?.sync === "failed" && <button type="button" className="btn btn-secondary" onClick={() => saveFinding(it, violationCode, findingConfig.level)}>{strings.findingRetry}</button>}
                  </div>
                )}
                {/* F2 — evidence list per item: synced thumbnails + REPLACE (archive, M04-163)
                    + DELETE (soft, audited, M04-164); queued captures ride alongside unsynced */}
                {(() => {
                  const rows = serverEvidence.filter(ev2 => ev2.linked_type === "item" && ev2.linked_id === it.id && !ev2.deleted_at && !evState[ev2.id]?.deleted);
                  if (!rows.length && !thumbs.length) return null;
                  return (
                    <div className={styles.evidenceGrid}>
                      {rows.map(ev2 => {
                        const archived = !!ev2.archived_at || !!evState[ev2.id]?.archived;
                        const url = evidenceUrls[ev2.id];
                        return (
                          <div key={ev2.id} className={`${styles.evidence} ${archived ? styles.evidenceQuarantined : ""}`}>
                            {url
                              ? <img className={styles.evidenceThumb} src={url} alt={strings.evSyncedAlt} />
                              : <div className={styles.evidenceThumb} aria-hidden="true">{ev2.evidence_type === "document" ? <IconDocument size={24} /> : <IconVideo size={24} />}</div>}
                            <div className={styles.evidenceMeta}>
                              <span className="id-code">{ev2.captured_at ? ev2.captured_at.slice(0, 16).replace("T", " ") : ""}</span>
                              {archived
                                ? <span className="badge badge-warning">{strings.evArchived}</span>
                                : (
                                  <span className="row" style={{ gap: "var(--space-1)", flexWrap: "wrap" }}>
                                    <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer" }}>
                                      {strings.evReplace}
                                      <input type="file" accept={acceptFor(leg?.type ?? "photo")} hidden
                                        onChange={ie => { if (ie.target.files?.length) { attachFiles(it, ie.target.files, ev2.id); ie.target.value = ""; } }} />
                                    </label>
                                    <button className="btn btn-ghost btn-sm" onClick={() => setDeleting({ ev: ev2, reason: "" })}>{strings.evDelete}</button>
                                  </span>
                                )}
                            </div>
                          </div>
                        );
                      })}
                      {thumbs.map((q, i) => (
                        <div key={i} className={styles.evidence}>
                          <img className={styles.evidenceThumb} src={`data:${q.mime};base64,${q.data_b64}`} alt={strings.evQueuedAlt} />
                        </div>
                      ))}
                    </div>
                  );
                })()}
                <label className={styles.fld}>
                  <span>{strings.noteLabel}</span>
                  <textarea className="input" rows={2} placeholder={strings.notePlaceholder} value={val?.note ?? ""} onChange={e => saveNote(it, e.target.value)} onBlur={() => flushNote(it)} />
                </label>
                {/* Action form runtime (M04-171..184): instantiated from the package's form template */}
                {def && (
                  <div className={styles.panel} style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-2)", borderInlineStart: complete ? "4px solid var(--status-compliant)" : "4px solid var(--status-critical)" }}>
                    <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                      <strong>{def.title}</strong>
                      <span className={`badge ${complete ? "badge-compliant" : "badge-critical"}`}>{complete ? strings.afComplete : strings.afIncomplete}</span>
                    </div>
                    {def.blocking && !complete && <p className="t-caption">{strings.afBlocking}</p>}
                    <div className={styles.grid2}>
                      {def.fields.map(f => (
                        <label key={f} className={styles.fld} style={f === "required_correction" ? { gridColumn: "1 / -1" } : undefined}>
                          <span>{strings.afFieldLabels[f] ?? f}<span className="req">*</span></span>
                          {f === "required_correction"
                            ? <textarea className="input" rows={2} value={draft?.[f] ?? ""} onChange={e => editForm(it, f, e.target.value)} onBlur={() => pushForm(it, def)} />
                            : <input className="input" type={f === "due_at" ? "date" : "text"} value={draft?.[f] ?? ""} onChange={e => editForm(it, f, e.target.value)} onBlur={() => pushForm(it, def)} />}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );})}

      {/* §15 — item library: add active library items not in the effective set.
          Under a reviewer return the whole panel locks (added items have no
          frozen section to match against the return scope — fail closed). */}
      {!submitted && inspection.status !== "returned" && (
        <details className={styles.card} style={{ padding: "var(--space-4)" }}>
          <summary style={{ cursor: "pointer", fontSize: "var(--type-compact-size)", fontWeight: 600 }}>{strings.libTitle}</summary>
          <p className="t-caption" style={{ marginBlockStart: "var(--space-2)" }}>{strings.libHint}</p>
          <div className="stack" style={{ gap: "var(--space-2)", marginBlockStart: "var(--space-2)" }}>
            {libraryCandidates.length === 0 ? <p className="t-caption">{strings.libEmpty}</p> : libraryCandidates.map(it => (
              <div key={it.id} className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: "var(--space-2)" }}>
                <span style={{ fontSize: "var(--type-compact-size)" }}>{it.code} · {it.title}</span>
                <button type="button" className="btn btn-secondary" onClick={() => { pushItemState(it, "added", null, false); setMsg(fmt(strings.libAddedMsg, { code: it.code })); }}>{strings.libAdd}</button>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* §15 — deselected items stay in the audit trail with their reason;
          restore is available before submit (returned scope permitting). */}
      {!submitted && deselectedItems.length > 0 && (
        <div className={styles.card} style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <h4>{fmt(strings.deselectedTitle, { n: deselectedItems.length })}</h4>
          <p className="t-caption">{strings.deselectedAudit}</p>
          {deselectedItems.map(({ item, reason }) => {
            const homeKey = sections.find(s2 => (s2.items ?? []).includes(item.code))?.key ?? ADDED_SECTION_KEY;
            const lr = inspection.status === "returned"
              ? (inspection.reviews ?? []).filter(r => !!r.decided_at && !!r.returned_sections).slice(-1)[0]
              : null;
            const restoreLocked = inspection.status === "returned" && !lr?.returned_sections?.includes(homeKey);
            return (
              <div key={item.id} className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: "var(--space-2)" }}>
                <span className="t-caption"><strong>{item.code}</strong> · {item.title} — {reason}</span>
                {!restoreLocked && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => { pushItemState(item, "deselected", reason, true); setMsg(fmt(strings.restoredMsg, { code: item.code })); }}>{strings.restoreBtn}</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* §18 — action forms: package-included & trigger-generated render per
          item above; here the inspector adds published configuration templates
          manually. Included ≠ completed: new rows stay open. */}
      {!submitted && (
        <div className={styles.card} style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <h4>{strings.afAddTitle}</h4>
          <p className="t-caption">{strings.afAddHint}</p>
          <div className="row" style={{ gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
            <label className={styles.fld}>
              <span>{strings.afAddPick}</span>
              <select className="select" value={afPick} onChange={e => setAfPick(e.target.value)}>
                <option value="">—</option>
                {actionTemplates.map(t2 => <option key={t2.id} value={t2.id}>{t2.title}</option>)}
              </select>
            </label>
            <button type="button" className="btn btn-secondary" disabled={!afPick} onClick={addManualForm}>{strings.afAddBtn}</button>
          </div>
          {actionTemplates.length === 0 && <p className="t-caption">{strings.afNone}</p>}
          {manualForms.map(f => (
            <div key={f.id} className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "var(--type-compact-size)" }}>{f.title}</span>
              <span className="badge badge-warning">{f.status}</span>
            </div>
          ))}
        </div>
      )}

      {/* §15 — deselection dialog: reason mandatory, plain copy, audited. */}
      {deselecting && !submitted && (
        <Modal
          open
          onClose={() => setDeselecting(null)}
          titleId="item-deselect-title"
          title={fmt(strings.deselectTitle, { code: deselecting.item.code })}
          closeLabel={strings.deselectCancel}
          maxWidth="480px"
          footer={<>
            <button type="button" className="btn btn-secondary" onClick={() => setDeselecting(null)}>{strings.deselectCancel}</button>
            <button type="button" className="btn btn-primary" aria-disabled={!deselecting.reason.trim()} onClick={confirmDeselect}>{strings.deselectConfirm}</button>
          </>}
        >
          <label className={styles.fld}>
            <span>{strings.deselectReason}<span className="req">*</span></span>
            <textarea className="input" rows={2} placeholder={strings.deselectReasonPh} value={deselecting.reason}
              onChange={e => setDeselecting(d => d ? { ...d, reason: e.target.value } : d)} />
          </label>
        </Modal>
      )}

      {/* Violation auto-display — config-driven, non-overridable (M04-142/143/144) */}
      {!submitted && (
        <div className={styles.card} style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <h4>{strings.vioTitle}</h4>
          {implied.length === 0 && invalidatedList.length === 0 ? <p className="t-caption">{strings.vioNone}</p> : implied.map(v => (
            <div key={`${v.itemCode}-${v.code}`} className="alert alert-critical">
              <div>
                <strong>{v.code}</strong> · {v.config?.title ?? ""} · {fmt(strings.vioLevel, { level: v.config?.level ?? "" })} · {v.itemCode}
                {/* §18 / D-018 — penalty singularity fail-closed: a configuration
                    conflict renders the violation WITHOUT a penalty, honestly. */}
                {v.config?.penalty_conflict ? <> · {strings.vioPenaltyConflict}</>
                  : v.config?.penalty_ref ? <> · {fmt(strings.vioPenalty, { ref: v.config.penalty_ref, basis: v.config.legal_basis ?? "" })}</> : null}
                {v.actionFormKey ? (() => {
                  const d = formDefs.find(x => x.key === v.actionFormKey);
                  return d ? <> · {fmt(strings.vioAction, { status: formComplete(d, forms[v.itemId]) ? strings.afComplete : strings.afIncomplete })}</> : null;
                })() : null}
              </div>
            </div>
          ))}
          {/* §18 / D-018 — invalidated candidates stay visible with state
              (audit preserved; never deleted). */}
          {invalidatedList.map(v => (
            <div key={`invalidated-${v.code}`} className="alert alert-immutable" data-state="invalidated">
              <div>
                <strong>{v.code}</strong> · {v.config?.title ?? ""} · {fmt(strings.vioLevel, { level: v.config?.level ?? "" })}
                {" · "}{strings.vioInvalidated}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grouped validation results by section (M04-200/201-lite) */}
      {!submitted && validation && validation.length > 0 && (
        <div className={styles.validation}>
          <strong>{strings.valTitle}</strong>
          <ul>
            {validation.map(g => (
              <li key={g.key}>
                <strong>{g.title}</strong>
                {g.unanswered.length > 0 && <div className="t-caption">{fmt(strings.valUnanswered, { items: g.unanswered.join(", ") })}</div>}
                {g.evidence.length > 0 && <div className="t-caption">{fmt(strings.valEvidence, { items: g.evidence.join(", ") })}</div>}
                {g.forms.length > 0 && <div className="t-caption">{fmt(strings.valForms, { items: g.forms.join(", ") })}</div>}
                {g.findings.length > 0 && <div className="t-caption">{fmt(strings.valFindings, { items: g.findings.join(", ") })}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!submitted && (
        <div className={styles.actionbar}>
          {/* Readiness evaluation (M04-204): submit stays clickable so refusal + grouped blockers surface on tap */}
          <span className="t-caption">{blockCount ? fmt(strings.notReady, { n: blockCount }) : strings.ready}</span>
          <button className="btn btn-primary btn-lg" aria-disabled={blockCount > 0} onClick={submit}>{strings.submitBtn}</button>
        </div>
      )}
      </fieldset>
      {/* DEC-009 — acknowledgement signature gate; the dataURL rides in the queued submit op */}
      {signing && !submitted && (
        <SignaturePad strings={strings.sig} onCancel={() => setSigning(false)} onConfirm={finalizeSubmit} />
      )}
      {/* M04-109/124/147/160 — annotation overlay before enqueue: the flattened image
          becomes the outbox payload, so annotated evidence syncs like any other op */}
      {shot && !submitted && (
        <ImageAnnotator srcB64={shot.b64} mime={shot.mime} strings={strings.annot}
          onCancel={() => setPendingShots(q => q.slice(1))} onConfirm={confirmShot} />
      )}
      {/* J-13 exit/draft: every answer already autosaves to the durable IndexedDB draft
          store the instant it's entered (FND-005) — there is no separate "unsaved buffer"
          to discard, so this shows the REAL sync state honestly rather than fabricating
          a "leave without saving" option the engine doesn't actually implement. */}
      {exiting && !submitted && (
        <Modal
          open
          onClose={() => setExiting(false)}
          titleId="exit-confirm-title"
          title={strings.exitTitle}
          closeLabel={strings.exitCancel}
          maxWidth="420px"
          footer={<>
            <button type="button" className="btn btn-secondary" onClick={() => setExiting(false)}>{strings.exitCancel}</button>
            <button type="button" className="btn btn-primary" onClick={() => router.push("/field")}>{strings.exitConfirm}</button>
          </>}
        >
          <p>{sync === "synced" ? strings.exitSavedSynced : strings.exitSavedLocal}</p>
          {/* Phase 4B / plan §12 — request cancellation from the active session.
              Non-blocking until Operations decides; the workspace locks only on
              approval (D-016). Rendered only when the journey schema probe
              passed — pre-migration there is no active-session cancel path. */}
          {journeySchemaAvailable && !cancelApproved && (
            cancelPending ? (
              <p className="t-caption" style={{ marginBlockStart: "var(--space-3)" }}>{strings.cancelPending}</p>
            ) : (cancelReasons ?? []).length === 0 ? (
              <p className="t-caption" style={{ marginBlockStart: "var(--space-3)" }}>{strings.cancelReasonsMissing}</p>
            ) : (
              <div className="stack" style={{ gap: "var(--space-2)", marginBlockStart: "var(--space-3)", borderBlockStart: "var(--border-w) solid var(--border-subtle)", paddingBlockStart: "var(--space-3)" }}>
                <strong>{strings.cancelHeading}</strong>
                <p className="t-caption">{strings.cancelCaption}</p>
                <label className={styles.fld}><span>{strings.cancelSelectReason}</span>
                  <select className="select" value={cancelReason} onChange={e => setCancelReason(e.target.value)}>
                    <option value="">—</option>
                    {(cancelReasons ?? []).map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                  </select>
                </label>
                <textarea className="input" rows={2} value={cancelComment} onChange={e => setCancelComment(e.target.value)} placeholder={strings.cancelCommentPlaceholder} />
                <button type="button" className="btn btn-danger" onClick={requestCancellation}
                  disabled={cancelBusy || !cancelReason || (cancelReason === "other" && !cancelComment.trim())}>{strings.cancelSubmit}</button>
              </div>
            )
          )}
        </Modal>
      )}
      {/* M04-164 — soft delete requires a reason; the update is captured by the evidence audit trigger */}
      {deleting && !submitted && (
        <Modal
          open
          onClose={() => setDeleting(null)}
          titleId="ev-delete-title"
          title={strings.evDeleteTitle}
          closeLabel={strings.evDeleteCancel}
          maxWidth="480px"
          footer={<>
            <button type="button" className="btn btn-secondary" onClick={() => setDeleting(null)}>{strings.evDeleteCancel}</button>
            <button type="button" className="btn btn-primary" aria-disabled={!deleting.reason.trim()} onClick={confirmDelete}>{strings.evDeleteConfirm}</button>
          </>}
        >
          <label className={styles.fld}>
            <span>{strings.evDeleteReason}<span className="req">*</span></span>
            <textarea className="input" rows={2} placeholder={strings.evDeleteReasonPh} value={deleting.reason}
              onChange={e => setDeleting(d => d ? { ...d, reason: e.target.value } : d)} />
          </label>
        </Modal>
      )}
    </div>
  );
}
