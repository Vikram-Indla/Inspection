"use client";
// M04-095..114 · M04-190 — Factory-information verification module (SCR-IPAD-630/640/650).
// Every source-owned factory attribute renders as SOURCE VALUE (Senaei) vs
// OBSERVED VALUE. Confirming marks the field Verified (M04-104); entering a
// differing value marks it Updated (M04-105). Checks persist through the
// offline outbox (additive `factory_check` op — engine semantics untouched);
// evidence links to the exact field via linked_type 'factory_field' with a
// deterministic linked_id (M04-108), and photos can be annotated before
// queueing so the annotated copy rides with the original (M04-109).
// Senaei data is NEVER written back (FND-007 / M04-112).
import { useEffect, useMemo, useRef, useState } from "react";
import { useSubmittedInSession } from "./submissionLock";
import { localForUser, processOutbox, sha256b64, type OutboxOp, type SyncState } from "@/lib/offline";
import Modal from "@/components/Modal";
import styles from "./factory-verification.module.css";

type QueuedEvidence = Extract<OutboxOp, { kind: "evidence" }>;
type CheckState = { id: string; field_key: string; source_value: string | null; observed_value: string | null; status: "verified" | "updated"; evidence_note: string | null };

export type FactoryField = { key: string; label: string; source: string | null };
export type FactoryProductRow = { name: string; hs_code: string | null; unit: string | null; annual_capacity: number | null; is_primary: boolean };
export type FactoryMaterialRow = { name: string; source: string; hs_code: string | null };
export type FactoryLicense = { reference_no: string | null; valid_from: string | null; valid_to: string | null } | null;
export type FactoryFieldEvidence = { linked_id: string };
export type EvidenceLimits = Record<string, { formats?: string[]; max_mb?: number }>;

export type FactoryVerificationStrings = {
  title: string; hint: string; sourceTag: string;
  colField: string; colSource: string; colObserved: string; colStatus: string; colEvidence: string;
  verifyBtn: string; verified: string; updated: string; unchecked: string;
  observedPlaceholder: string; noteLabel: string; notePlaceholder: string; noteHeld: string;
  changeCounter: string; noChanges: string;
  reviewTitle: string; reviewEmpty: string; before: string; after: string;
  evAttach: string; evCount: string; evQueued: string; evTooLarge: string; evBadFormat: string;
  annotateTitle: string; annotateHint: string; annotateSave: string; annotateSkip: string; annotateClear: string; annotateCancel: string;
  loadError: string; syncFailed: string; retry: string; savedLocal: string; readOnly: string;
  licenseTitle: string; licRef: string; licIssue: string; licExpiry: string; licNone: string;
  productsTitle: string; productsEmpty: string; colProduct: string; colHs: string; colCapacity: string; primaryTag: string;
  materialsTitle: string; materialsEmpty: string; colMaterial: string; colMatSource: string; srcLocal: string; srcImported: string;
  // SAQEEL Field Establishment File — Factory-360 snapshot + section chrome.
  snapshotTitle: string; snapshotAdvisory: string; riskScore: string; riskUnknown: string;
  drafts: string; pendingSync: string; licensesDocs: string;
  incidentTitle: string; incidentDesc: string; incidentLog: string;
  inspectionItems: string;
  // Pending-integration scaffolding (design structure, not yet wired to a
  // governed source; captured values are NOT persisted).
  pendingIntegration: string; pendingCaption: string; selectPlaceholder: string;
  estDataTitle: string;
  spatialAuth: string; spatialAuthModon: string; optOther: string;
  energyType: string; energyGas: string; energyElectricity: string;
  estStatus: string; estStatusProduction: string; estStatusClosed: string;
  prodStatus: string; prodContinuous: string; prodNonContinuous: string;
  closureJustification: string; closureJustificationPh: string;
  closingAuthority: string; authCivilDefense: string; authMunicipality: string; authModon: string;
  exportsProducts: string; optYes: string; optNo: string;
  contactsTitle: string; contactLabel: string; contactDelete: string; addContact: string;
  cName: string; cTitle: string; cId: string; cMobile: string; cEmail: string;
  workforceTitle: string; machinesTitle: string; spareTitle: string;
  shift1: string; shift2: string; shift3: string; totalLabel: string; workerUnit: string;
  itemCheck1: string; itemCheck2: string; itemCheck3: string;
  categoryPending: string;
  // Presentational workflow step (Factory-360 header).
  stepBadge: string;
  // Factory-360 violation history — no governed factory-scoped source yet.
  violationHistory: string; violationHistoryPending: string;
  // Standalone visit-notes scaffold (no governed visit-note binding yet).
  visitNotesTitle: string; visitNoteLabel: string; visitNotePlaceholder: string;
  // Workforce roster scaffold (no governed shift/type-count source).
  workerTypeLabel: string; workerTypePh: string; addWorkerRow: string; grandTotal: string; rosterEmpty: string;
};

const fmt = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k) => String(vars[k] ?? m));

