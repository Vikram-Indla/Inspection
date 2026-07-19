"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { local, processOutbox, sha256b64, type SyncState, type Conflict, type OutboxOp } from "@/lib/offline";
import { supabaseBrowser } from "@/lib/supabase";
import {
  type Item, type Answer, type FormDef, type FormDraft, type VioConfig, type Section,
  isVisible, contextFlags, conditionContext, scoreExcluded, computeHealthScore, evidenceLeg, formRequired, formComplete,
  sectionProgress, summarize, impliedViolations, computeBlockers, type SectionBlockers,
} from "./runtime";
import SignaturePad, { type SignaturePadStrings, type SignatureAck } from "./SignaturePad";
import ImageAnnotator, { compressImageFile, type AnnotatorStrings } from "@/components/ImageAnnotator";
import ContextualAiPanel from "@/components/ContextualAiPanel";

type Ins = { id: string; status: string; visit_id: string; package_versions: { definition: { sections: Section[]; action_forms?: FormDef[]; item_snapshot?: Record<string, unknown> } }; submission_versions?: { version_number: number }[]; reviews?: { returned_sections: string[] | null; decision_reason: string | null; decided_at: string | null }[] };
type SResp = { item_id: string; response: Answer | null; updated_at: string };
type SEv = {
  id: string; linked_type: string; linked_id: string; evidence_type: string;
  storage_path?: string | null; captured_at?: string | null;
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
type SVio = { id: string; violation_code_id: string };
type QueuedEvidence = Extract<OutboxOp, { kind: "evidence" }>;
type EvidenceLimits = Record<string, { formats?: string[]; max_mb?: number }>;

// SB19 — every display string (incl. the sync-state LABEL map) is built
// server-side with t() and passed as props; offline logic is untouched.
export type WorkspaceStrings = {
  sync: { [K in SyncState]: string };
  answered: string;
  conflictHead: string; thisDevice: string; server: string; keepMine: string; keepServer: string;
  returnedScope: string; returnedNote: string;
  submittedTitle: string; submittedBody: string;
  lockedSection: string;
  mandatoryPhoto: string; submitBtn: string;
  autoViolation: string; plusActionForm: string; plusPhoto: string;
  evidenceQueued: string; blockers: string; submitting: string; queuedOffline: string; retryNow: string;
  exitBtn: string; exitTitle: string; exitSavedSynced: string; exitSavedLocal: string; exitConfirm: string; exitCancel: string;
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
  valTitle: string; valUnanswered: string; valEvidence: string; valForms: string;
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

export default function Workspace({ inspection, items, serverResponses, serverEvidence, serverForms, serverViolations, serverContext, vioConfig, evidenceLimits, actionDueDays, strings, evidenceUrls, prev, panel, inspectionNo, locale }: {
  inspection: Ins; items: Item[]; serverResponses: SResp[]; serverEvidence: SEv[]; serverForms: SForm[]; serverViolations: SVio[];
  serverContext: Record<string, string>; vioConfig: Record<string, VioConfig>; evidenceLimits: EvidenceLimits; actionDueDays: number; strings: WorkspaceStrings;
  evidenceUrls: Record<string, string>; prev: PrevComparison | null; panel: WorkspacePanel; inspectionNo: string | null; locale: "en" | "ar";
}) {
  const router = useRouter();
  const [sync, setSync] = useState("synced" as SyncState);
  const [detail, setDetail] = useState(undefined as string | undefined);
  const [exiting, setExiting] = useState(false);
  const [answers, setAnswers] = useState(() =>
    Object.fromEntries(serverResponses.filter(r => { return !!r.response; }).map(r => [r.item_id, r.response!])) as { [k: string]: Answer });
  const [ctx, setCtx] = useState(serverContext);
  const [forms, setForms] = useState(() => Object.fromEntries(serverForms.filter(f => !!f.item_id).map(f =>
    [f.item_id!, { owner_name: f.owner_name ?? "", owner_role: f.owner_role ?? "", due_at: f.due_at ? f.due_at.slice(0, 10) : "", required_correction: f.required_correction ?? "" }])) as { [itemId: string]: FormDraft });
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
  const codeById = useMemo(() => Object.fromEntries(Object.values(vioConfig).map(c => [c.id, c.code])), [vioConfig]);
  const [vioIds, setVioIds] = useState(() => {
    const m: { [code: string]: string } = {};
    for (const v of serverViolations) { const code = codeById[v.violation_code_id]; if (code) m[code] = v.id; }
    return m;
  });
  const baseline = useMemo(() => Object.fromEntries(serverResponses.map(r => [r.item_id, r.updated_at])), [serverResponses]);
  const imap = useMemo(() => Object.fromEntries(items.map(i => [i.code, i])), [items]);
  const sections = inspection.package_versions.definition.sections.filter(s => { return !!s.items?.length; });
  const formDefs = useMemo(() => inspection.package_versions.definition.action_forms ?? [], [inspection]);
  const sectionItems = useMemo(() => sections.flatMap(s => s.items ?? []).map(c => imap[c]).filter((i): i is Item => !!i),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [imap]);
  const flags = useMemo(() => contextFlags(sectionItems), [sectionItems]);

  // Latest-state mirrors so async pushes and the reconnect flush never act on stale closures.
  const answersRef = useRef(answers); answersRef.current = answers;
  const ctxRef = useRef(ctx); ctxRef.current = ctx;
  const formsRef = useRef(forms); formsRef.current = forms;
  const vioIdsRef = useRef(vioIds); vioIdsRef.current = vioIds;
  const pending = useRef({ ctx: false, forms: new Set(), vios: new Set() } as { ctx: boolean; forms: Set<string>; vios: Set<string> });
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
  }, [inspection.id]);

  const onState = useCallback((s: SyncState, d?: string) => {
    // A replay started while online can finish after the browser goes offline.
    // Do not let that stale completion overwrite the durable offline state.
    const effective = !navigator.onLine && s !== "offline" ? "offline" : s;
    setSync(effective);
    setDetail(effective === "offline" ? undefined : d);
    local.conflicts().then(setConflicts);
  }, []);
  const refreshQueued = useCallback(async () => {
    const ops = await local.peekAll();
    setQueuedEv(ops.filter((o): o is QueuedEvidence => o.kind === "evidence" && o.inspection_id === inspection.id));
  }, [inspection.id]);
  useEffect(() => {
    const tick = () => { processOutbox(onState); refreshQueued(); flushRef.current(); };
    tick();
    const goOffline = () => onState("offline");
    window.addEventListener("online", tick); window.addEventListener("offline", goOffline);
    const iv = setInterval(tick, 8000);
    return () => { clearInterval(iv); window.removeEventListener("online", tick); window.removeEventListener("offline", goOffline); };
  }, [onState, refreshQueued]);

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
    const { data: existing, error: existingError } = await sb.from("violations").select("id").eq("inspection_id", inspection.id).eq("violation_code_id", cfg.id).maybeSingle();
    if (existingError) { console.error("[field workspace violation read]", existingError.message); setMsg(strings.saveFailed); pending.current.vios.add(code); return null; }
    if (existing?.id) { setVioIds(m => ({ ...m, [code]: existing.id })); pending.current.vios.delete(code); return existing.id; }
    const { data, error } = await sb.from("violations").insert({ inspection_id: inspection.id, violation_code_id: cfg.id, mapping_version: cfg.mapping_version }).select("id").single();
    if (error) { console.error("[field workspace violation]", error.message); setMsg(strings.saveFailed); pending.current.vios.add(code); return null; }
    setVioIds(m => ({ ...m, [code]: data.id })); pending.current.vios.delete(code);
    return data.id;
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
    flushMedia();
  };

  async function answer(item: Item, patch: Answer) {
    const next = { ...answersRef.current[item.id], ...patch };
    setAnswers(a => ({ ...a, [item.id]: next }));                        // instant local state
    await local.saveDraft(inspection.id, item.id, next);                 // durable draft (autosave — FND-005)
    if (next.value) {                                                    // note rides with the answer; note-only stays a local draft
      await local.enqueue({ kind: "response", inspection_id: inspection.id, item_id: item.id, response: next, baseline_updated_at: baseline[item.id] ?? null, queued_at: new Date().toISOString() });
      processOutbox(onState);
    }
    const nc = next.value ? item.response_model.mapping?.[next.value] : undefined;
    if (nc?.violation) {
      setMsg(fmt(strings.autoViolation, { code: item.code, violation: nc.violation, actionForm: nc.action_form ? strings.plusActionForm : "", photo: item.evidence_rule?.mandatory ? strings.plusPhoto : "" }));
      ensureViolation(nc.violation);                                     // runtime violation record (M04-142)
    }
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
    processOutbox(onState);
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
  const progress = sectionProgress(sections, imap, answers, runtimeCtx);
  const totals = progress.reduce((t, p) => ({ a: t.a + p.answered, b: t.b + p.total }), { a: 0, b: 0 });
  const overallPct = totals.b ? Math.round(100 * totals.a / totals.b) : 100;
  const summary = summarize(sections, imap, answers, runtimeCtx, activeEvidence.length + queuedEv.length);
  const healthScore = computeHealthScore(sectionItems, answers, runtimeCtx);
  const implied = impliedViolations(sectionItems, answers, runtimeCtx, vioConfig);
  const liveBlockers = computeBlockers(sections, imap, answers, runtimeCtx, evidencePerItem, forms, formDefs);
  const blockCount = liveBlockers.reduce((n, g) => n + g.unanswered.length + g.evidence.length + g.forms.length, 0);

  async function submit() {
    // Full readiness re-validation: answers + mandatory evidence + blocking forms (M04-199/204/208).
    const submitCtx = conditionContext(sectionItems, answersRef.current, ctxRef.current);
    const blockers = computeBlockers(sections, imap, answersRef.current, submitCtx, evidencePerItem, formsRef.current, formDefs);
    if (blockers.length) {
      setValidation(blockers);
      const missing = blockers.flatMap(b => b.unanswered);
      setMsg(missing.length ? fmt(strings.blockers, { items: missing.join(", ") }) : fmt(strings.notReady, { n: blockers.reduce((n, g) => n + g.evidence.length + g.forms.length, 0) }));
      return;
    }
    setValidation(null);
    setSigning(true);   // DEC-009: acknowledgement signature captured at submit; enqueue happens in finalizeSubmit
  }

  async function finalizeSubmit(ack: SignatureAck) {
    setSigning(false);
    const key = crypto.randomUUID();
    const nextVersion = Math.max(0, ...(inspection.submission_versions ?? []).map(s => s.version_number)) + 1;
    const byCode = (id: string) => items.find(i => i.id === id)?.code ?? id;
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
      action_forms: Object.entries(forms).map(([itemId, draft]) => {
        const item = items.find(i => i.id === itemId);
        if (!item) return null;
        const def = formRequired(item, answers[itemId]?.value, formDefs);
        return def ? { item: item.code, form_type: def.key, ...draft, status: formComplete(def, draft) ? "complete" : "open" } : null;
      }).filter(Boolean),
      health_score: healthScore,
      evidence: { total: activeEvidence.length + queuedEv.length, by_item_and_type: Object.fromEntries(Object.entries(evidencePerItem).map(([id, counts]) => [byCode(id), counts])) },
      submitted_offline: !navigator.onLine,
    };
    await local.enqueue({ kind: "submit", inspection_id: inspection.id, version_number: nextVersion, snapshot, idempotency_key: key, acknowledgement: { name: ack.name, signed: true, ts: ack.signed_at, signed_at: ack.signed_at, signature_data_url: ack.signature_data_url }, queued_at: new Date().toISOString() });
    setSubmitted(true);
    setMsg(navigator.onLine ? fmt(strings.submitting, { v: nextVersion }) : strings.queuedOffline);
    processOutbox(onState);
  }

  const tone = sync === "synced" ? "ax-sync--synced" : sync === "offline" ? "ax-sync--offline" : sync === "syncing" ? "ax-sync--syncing" : sync === "conflict" ? "ax-sync--conflict" : sync === "failed" ? "ax-sync--failed" : "ax-sync--pending";
  return (
    <div className="ax-stack" style={{ gap: "var(--ax-space-300)" }}>
      <div className="ax-row" style={{ justifyContent: "space-between", position: "sticky", insetBlockStart: 0, zIndex: 10, background: "var(--ax-color-canvas)", paddingBlock: "var(--ax-space-100)" }}>
        <span className="ax-row" style={{ gap: "var(--ax-space-100)", alignItems: "center" }}>
          <span className={`ax-sync ${tone}`}>{strings.sync[sync]}{detail ? ` · ${detail}` : ""}</span>
          {sync === "failed" && (
            <button type="button" className="ax-btn ax-btn--subtle" onClick={() => processOutbox(onState)}>{strings.retryNow}</button>
          )}
        </span>
        <span className="ax-row" style={{ gap: "var(--ax-space-150)", alignItems: "center" }}>
          <span className="ax-caption ax-numeric">{inspectionNo ? `${inspectionNo} · ` : ""}{fmt(strings.answered, { a: totals.a, b: totals.b })} · {fmt(strings.progress, { pct: overallPct })}</span>
          {!submitted && <button type="button" className="ax-btn ax-btn--subtle" onClick={() => setExiting(true)}>{strings.exitBtn}</button>}
        </span>
      </div>
      {msg && <div className="ax-banner"><div>{msg}</div></div>}

      {/* DEC-A — Figma wizard-shell parity as a guided presentation over the existing
          config-driven engine: pure anchor navigation over the unchanged section list
          below, no new state, no altered validation/submit/RLS/offline behaviour. */}
      {!submitted && sections.length > 1 && (
        <nav className="ax-tabs" role="tablist" aria-label={strings.panelTitle} style={{ overflowX: "auto", flexWrap: "nowrap" }}>
          {sections.map(s => (
            <a key={s.key} role="tab" aria-selected="false" href={`#ax-section-${s.key}`} style={{ whiteSpace: "nowrap", textDecoration: "none" }}>{s.title}</a>
          ))}
        </nav>
      )}

      {/* M04-054 / M04-068 — collapsible Factory/Visit context panel with expandable cards,
          reachable from every wizard step (sticky-header sibling at the top of the workspace) */}
      <details className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <summary style={{ cursor: "pointer", font: "var(--ax-text-field)", fontWeight: 600 }}>
          {strings.panelTitle}{inspectionNo ? <span className="ax-numeric"> · {inspectionNo}</span> : null}
        </summary>
        <div className="ax-grid-2" style={{ marginBlockStart: "var(--ax-space-200)" }}>
          <details open className="ax-panel" style={{ padding: "var(--ax-space-200)", border: "1px solid var(--ax-color-border)" }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>{strings.panelFactory}</summary>
            <div className="ax-stack" style={{ gap: "var(--ax-space-100)", marginBlockStart: "var(--ax-space-150)" }}>
              <div><strong>{panel.factory.name}</strong></div>
              <div className="ax-row" style={{ justifyContent: "space-between" }}><span className="ax-caption">{strings.panelCode}</span><span className="ax-numeric">{panel.factory.code ?? "—"}</span></div>
              <div className="ax-row" style={{ justifyContent: "space-between" }}><span className="ax-caption">{strings.panelLicense}</span><span className="ax-numeric">{panel.factory.license ?? "—"}</span></div>
              <div className="ax-row" style={{ justifyContent: "space-between" }}><span className="ax-caption">{strings.panelRegion}</span><span>{panel.factory.region ?? "—"} · {panel.factory.city ?? "—"}</span></div>
              <div className="ax-row" style={{ justifyContent: "space-between" }}><span className="ax-caption">{strings.panelActivity}</span><span>{panel.factory.activity ?? "—"}</span></div>
            </div>
          </details>
          <details open className="ax-panel" style={{ padding: "var(--ax-space-200)", border: "1px solid var(--ax-color-border)" }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>{strings.panelVisit}</summary>
            <div className="ax-stack" style={{ gap: "var(--ax-space-100)", marginBlockStart: "var(--ax-space-150)" }}>
              <div className="ax-row" style={{ justifyContent: "space-between" }}><span className="ax-caption">{strings.panelWindow}</span><span className="ax-numeric">{panel.visit.window_start.slice(0, 16).replace("T", " ")} → {panel.visit.window_end.slice(11, 16)}</span></div>
              <div className="ax-row" style={{ justifyContent: "space-between" }}><span className="ax-caption">{strings.panelTypeMode}</span><span>{(strings.enumLabels[panel.visit.visit_type] ?? panel.visit.visit_type)} · {(strings.enumLabels[panel.visit.execution_mode] ?? panel.visit.execution_mode)}</span></div>
              <div className="ax-row" style={{ justifyContent: "space-between" }}><span className="ax-caption">{strings.panelPkg}</span><span>{panel.pkg.code} <span className="ax-version">{panel.pkg.label}</span></span></div>
            </div>
          </details>
        </div>
        {/* M04-136/137 — source of the previous-inspection comparison shown per item below */}
        {prev && <p className="ax-caption" style={{ marginBlockStart: "var(--ax-space-150)" }}>{fmt(strings.prevSource, { ref: prev.label, date: prev.date ?? "—" })}</p>}
      </details>
      {conflicts.map(c => (
        <div key={c.key} className="ax-conflict">
          <div className="ax-conflict__head">{fmt(strings.conflictHead, { code: items.find(i => i.id === c.item_id)?.code ?? "" })}</div>
          <div className="ax-conflict__grid">
            <div className="ax-conflict__side"><h5>{strings.thisDevice}</h5><p>{JSON.stringify(c.local)}</p></div>
            <div className="ax-conflict__side"><h5>{strings.server}</h5><p>{JSON.stringify(c.server)}</p></div>
          </div>
          <div className="ax-conflict__foot">
            <button className="ax-btn ax-btn--secondary" onClick={async () => { const it = items.find(i => i.id === c.item_id)!; await local.resolveConflict(c.key); await answer(it, c.local as Answer); }}>{strings.keepMine}</button>
            <button className="ax-btn" onClick={async () => { setAnswers(a => ({ ...a, [c.item_id]: c.server as Answer })); await local.resolveConflict(c.key); setConflicts(await local.conflicts()); }}>{strings.keepServer}</button>
          </div>
        </div>
      ))}
      {inspection.status === "returned" && (() => {
        const lastReturn = (inspection.reviews ?? []).filter(r => { return !!r.decided_at && !!r.returned_sections; }).slice(-1)[0];
        return lastReturn ? <div className="ax-banner ax-banner--warning"><div><strong>{fmt(strings.returnedScope, { sections: lastReturn.returned_sections!.join(", ") })}</strong> {lastReturn.decision_reason} · {strings.returnedNote}</div></div> : null;
      })()}
      {submitted && <div className="ax-banner ax-banner--immutable"><div><strong>{strings.submittedTitle}</strong> {strings.submittedBody}</div></div>}

      {/* Live summary — answered / pending / compliant / non-compliant / violations / evidence (M04-149) */}
      {!submitted && (
        <div className="ax-row" style={{ flexWrap: "wrap", gap: "var(--ax-space-100)", alignItems: "center" }}>
          <span className="ax-overline">{strings.summaryTitle}</span>
          <span className="ax-badge">{strings.sumAnswered} <span className="ax-numeric">{summary.answered}</span></span>
          <span className="ax-badge">{strings.sumPending} <span className="ax-numeric">{summary.pending}</span></span>
          <span className="ax-badge">{strings.sumCompliant} <span className="ax-numeric">{summary.compliant}</span></span>
          <span className={`ax-badge ${summary.nonCompliant ? "ax-badge--critical" : ""}`}>{strings.sumNonCompliant} <span className="ax-numeric">{summary.nonCompliant}</span></span>
          <span className={`ax-badge ${summary.violations ? "ax-badge--critical" : ""}`}>{strings.sumViolations} <span className="ax-numeric">{summary.violations}</span></span>
          <span className="ax-badge">{strings.sumEvidence} <span className="ax-numeric">{summary.evidence}</span></span>
        </div>
      )}

      {/* Site conditions — flags feeding conditional.visible_when (M04-119); persisted on the inspection row */}
      {!submitted && flags.length > 0 && (
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
          <h4>{strings.ctxTitle}</h4>
          <p className="ax-caption">{strings.ctxHint}</p>
          <div className="ax-row" style={{ flexWrap: "wrap", gap: "var(--ax-space-300)" }}>
            {flags.map(k => (
              <div key={k} className="ax-row" style={{ gap: "var(--ax-space-150)", alignItems: "center" }}>
                <span style={{ font: "var(--ax-text-field)" }}>{strings.ctxLabels[k] ?? k}</span>
                <div className="ax-segmented">
                  <button aria-pressed={ctx[k] === "yes"} onClick={() => saveCtx(k, "yes")}>{strings.ctxYes}</button>
                  <button aria-pressed={ctx[k] === "no"} onClick={() => saveCtx(k, "no")}>{strings.ctxNo}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!submitted && sections.map(s => {
        if (inspection.status === "returned") {
          const lastReturn = (inspection.reviews ?? []).filter(r => { return !!r.decided_at && !!r.returned_sections; }).slice(-1)[0];
          if (lastReturn && !lastReturn.returned_sections!.includes(s.key)) {
            return <div key={s.key} className="ax-surface" style={{ padding: "var(--ax-space-300)", opacity: .6 }}><h4>{s.title} 🔒</h4><p className="ax-caption">{strings.lockedSection}</p></div>;
          }
        }
        const sp = progress.find(p => p.key === s.key)!;
        return (
        <div key={s.key} id={`ax-section-${s.key}`} className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)", scrollMarginBlockStart: "var(--ax-space-600)" }}>
          <div className="ax-row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
            <h4>{s.title}</h4>
            <span className="ax-caption ax-numeric">{sp.answered}/{sp.total} · {fmt(strings.progress, { pct: sp.pct })}</span>
          </div>
          {/* Per-section progress (M04-081) */}
          <div style={{ blockSize: 4, borderRadius: 2, background: "var(--ax-color-border)" }} role="progressbar" aria-valuenow={sp.pct} aria-valuemin={0} aria-valuemax={100}>
            <div style={{ blockSize: 4, borderRadius: 2, inlineSize: `${sp.pct}%`, background: "var(--ax-color-primary)" }} />
          </div>
          {(s.items ?? []).map(code => {
            const it = imap[code]; if (!it) return null;
            if (!isVisible(it, runtimeCtx)) return null;                 // item-answer + site conditional visibility (M04-119/M09-021)
            const val = answers[it.id];
            const isDate = (it.response_model.responses ?? []).includes("value_date");
            const leg = evidenceLeg(it, val?.value);
            const evCount = leg ? (evidencePerItem[it.id]?.[leg.type] ?? 0) : 0;
            const thumbs = queuedEv.filter(q => q.linked_type === "item" && q.linked_id === it.id && q.mime.startsWith("image"));
            const def = formRequired(it, val?.value, formDefs);
            const draft = forms[it.id];
            const complete = def ? formComplete(def, draft) : false;
            const conditional = !!it.response_model.conditional?.visible_when;
            return (
              <div key={code} className={`ipad-q ${val?.value ? "is-answered" : ""}`} style={{ border: "1px solid var(--ax-color-border)", borderRadius: "var(--ax-radius-large)", padding: "var(--ax-space-300)", borderInlineStart: val?.value ? "4px solid var(--ax-color-success)" : undefined, display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
                <div className="ax-row" style={{ flexWrap: "wrap", gap: "var(--ax-space-100)", alignItems: "baseline" }}>
                  <p style={{ font: "var(--ax-text-field)", fontWeight: 600 }}>{code} · {it.title}</p>
                  {it.clause && <span className="ax-caption">{it.clause.legal_source ?? ""} §{it.clause.clause_ref}</span>}
                  {conditional && <span className="ax-lozenge ax-lozenge--info">{strings.conditionalBadge}</span>}
                </div>
                {it.guidance && <p className="ax-caption">💡 {strings.guidanceLabel}: {it.guidance}</p>}
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
                  <p className="ax-caption">
                    ↩ {fmt(strings.prevLine, {
                      value: prev.answers[it.id] ? (strings.enumLabels[prev.answers[it.id]] ?? prev.answers[it.id].replace(/_/g, " ")) : strings.prevNoAnswer,
                      n: prev.evidence[it.id] ?? 0,
                    })}
                  </p>
                )}
                <div className="ax-row" style={{ flexWrap: "wrap" }}>
                  {isDate ? (
                    <label className="ax-field">
                      <span className="ax-field__label">{strings.dateLabel}</span>
                      <input className="ax-input" type="date" value={val?.date ?? ""} onChange={e => e.target.value && answer(it, { value: e.target.value, date: e.target.value })} />
                    </label>
                  ) : (it.response_model.responses ?? []).map(r => (
                    <button key={r} className="ax-btn ax-btn--field" style={{ background: val?.value === r ? (r === "non_compliant" ? "var(--ax-color-critical)" : "var(--ax-color-primary)") : "var(--ax-color-surface)", color: val?.value === r ? "var(--ax-color-inverse-text)" : "var(--ax-color-text)", border: "1.5px solid var(--ax-color-border)" }}
                      onClick={() => answer(it, { value: r })}>{strings.enumLabels[r] ?? r.replace(/_/g, " ")}</button>
                  ))}
                  {leg?.applies && leg.type !== "comment" && (
                    <label className="ax-btn ax-btn--field ax-btn--secondary" style={{ cursor: "pointer" }}>
                      {val?.value === "non_compliant" && leg.mandatory ? strings.mandatoryPhoto : (leg.type === "document" ? strings.evAddDoc : strings.evAdd)}
                      <input type="file" accept={acceptFor(leg.type)} multiple hidden onChange={e => { if (e.target.files?.length) { attachFiles(it, e.target.files); e.target.value = ""; } }} />
                    </label>
                  )}
                  {leg?.applies && leg.type === "comment" && (
                    <span className="ax-row" style={{ gap: "var(--ax-space-100)", flexWrap: "wrap" }}>
                      <label className="ax-field">
                        <span className="ax-field__label">{strings.noteLabel}</span>
                        <textarea className="ax-input" value={commentDrafts[it.id] ?? ""} onChange={e => setCommentDrafts(current => ({ ...current, [it.id]: e.target.value }))} />
                      </label>
                      <button type="button" className="ax-btn ax-btn--field ax-btn--secondary" disabled={!commentDrafts[it.id]?.trim()} onClick={() => attachComment(it)}>{strings.evAdd}</button>
                    </span>
                  )}
                  {leg?.applies && leg.mandatory && (
                    <span className={`ax-lozenge ${evCount >= leg.min ? "ax-lozenge--success" : "ax-lozenge--warning"}`}>{fmt(strings.evCount, { n: evCount, min: leg.min })}</span>
                  )}
                </div>
                {val?.value && scoreExcluded(it, val.value) && <p className="ax-caption">{strings.naExcluded}</p>}
                {leg?.applies && leg.mandatory && evCount < leg.min && <p className="ax-caption" style={{ color: "var(--ax-color-critical)" }}>{fmt(strings.evRequired, { min: leg.min })}</p>}
                {/* F2 — evidence list per item: synced thumbnails + REPLACE (archive, M04-163)
                    + DELETE (soft, audited, M04-164); queued captures ride alongside unsynced */}
                {(() => {
                  const rows = serverEvidence.filter(ev2 => ev2.linked_type === "item" && ev2.linked_id === it.id && !ev2.deleted_at && !evState[ev2.id]?.deleted);
                  if (!rows.length && !thumbs.length) return null;
                  return (
                    <div className="ax-evidence-grid">
                      {rows.map(ev2 => {
                        const archived = !!ev2.archived_at || !!evState[ev2.id]?.archived;
                        const url = evidenceUrls[ev2.id];
                        return (
                          <div key={ev2.id} className={`ax-evidence ${archived ? "is-quarantined" : ""}`}>
                            {url
                              ? <img className="ax-evidence__thumb" src={url} alt={strings.evSyncedAlt} />
                              : <div className="ax-evidence__thumb" aria-hidden="true">{ev2.evidence_type === "document" ? "📄" : "📷"}</div>}
                            <div className="ax-evidence__meta">
                              <span className="ax-numeric">{ev2.captured_at ? ev2.captured_at.slice(0, 16).replace("T", " ") : ""}</span>
                              {archived
                                ? <span className="ax-lozenge ax-lozenge--warning">{strings.evArchived}</span>
                                : (
                                  <span className="ax-row" style={{ gap: "var(--ax-space-050)", flexWrap: "wrap" }}>
                                    <label className="ax-btn ax-btn--subtle" style={{ cursor: "pointer" }}>
                                      {strings.evReplace}
                                      <input type="file" accept={acceptFor(leg?.type ?? "photo")} hidden
                                        onChange={ie => { if (ie.target.files?.length) { attachFiles(it, ie.target.files, ev2.id); ie.target.value = ""; } }} />
                                    </label>
                                    <button className="ax-btn ax-btn--subtle" onClick={() => setDeleting({ ev: ev2, reason: "" })}>{strings.evDelete}</button>
                                  </span>
                                )}
                            </div>
                          </div>
                        );
                      })}
                      {thumbs.map((q, i) => (
                        <div key={i} className="ax-evidence is-unsynced">
                          <img className="ax-evidence__thumb" src={`data:${q.mime};base64,${q.data_b64}`} alt={strings.evQueuedAlt} />
                        </div>
                      ))}
                    </div>
                  );
                })()}
                <label className="ax-field">
                  <span className="ax-field__label">{strings.noteLabel}</span>
                  <textarea className="ax-textarea" rows={2} placeholder={strings.notePlaceholder} value={val?.note ?? ""} onChange={e => saveNote(it, e.target.value)} onBlur={() => flushNote(it)} />
                </label>
                {/* Action form runtime (M04-171..184): instantiated from the package's form template */}
                {def && (
                  <div className="ax-panel" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-150)", borderInlineStart: complete ? "4px solid var(--ax-color-success)" : "4px solid var(--ax-color-critical)" }}>
                    <div className="ax-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                      <strong>{def.title}</strong>
                      <span className={`ax-lozenge ${complete ? "ax-lozenge--success" : "ax-lozenge--critical"}`}>{complete ? strings.afComplete : strings.afIncomplete}</span>
                    </div>
                    {def.blocking && !complete && <p className="ax-caption">{strings.afBlocking}</p>}
                    <div className="ax-grid-2">
                      {def.fields.map(f => (
                        <label key={f} className="ax-field" style={f === "required_correction" ? { gridColumn: "1 / -1" } : undefined}>
                          <span className="ax-field__label">{strings.afFieldLabels[f] ?? f}<span className="ax-req">*</span></span>
                          {f === "required_correction"
                            ? <textarea className="ax-textarea" rows={2} value={draft?.[f] ?? ""} onChange={e => editForm(it, f, e.target.value)} onBlur={() => pushForm(it, def)} />
                            : <input className="ax-input" type={f === "due_at" ? "date" : "text"} value={draft?.[f] ?? ""} onChange={e => editForm(it, f, e.target.value)} onBlur={() => pushForm(it, def)} />}
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

      {/* Violation auto-display — config-driven, non-overridable (M04-142/143/144) */}
      {!submitted && (
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
          <h4>{strings.vioTitle}</h4>
          {implied.length === 0 ? <p className="ax-caption">{strings.vioNone}</p> : implied.map(v => (
            <div key={`${v.itemCode}-${v.code}`} className="ax-banner ax-banner--critical">
              <div>
                <strong>{v.code}</strong> · {v.config?.title ?? ""} · {fmt(strings.vioLevel, { level: v.config?.level ?? "" })} · {v.itemCode}
                {v.config?.penalty_ref ? <> · {fmt(strings.vioPenalty, { ref: v.config.penalty_ref, basis: v.config.legal_basis ?? "" })}</> : null}
                {v.actionFormKey ? (() => {
                  const d = formDefs.find(x => x.key === v.actionFormKey);
                  return d ? <> · {fmt(strings.vioAction, { status: formComplete(d, forms[v.itemId]) ? strings.afComplete : strings.afIncomplete })}</> : null;
                })() : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grouped validation results by section (M04-200/201-lite) */}
      {!submitted && validation && validation.length > 0 && (
        <div className="ax-validation">
          <strong>{strings.valTitle}</strong>
          <ul>
            {validation.map(g => (
              <li key={g.key}>
                <strong>{g.title}</strong>
                {g.unanswered.length > 0 && <div className="ax-caption">{fmt(strings.valUnanswered, { items: g.unanswered.join(", ") })}</div>}
                {g.evidence.length > 0 && <div className="ax-caption">{fmt(strings.valEvidence, { items: g.evidence.join(", ") })}</div>}
                {g.forms.length > 0 && <div className="ax-caption">{fmt(strings.valForms, { items: g.forms.join(", ") })}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!submitted && (
        <div className="ax-row" style={{ justifyContent: "flex-end", alignItems: "center", gap: "var(--ax-space-200)" }}>
          {/* Readiness evaluation (M04-204): submit stays clickable so refusal + grouped blockers surface on tap */}
          <span className="ax-caption">{blockCount ? fmt(strings.notReady, { n: blockCount }) : strings.ready}</span>
          <button className="ax-btn ax-btn--prominent ax-btn--field" aria-disabled={blockCount > 0} onClick={submit}>{strings.submitBtn}</button>
        </div>
      )}
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
        <div className="ax-modal-backdrop" role="dialog" aria-modal="true" aria-label={strings.exitTitle}>
          <div className="ax-modal" style={{ inlineSize: "min(420px, 100%)" }}>
            <div className="ax-modal__header"><h3>{strings.exitTitle}</h3></div>
            <div className="ax-modal__body">
              <p>{sync === "synced" ? strings.exitSavedSynced : strings.exitSavedLocal}</p>
            </div>
            <div className="ax-modal__footer">
              <button className="ax-btn ax-btn--secondary" onClick={() => setExiting(false)}>{strings.exitCancel}</button>
              <button className="ax-btn ax-btn--prominent" onClick={() => router.push("/field")}>{strings.exitConfirm}</button>
            </div>
          </div>
        </div>
      )}
      {/* M04-164 — soft delete requires a reason; the update is captured by the evidence audit trigger */}
      {deleting && !submitted && (
        <div className="ax-modal-backdrop" role="dialog" aria-modal="true" aria-label={strings.evDeleteTitle}>
          <div className="ax-modal" style={{ inlineSize: "min(480px, 100%)" }}>
            <div className="ax-modal__header"><h3>{strings.evDeleteTitle}</h3></div>
            <div className="ax-modal__body">
              <label className="ax-field">
                <span className="ax-field__label">{strings.evDeleteReason}<span className="ax-req">*</span></span>
                <textarea className="ax-textarea" rows={2} placeholder={strings.evDeleteReasonPh} value={deleting.reason}
                  onChange={e => setDeleting(d => d ? { ...d, reason: e.target.value } : d)} />
              </label>
            </div>
            <div className="ax-modal__footer">
              <button className="ax-btn ax-btn--secondary" onClick={() => setDeleting(null)}>{strings.evDeleteCancel}</button>
              <button className="ax-btn ax-btn--prominent" aria-disabled={!deleting.reason.trim()} onClick={confirmDelete}>{strings.evDeleteConfirm}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