/** Deterministic per-(inspection, field) UUID — evidence.linked_id === check id (M04-108). */
async function deterministicId(inspectionId: string, fieldKey: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${inspectionId}:factory_field:${fieldKey}`);
  const h = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  const hex = Array.from(h.slice(0, 16)).map(b => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

// ---------- M04-109 — image annotation (draw over the photo; save annotated + original) ----------
function AnnotateModal({ file, strings, onDone, onCancel }: {
  file: { name: string; mime: string; b64: string };
  strings: FactoryVerificationStrings;
  onDone: (annotatedB64: string | null) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const baseRef = useRef<HTMLImageElement | null>(null);
  const drawing = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const [inked, setInked] = useState(false);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const img = new Image();
    img.onload = () => {
      const maxW = Math.min(640, img.width);
      const scale = maxW / img.width;
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      const g = c.getContext("2d"); if (!g) return;
      g.drawImage(img, 0, 0, c.width, c.height);
      g.lineWidth = 3; g.lineCap = "round"; g.lineJoin = "round";
      // Annotation ink from the design system — never a bare color.
      g.strokeStyle = getComputedStyle(c).getPropertyValue("--status-critical").trim();
      baseRef.current = img;
    };
    img.src = `data:${file.mime};base64,${file.b64}`;
  }, [file]);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * (e.currentTarget.width / rect.width), y: (e.clientY - rect.top) * (e.currentTarget.height / rect.height) };
  };
  function down(e: React.PointerEvent<HTMLCanvasElement>) { e.currentTarget.setPointerCapture(e.pointerId); drawing.current = true; last.current = pos(e); }
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const g = e.currentTarget.getContext("2d"); if (!g) return;
    const p = pos(e);
    g.beginPath(); g.moveTo(last.current.x, last.current.y); g.lineTo(p.x, p.y); g.stroke();
    last.current = p;
    if (!inked) setInked(true);
  }
  function up() { drawing.current = false; }
  function clear() {
    const c = canvasRef.current, img = baseRef.current; if (!c || !img) return;
    const g = c.getContext("2d"); if (!g) return;
    g.drawImage(img, 0, 0, c.width, c.height);
    setInked(false);
  }
  function save() {
    const c = canvasRef.current; if (!c) return;
    onDone(inked ? c.toDataURL("image/png").split(",")[1] : null);
  }
  return (
    <Modal
      open
      onClose={onCancel}
      titleId="factory-annotate-title"
      title={strings.annotateTitle}
      closeLabel={strings.annotateCancel}
      maxWidth="700px"
      footer={<>
        <button type="button" className="btn btn-ghost" onClick={clear}>{strings.annotateClear}</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>{strings.annotateCancel}</button>
        <button type="button" className="btn btn-secondary" onClick={() => onDone(null)}>{strings.annotateSkip}</button>
        <button type="button" className="btn btn-primary" aria-disabled={!inked} onClick={save}>{strings.annotateSave}</button>
      </>}
    >
      <p className="t-caption">{strings.annotateHint}</p>
      <canvas ref={canvasRef} className={styles.canvas} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} />
    </Modal>
  );
}

export default function FactoryVerification({ inspectionId, fields, license, products, materials, initialChecks, checksLoadError, serverFieldEvidence, evidenceLimits, readOnly: serverReadOnly, strings, userId, riskScore, riskBand, riskBandLabel, incidentHref }: {
  inspectionId: string;
  userId: string;
  fields: FactoryField[];
  license: FactoryLicense;
  products: FactoryProductRow[];
  materials: FactoryMaterialRow[];
  initialChecks: CheckState[];
  checksLoadError: string | null;
  serverFieldEvidence: FactoryFieldEvidence[];
  evidenceLimits: EvidenceLimits;
  readOnly: boolean;
  strings: FactoryVerificationStrings;
  // Factory-360 snapshot — governed risk leg (Health≠Risk: no health score).
  riskScore: number | null;
  riskBand: string | null;
  riskBandLabel: string | null;
  // Mid-visit incident logging routes to the real incident-reports screen.
  incidentHref: string;
}) {
  // CR-205/242/264/299 — immutable after submission. The server-computed lock
  // (ins.status !== "in_progress") cannot see a submit that happened in this
  // session, because submit enqueues to the outbox without a server re-render.
  // The session latch closes that window; either source locking is enough, and
  // the latch never unlocks.
  const submittedInSession = useSubmittedInSession(inspectionId);
  const readOnly = serverReadOnly || submittedInSession;

  const local = useMemo(() => localForUser(userId), [userId]);
  const [checks, setChecks] = useState(() => Object.fromEntries(initialChecks.map(c => [c.field_key, c])) as Record<string, CheckState>);
  const [observedDraft, setObservedDraft] = useState(() => Object.fromEntries(initialChecks.map(c => [c.field_key, c.observed_value ?? ""])) as Record<string, string>);
  const [notes, setNotes] = useState(() => Object.fromEntries(initialChecks.map(c => [c.field_key, c.evidence_note ?? ""])) as Record<string, string>);
  const [idMap, setIdMap] = useState({} as Record<string, string>);
  const [queuedEv, setQueuedEv] = useState([] as QueuedEvidence[]);
  const [msg, setMsg] = useState(null as string | null);
  const [failDetail, setFailDetail] = useState(null as string | null);
  const [annotating, setAnnotating] = useState(null as null | { field: string; name: string; mime: string; b64: string });
  // Inspection-items category selector. Products/materials are REAL (Senaei);
  // workforce/machines/spare are pending-integration scaffolding.
  const [cat, setCat] = useState<"workforce" | "materials" | "products" | "machines" | "spare">(products.length ? "products" : materials.length ? "materials" : "workforce");
  // ── Pending-integration scaffolding state — captured in-memory ONLY. None of
  // this persists to the outbox or DB; it is design structure awaiting a
  // governed source/API. Not a Senaei write-back (FND-007). ──
  const [estForm, setEstForm] = useState({ spatialAuth: "", energyType: "", estStatus: "", prodStatus: "", closureJustification: "", closingAuthority: "" });
  const [exportsProducts, setExportsProducts] = useState<null | boolean>(null);
  const [contactList, setContactList] = useState<{ name: string; title: string; id: string; mobile: string; email: string }[]>([]);
  // Workforce roster scaffold — inspector-added worker-type rows × 3 shifts.
  // No governed count source: nothing is pre-filled and nothing persists.
  const [roster, setRoster] = useState<{ type: string; s1: string; s2: string; s3: string }[]>([]);
  const [visitNote, setVisitNote] = useState("");
  const [itemChecks, setItemChecks] = useState<Record<string, boolean>>({});
  const setEst = (k: keyof typeof estForm, v: string) => setEstForm(f => ({ ...f, [k]: v }));
  const rowTotal = (r: { s1: string; s2: string; s3: string }) => [r.s1, r.s2, r.s3].reduce((sum, v) => sum + (Number(v) || 0), 0);
  const grandTotal = roster.reduce((sum, r) => sum + rowTotal(r), 0);
  // Real offline counters for the Factory-360 snapshot (never fabricated).
  const [draftCount, setDraftCount] = useState(0);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const checksRef = useRef(checks); checksRef.current = checks;
  const notesRef = useRef(notes); notesRef.current = notes;

  useEffect(() => {
    let live = true;
    (async () => {
      const m: Record<string, string> = {};
      for (const f of fields) m[f.key] = await deterministicId(inspectionId, f.key);
      if (live) setIdMap(m);
    })();
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspectionId]);

  const refreshQueued = async () => {
    const ops = await local.peekAll();
    const mine = ops.filter(o => "inspection_id" in o && o.inspection_id === inspectionId);
    setPendingSyncCount(mine.length);                                          // real outbox depth for this inspection
    setQueuedEv(mine.filter((o): o is QueuedEvidence => o.kind === "evidence" && o.linked_type === "factory_field"));
    const drafts = await local.getDrafts(inspectionId);                        // real durable-draft count (M04-114)
    setDraftCount(drafts.length);
  };
  useEffect(() => { refreshQueued(); const iv = setInterval(refreshQueued, 8000); return () => clearInterval(iv); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [inspectionId]);

  const onState = (s: SyncState) => {
    if (s === "failed") setFailDetail("failed");
    else if (s === "synced" || s === "pending") setFailDetail(null);
  };

  async function persist(field: FactoryField, observed: string, statusOverride?: "verified") {
    const id = idMap[field.key] ?? await deterministicId(inspectionId, field.key);
    const src = (field.source ?? "").trim();
    const value = statusOverride === "verified" ? (field.source ?? "") : observed.trim();
    if (!statusOverride && !value) return;                       // nothing observed yet — no status invented
    const status: "verified" | "updated" = statusOverride ?? (value === src ? "verified" : "updated");
    const next: CheckState = { id, field_key: field.key, source_value: field.source, observed_value: value, status, evidence_note: (notesRef.current[field.key] ?? "").trim() || null };
    setChecks(c => ({ ...c, [field.key]: next }));
    if (statusOverride === "verified") setObservedDraft(d => ({ ...d, [field.key]: field.source ?? "" }));
    await local.saveDraft(inspectionId, `fv:${field.key}`, next);           // durable local home (M04-114 — nothing lost)
    await local.enqueue({ kind: "factory_check", inspection_id: inspectionId, check: next, queued_at: new Date().toISOString() });
    setMsg(strings.savedLocal);
    processOutbox(userId, onState);
  }
  async function persistNote(field: FactoryField) {
    const existing = checksRef.current[field.key];
    if (!existing) { setMsg(strings.noteHeld); await local.saveDraft(inspectionId, `fvnote:${field.key}`, notesRef.current[field.key] ?? ""); return; }
    await persist(field, existing.observed_value ?? "", existing.status === "verified" ? "verified" : undefined);
  }

  async function enqueueEvidence(fieldKey: string, name: string, mime: string, b64: string) {
    const id = idMap[fieldKey] ?? await deterministicId(inspectionId, fieldKey);
    const sha = await sha256b64(b64);
    await local.enqueue({ kind: "evidence", inspection_id: inspectionId, linked_type: "factory_field", linked_id: id, name, mime, data_b64: b64, captured_at: new Date().toISOString(), sha256: sha, queued_at: new Date().toISOString() });
    await refreshQueued();
    processOutbox(userId, onState);
  }
  async function attach(field: FactoryField, files: FileList) {
    for (const file of Array.from(files)) {
      const kind = file.type.startsWith("image") ? "photo" : file.type.startsWith("video") ? "video" : "document";
      const limits = evidenceLimits[kind];
      const ext = (file.name.split(".").pop() ?? "").toLowerCase();
      if (limits?.formats?.length && ext && !limits.formats.includes(ext === "jpg" ? "jpeg" : ext)) {
        setMsg(fmt(strings.evBadFormat, { name: file.name, type: kind, formats: limits.formats.join(", ") })); continue;
      }
      if (limits?.max_mb && file.size > limits.max_mb * 1024 * 1024) {
        setMsg(fmt(strings.evTooLarge, { name: file.name, mb: limits.max_mb, type: kind })); continue;
      }
      const b64 = btoa(String.fromCharCode(...new Uint8Array(await file.arrayBuffer())));
      const name = `factory-${field.key}-${Date.now()}-${file.name}`;
      if (file.type.startsWith("image")) {
        setAnnotating({ field: field.key, name, mime: file.type || "image/jpeg", b64 });   // M04-109 — offer annotation
      } else {
        await enqueueEvidence(field.key, name, file.type || "application/pdf", b64);
        setMsg(fmt(strings.evQueued, { field: field.label }));
      }
    }
  }
  async function finishAnnotation(annotatedB64: string | null) {
    const a = annotating; if (!a) return;
    setAnnotating(null);
    await enqueueEvidence(a.field, a.name, a.mime, a.b64);                               // original always kept
    if (annotatedB64) await enqueueEvidence(a.field, `${a.name}-annotated.png`, "image/png", annotatedB64);  // annotated rides with it (M04-109)
    const f = fields.find(x => x.key === a.field);
    setMsg(fmt(strings.evQueued, { field: f?.label ?? a.field }));
  }

  const evCountFor = useMemo(() => {
    const m: Record<string, number> = {};
    for (const [key, id] of Object.entries(idMap)) {
      m[key] = serverFieldEvidence.filter(e => e.linked_id === id).length + queuedEv.filter(q => q.linked_id === id).length;
    }
    return m;
  }, [idMap, serverFieldEvidence, queuedEv]);

  const updatedFields = fields.filter(f => checks[f.key]?.status === "updated");
  const changeCount = updatedFields.length;                                              // M04-110
  // Risk band → DS badge tone (honest reflection of the saved band; no invention).
  const bandVariant = riskBand === "high" ? "badge-critical" : riskBand === "medium" ? "badge-warning" : riskBand === "low" ? "badge-compliant" : "badge-outline";
  // Per-item checkbox scaffolding (PENDING INTEGRATION — ungoverned check list,
  // in-memory toggle only, never persisted).
  const checkLabels = [strings.itemCheck1, strings.itemCheck2, strings.itemCheck3];
  const toggleCheck = (key: string) => setItemChecks(m => ({ ...m, [key]: !m[key] }));
  const renderChecks = (prefix: string) => (
    <div className={styles.checkRow}>
      {checkLabels.map((label, i) => {
        const key = `${prefix}:${i}`;
        const on = !!itemChecks[key];
        return (
          <button type="button" key={key} className={styles.check} aria-pressed={on} onClick={() => toggleCheck(key)} disabled={readOnly}>
            <span className={`${styles.checkBox} ${on ? styles.checkBoxOn : ""}`} aria-hidden="true">
              {on && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={styles.checkMark}><path d="m5 12 5 5 9-10" /></svg>}
            </span>
            {label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className={styles.wrap}>
      {/* Factory-360 snapshot — governed risk leg + real offline counters + the
          synced industrial-license document (M04-096). Health Score is omitted:
          it has no governed source and Health ≠ Risk. */}
      <section className={styles.card}>
        <h4 className={styles.cardH}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={styles.hIcon} aria-hidden="true"><path d="M2 21h20" /><path d="M4 21V9l6 4V9l6 4V5l4 2v14" /></svg>
          {strings.snapshotTitle}
          <span className="grow" />
          {/* Presentational workflow step (design parity) + advisory tone. */}
          <span className="badge badge-info">{strings.stepBadge}</span>
          <span className="badge badge-info">{strings.snapshotAdvisory}</span>
        </h4>
        <div className={styles.statRow}>
          <div className={styles.stat}>
            <div className={`id-code ${styles.statVal}`}>{riskScore ?? "—"}</div>
            <div className="t-caption">{strings.riskScore}</div>
            <span className={`badge ${bandVariant} ${styles.statBadge}`}>{riskBandLabel ?? strings.riskUnknown}</span>
          </div>
          <div className={styles.stat}>
            <div className={`id-code ${styles.statVal}`}>{draftCount}</div>
            <div className="t-caption">{strings.drafts}</div>
          </div>
          <div className={styles.stat}>
            <div className={`id-code ${styles.statVal}`}>{pendingSyncCount}</div>
            <div className="t-caption">{strings.pendingSync}</div>
          </div>
        </div>
        {/* Violation history — PENDING INTEGRATION. No governed factory-scoped
            violation-history source exists (violations/findings are inspection-
            scoped with no status/date and RLS-limited to this inspection). Kept
            as a badged, empty scaffold — never fabricated rows. */}
        <div className={styles.subHead}>
          <span className={styles.subLabel}>{strings.violationHistory}</span>
          <span className="grow" />
          <span className="badge badge-outline">{strings.pendingIntegration}</span>
        </div>
        <div className="empty">
          <div className="empty-title">{strings.violationHistoryPending}</div>
        </div>
        <div className={styles.subLabel}>{strings.licensesDocs}</div>
        {license ? (
          <div className={styles.licRow}>
            <span className={styles.licIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
            </span>
            <span className={styles.licBody}>
              <span className={styles.licTitle}>{strings.licenseTitle}</span>
              <span className="t-caption id-code">{license.reference_no ?? "—"} · {strings.licIssue} {license.valid_from ?? "—"} · {strings.licExpiry} {license.valid_to ?? "—"}</span>
            </span>
          </div>
        ) : <p className="t-caption">{strings.licNone}</p>}
      </section>

      {/* Establishment data — the accepted Source-vs-Observed verification model
          (M04-102/103/106) presented inside the design's card. NOT replaced with
          the design's plain dropdowns: source value (Senaei) vs observed value,
          verify/observed-input/note/evidence and the derived status are intact. */}
      <section className={styles.card}>
      <div className={styles.headerRow}>
        <h4>{strings.title}</h4>
        <span className={`badge ${changeCount ? "badge-warning" : "badge-compliant"}`}>
          {changeCount ? fmt(strings.changeCounter, { n: changeCount }) : strings.noChanges}
        </span>
      </div>
      <p className="t-caption">{strings.hint}</p>
      {readOnly && <div className="alert alert-immutable"><div>{strings.readOnly}</div></div>}
      {checksLoadError && <div className="alert alert-warning"><div>{fmt(strings.loadError, { error: checksLoadError })}</div></div>}
      {failDetail !== null && (
        <div className="alert alert-critical"><div className={styles.bannerRow}>
          <span>{strings.syncFailed}{failDetail ? ` · ${failDetail}` : ""}</span>
          <button className="btn btn-secondary" onClick={() => processOutbox(userId, onState)}>{strings.retry}</button>
        </div></div>
      )}
      {msg && <div className="alert alert-info"><div>{msg}</div></div>}

      {/* M04-102/103/106 — Source vs Observed side-by-side, per field. The
          responsive cards preserve the table semantics without forcing an
          iPad inspector to horizontally scroll five dense columns. */}
      <div className={styles.verificationList}>
        {fields.map(f => {
          const c = checks[f.key];
          const isUpdated = c?.status === "updated";
          return (
            <article key={f.key} className={`${styles.verificationRow} ${isUpdated ? styles.rowUpdated : ""}`}>
              <div className={styles.verificationHead}>
                <strong>{f.label}</strong>
                {c
                  ? <span className={`${styles.statusChip} ${c.status === "verified" ? styles.statusVerified : styles.statusUpdated}`}>
                      <span className={styles.statusDot} aria-hidden="true" />
                      {c.status === "verified" ? strings.verified : strings.updated}
                    </span>
                  : <span className="t-caption">{strings.unchecked}</span>}
              </div>

              <div className={styles.valueGrid}>
                <div className={styles.sourceValue}>
                  <span className={styles.valueLabel}>{strings.colSource}</span>
                  <strong>{f.source ?? "—"}</strong>
                  <span className="t-caption">{strings.sourceTag}</span>
                </div>
                <div className={styles.observedValue}>
                  <span className={styles.valueLabel}>{strings.colObserved}</span>
                  <input className="input" disabled={readOnly}
                    value={observedDraft[f.key] ?? ""} placeholder={strings.observedPlaceholder}
                    onChange={e => setObservedDraft(d => ({ ...d, [f.key]: e.target.value }))}
                    onBlur={() => { const v = observedDraft[f.key] ?? ""; if (v.trim() && v.trim() !== (c?.observed_value ?? "")) persist(f, v); }} />
                </div>
              </div>

              <label className={styles.noteField}>
                <span className={styles.fieldLabel}>{strings.noteLabel}</span>
                <input className="input" disabled={readOnly} value={notes[f.key] ?? ""} placeholder={strings.notePlaceholder}
                  onChange={e => setNotes(n => ({ ...n, [f.key]: e.target.value }))} onBlur={() => persistNote(f)} />
              </label>

              <div className={styles.verificationActions}>
                {!readOnly && (
                  <button className="btn btn-secondary" onClick={() => persist(f, f.source ?? "", "verified")}>{strings.verifyBtn}</button>
                )}
                {!readOnly && (
                  <label className={styles.evidenceAttach}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                      <path d="M12 16V4M8 8l4-4 4 4M4 20h16" />
                    </svg>
                    {strings.evAttach}
                    <input type="file" accept="image/*,.pdf,application/pdf" multiple hidden onChange={e => { if (e.target.files?.length) { attach(f, e.target.files); e.target.value = ""; } }} />
                  </label>
                )}
                {(evCountFor[f.key] ?? 0) > 0 && <span className="t-caption">{fmt(strings.evCount, { n: evCountFor[f.key] })}</span>}
              </div>
            </article>
          );
        })}
      </div>

      {/* M04-111 / M04-190 — change review list: every Updated field with before/after + evidence */}
      <div className={styles.section}>
        <h4>{strings.reviewTitle}</h4>
        {updatedFields.length === 0
          ? <p className="t-caption">{strings.reviewEmpty}</p>
          : updatedFields.map(f => {
            const c = checks[f.key]!;
            return (
              <div key={f.key} className={`alert alert-warning ${styles.reviewItem}`}>
                <div>
                  <strong>{f.label}</strong>
                  {" · "}{strings.before}: <span className="id-code">{c.source_value ?? "—"}</span>
                  {" → "}{strings.after}: <span className="id-code">{c.observed_value ?? "—"}</span>
                  {(evCountFor[f.key] ?? 0) > 0 && <> · {fmt(strings.evCount, { n: evCountFor[f.key] })}</>}
                  {c.evidence_note && <div className="t-caption">{c.evidence_note}</div>}
                </div>
              </div>
            );
          })}
      </div>
      </section>

      {/* Establishment data — design form structure PENDING INTEGRATION. These
          attributes have no governed source/lookup yet, so nothing here is
          persisted; option lists are the design's placeholders, not a governed
          lookup. Kept ADDITIVE to the real source-vs-observed model above. */}
      <section className={styles.card}>
        <h4 className={styles.cardH}>
          {strings.estDataTitle}
          <span className="grow" />
          <span className="badge badge-outline">{strings.pendingIntegration}</span>
        </h4>
        <p className="t-caption">{strings.pendingCaption}</p>
        <div className={styles.formCol}>
          <label className={styles.fld}>
            <span>{strings.spatialAuth}</span>
            <select className="select" value={estForm.spatialAuth} onChange={e => setEst("spatialAuth", e.target.value)} disabled={readOnly}>
              <option value="">{strings.selectPlaceholder}</option>
              <option value="modon">{strings.spatialAuthModon}</option>
              <option value="other">{strings.optOther}</option>
            </select>
          </label>
          <label className={styles.fld}>
            <span>{strings.energyType}</span>
            <select className="select" value={estForm.energyType} onChange={e => setEst("energyType", e.target.value)} disabled={readOnly}>
              <option value="">{strings.selectPlaceholder}</option>
              <option value="natural_gas">{strings.energyGas}</option>
              <option value="electricity">{strings.energyElectricity}</option>
            </select>
          </label>
          <label className={styles.fld}>
            <span>{strings.estStatus}</span>
            <select className="select" value={estForm.estStatus} onChange={e => setEst("estStatus", e.target.value)} disabled={readOnly}>
              <option value="">{strings.selectPlaceholder}</option>
              <option value="production">{strings.estStatusProduction}</option>
              <option value="closed">{strings.estStatusClosed}</option>
            </select>
          </label>
          <label className={styles.fld}>
            <span>{strings.prodStatus}</span>
            <select className="select" value={estForm.prodStatus} onChange={e => setEst("prodStatus", e.target.value)} disabled={readOnly}>
              <option value="">{strings.selectPlaceholder}</option>
              <option value="continuous">{strings.prodContinuous}</option>
              <option value="non_continuous">{strings.prodNonContinuous}</option>
            </select>
          </label>
          <div className={styles.fldRow}>
            <label className={styles.fld}>
              <span>{strings.closureJustification}</span>
              <input className="input" value={estForm.closureJustification} placeholder={strings.closureJustificationPh} onChange={e => setEst("closureJustification", e.target.value)} disabled={readOnly} />
            </label>
            <label className={styles.fld}>
              <span>{strings.closingAuthority}</span>
              <select className="select" value={estForm.closingAuthority} onChange={e => setEst("closingAuthority", e.target.value)} disabled={readOnly}>
                <option value="">{strings.selectPlaceholder}</option>
                <option value="civil_defense">{strings.authCivilDefense}</option>
                <option value="municipality">{strings.authMunicipality}</option>
                <option value="modon">{strings.authModon}</option>
              </select>
            </label>
          </div>
          <div className={styles.exportsRow}>
            <span className={styles.exportsLabel}>{strings.exportsProducts}</span>
            <div className={styles.chipRow}>
              <button type="button" className={styles.chip} aria-pressed={exportsProducts === true} onClick={() => setExportsProducts(true)} disabled={readOnly}>{strings.optYes}</button>
              <button type="button" className={styles.chip} aria-pressed={exportsProducts === false} onClick={() => setExportsProducts(false)} disabled={readOnly}>{strings.optNo}</button>
            </div>
          </div>
        </div>
      </section>

      {/* Incident logging — a distinct capability from a violation (O-13). The
          action links to the REAL incident-reports route with this visit's
          context; no fake inline form. */}
      <section className={styles.card}>
        <h4 className={`${styles.cardH} ${styles.cardHFlush}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={styles.hIcon} aria-hidden="true"><path d="M12 9v4M12 17h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
          {strings.incidentTitle}
          <span className="grow" />
          <a className="btn btn-secondary btn-sm" href={incidentHref}>{strings.incidentLog}</a>
        </h4>
        <p className="t-caption" style={{ marginBlockStart: "var(--space-2)" }}>{strings.incidentDesc}</p>
      </section>

      {/* Contacts — inspection-captured contact scaffolding, PENDING INTEGRATION.
          Editable UI only; it does NOT write back to Senaei/source data
          (FND-007) and is not persisted anywhere yet. */}
      <section className={styles.card}>
        <h4 className={styles.cardH}>
          {strings.contactsTitle}
          <span className="grow" />
          <span className="badge badge-outline">{strings.pendingIntegration}</span>
        </h4>
        <p className="t-caption">{strings.pendingCaption}</p>
        <div className={styles.formCol}>
          {contactList.map((c, i) => (
            <div key={i} className={styles.contactCard}>
              <div className={styles.contactHead}>
                <span className="badge badge-outline">{strings.contactLabel} {i + 1}</span>
                <span className="grow" />
                {!readOnly && (
                  <button type="button" className="btn btn-ghost btn-icon btn-sm" aria-label={strings.contactDelete} onClick={() => setContactList(list => list.filter((_, j) => j !== i))}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={styles.trashIcon} aria-hidden="true"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></svg>
                  </button>
                )}
              </div>
              <div className={styles.fldRow}>
                <label className={styles.fld}><span>{strings.cName}</span><input className="input" value={c.name} onChange={e => setContactList(list => list.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} disabled={readOnly} /></label>
                <label className={styles.fld}><span>{strings.cTitle}</span><input className="input" value={c.title} onChange={e => setContactList(list => list.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} disabled={readOnly} /></label>
              </div>
              <div className={styles.fldRow} style={{ marginBlockStart: "var(--space-2)" }}>
                <label className={styles.fld}><span>{strings.cId}</span><input className="input id-code" value={c.id} onChange={e => setContactList(list => list.map((x, j) => j === i ? { ...x, id: e.target.value } : x))} disabled={readOnly} /></label>
                <label className={styles.fld}><span>{strings.cMobile}</span><input className="input id-code" value={c.mobile} onChange={e => setContactList(list => list.map((x, j) => j === i ? { ...x, mobile: e.target.value } : x))} disabled={readOnly} /></label>
              </div>
              <label className={styles.fld} style={{ marginBlockStart: "var(--space-2)" }}><span>{strings.cEmail}</span><input className="input" dir="ltr" value={c.email} onChange={e => setContactList(list => list.map((x, j) => j === i ? { ...x, email: e.target.value } : x))} disabled={readOnly} /></label>
            </div>
          ))}
          {!readOnly && (
            <button type="button" className="btn btn-secondary btn-block" onClick={() => setContactList(list => [...list, { name: "", title: "", id: "", mobile: "", email: "" }])}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={styles.hIcon} aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
              {strings.addContact}
            </button>
          )}
        </div>
      </section>

      {/* Inspection items — category chips. Products (M04-098) and Raw materials
          (M04-099) show REAL Senaei-sourced identity data. Workforce/Machines/
          Spare-parts categories and the per-item checkboxes are PENDING
          INTEGRATION scaffolding (design structure, ungoverned option/check
          lists, nothing persisted). */}
      <section className={styles.card}>
        <h4 className={styles.cardH}>
          {strings.inspectionItems}
          <span className="grow" />
          <span className="badge badge-outline">{strings.pendingIntegration}</span>
        </h4>
        <p className="t-caption">{strings.pendingCaption}</p>
        <div className={styles.chipRow}>
          <button type="button" className={styles.chip} aria-pressed={cat === "workforce"} onClick={() => setCat("workforce")}>{strings.workforceTitle}</button>
          <button type="button" className={styles.chip} aria-pressed={cat === "materials"} onClick={() => setCat("materials")}>{strings.materialsTitle}</button>
          <button type="button" className={styles.chip} aria-pressed={cat === "products"} onClick={() => setCat("products")}>{strings.productsTitle}</button>
          <button type="button" className={styles.chip} aria-pressed={cat === "machines"} onClick={() => setCat("machines")}>{strings.machinesTitle}</button>
          <button type="button" className={styles.chip} aria-pressed={cat === "spare"} onClick={() => setCat("spare")}>{strings.spareTitle}</button>
        </div>

        {cat === "workforce" && (
          // Workforce roster — PENDING INTEGRATION (whole block). No governed
          // shift/worker-type count source exists, so nothing is pre-filled and
          // nothing persists; the grand total is derived only from what the
          // inspector types here. No registered/diff comparison is invented.
          <div className={styles.formCol}>
            {roster.length === 0 && <p className="t-caption">{strings.rosterEmpty}</p>}
            {roster.map((r, i) => (
              <div key={i} className={styles.itemCard}>
                <div className={styles.contactHead}>
                  <label className={`${styles.fld} ${styles.rosterType}`}>
                    <span>{strings.workerTypeLabel}</span>
                    <input className="input" value={r.type} placeholder={strings.workerTypePh} onChange={e => setRoster(list => list.map((x, j) => j === i ? { ...x, type: e.target.value } : x))} disabled={readOnly} />
                  </label>
                  {!readOnly && (
                    <button type="button" className="btn btn-ghost btn-icon btn-sm" aria-label={strings.contactDelete} onClick={() => setRoster(list => list.filter((_, j) => j !== i))}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={styles.trashIcon} aria-hidden="true"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></svg>
                    </button>
                  )}
                </div>
                <div className={styles.shiftGrid}>
                  <label className={styles.fld}><span>{strings.shift1}</span><input className="input id-code" value={r.s1} inputMode="numeric" onChange={e => setRoster(list => list.map((x, j) => j === i ? { ...x, s1: e.target.value } : x))} disabled={readOnly} style={{ textAlign: "center" }} /></label>
                  <label className={styles.fld}><span>{strings.shift2}</span><input className="input id-code" value={r.s2} inputMode="numeric" onChange={e => setRoster(list => list.map((x, j) => j === i ? { ...x, s2: e.target.value } : x))} disabled={readOnly} style={{ textAlign: "center" }} /></label>
                  <label className={styles.fld}><span>{strings.shift3}</span><input className="input id-code" value={r.s3} inputMode="numeric" onChange={e => setRoster(list => list.map((x, j) => j === i ? { ...x, s3: e.target.value } : x))} disabled={readOnly} style={{ textAlign: "center" }} /></label>
                </div>
                <div className={styles.shiftTotal}>{strings.totalLabel}: <strong>{rowTotal(r)}</strong> {strings.workerUnit}</div>
              </div>
            ))}
            {!readOnly && (
              <button type="button" className="btn btn-secondary btn-block" onClick={() => setRoster(list => [...list, { type: "", s1: "", s2: "", s3: "" }])}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={styles.hIcon} aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                {strings.addWorkerRow}
              </button>
            )}
            {roster.length > 0 && (
              <div className={styles.rosterFoot}>
                <span>{strings.grandTotal}</span>
                <strong className="id-code">{grandTotal}</strong>
                <span className="t-caption">{strings.workerUnit}</span>
              </div>
            )}
          </div>
        )}

        {cat === "products" && (
          products.length === 0 ? <p className="t-caption">{strings.productsEmpty}</p> : (
            <div className={styles.itemList}>
              {products.map((p, i) => (
                <div key={i} className={styles.itemCard}>
                  <div className={styles.itemHead}>
                    <div className={styles.itemMain}>
                      <div className={styles.itemTitle}>{p.name}{p.is_primary && <> <span className="badge badge-info">{strings.primaryTag}</span></>}</div>
                      <div className="t-caption id-code">{strings.colHs}: {p.hs_code ?? "—"}</div>
                    </div>
                    {p.annual_capacity != null && <span className="badge badge-outline">{p.annual_capacity} {p.unit ?? ""}</span>}
                  </div>
                  {renderChecks(`products:${i}`)}
                </div>
              ))}
            </div>
          )
        )}

        {cat === "materials" && (
          materials.length === 0 ? <p className="t-caption">{strings.materialsEmpty}</p> : (
            <div className={styles.itemList}>
              {materials.map((m, i) => (
                <div key={i} className={styles.itemCard}>
                  <div className={styles.itemHead}>
                    <div className={styles.itemMain}>
                      <div className={styles.itemTitle}>{m.name}</div>
                      <div className="t-caption id-code">{strings.colHs}: {m.hs_code ?? "—"}</div>
                    </div>
                    <span className="badge badge-outline">{m.source === "imported" ? strings.srcImported : strings.srcLocal}</span>
                  </div>
                  {renderChecks(`materials:${i}`)}
                </div>
              ))}
            </div>
          )
        )}

        {(cat === "machines" || cat === "spare") && (
          <div className="empty">
            <div className="empty-title">{strings.categoryPending}</div>
          </div>
        )}
      </section>

      {/* Visit notes — PENDING INTEGRATION. There is no governed visit/inspection
          note binding or offline op yet, so this free text is held in memory only
          and is NOT saved (badged so nothing reads as persisted). */}
      <section className={styles.card}>
        <h4 className={styles.cardH}>
          {strings.visitNotesTitle}
          <span className="grow" />
          <span className="badge badge-outline">{strings.pendingIntegration}</span>
        </h4>
        <p className="t-caption">{strings.pendingCaption}</p>
        <label className={styles.fld}>
          <span>{strings.visitNoteLabel}</span>
          <textarea className={`input ${styles.notesArea}`} rows={3} value={visitNote} placeholder={strings.visitNotePlaceholder} onChange={e => setVisitNote(e.target.value)} disabled={readOnly} />
        </label>
      </section>

      {annotating && <AnnotateModal file={annotating} strings={strings} onDone={finishAnnotation} onCancel={() => setAnnotating(null)} />}
    </div>
  );
}
