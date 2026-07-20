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
import { local, processOutbox, sha256b64, type OutboxOp, type SyncState } from "@/lib/offline";

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
      g.strokeStyle = getComputedStyle(c).getPropertyValue("--ax-color-critical").trim();
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
    <div className="ax-modal-backdrop" role="dialog" aria-modal="true" aria-label={strings.annotateTitle}>
      <div className="ax-modal" style={{ inlineSize: "min(700px, 100%)" }}>
        <div className="ax-modal__header"><h3>{strings.annotateTitle}</h3></div>
        <div className="ax-modal__body">
          <p className="t-caption">{strings.annotateHint}</p>
          <canvas ref={canvasRef} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
            style={{ maxInlineSize: "100%", touchAction: "none", cursor: "crosshair", border: "1.5px dashed var(--ax-color-border-strong)", borderRadius: "var(--ax-radius-standard)" }} />
        </div>
        <div className="ax-modal__footer">
          <button className="ax-btn ax-btn--subtle" onClick={clear}>{strings.annotateClear}</button>
          <button className="ax-btn ax-btn--secondary" onClick={onCancel}>{strings.annotateCancel}</button>
          <button className="ax-btn ax-btn--secondary" onClick={() => onDone(null)}>{strings.annotateSkip}</button>
          <button className="ax-btn ax-btn--prominent" aria-disabled={!inked} onClick={save}>{strings.annotateSave}</button>
        </div>
      </div>
    </div>
  );
}

export default function FactoryVerification({ inspectionId, fields, license, products, materials, initialChecks, checksLoadError, serverFieldEvidence, evidenceLimits, readOnly, strings }: {
  inspectionId: string;
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
}) {
  const [checks, setChecks] = useState(() => Object.fromEntries(initialChecks.map(c => [c.field_key, c])) as Record<string, CheckState>);
  const [observedDraft, setObservedDraft] = useState(() => Object.fromEntries(initialChecks.map(c => [c.field_key, c.observed_value ?? ""])) as Record<string, string>);
  const [notes, setNotes] = useState(() => Object.fromEntries(initialChecks.map(c => [c.field_key, c.evidence_note ?? ""])) as Record<string, string>);
  const [idMap, setIdMap] = useState({} as Record<string, string>);
  const [queuedEv, setQueuedEv] = useState([] as QueuedEvidence[]);
  const [msg, setMsg] = useState(null as string | null);
  const [failDetail, setFailDetail] = useState(null as string | null);
  const [annotating, setAnnotating] = useState(null as null | { field: string; name: string; mime: string; b64: string });
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
    setQueuedEv(ops.filter((o): o is QueuedEvidence => o.kind === "evidence" && o.inspection_id === inspectionId && o.linked_type === "factory_field"));
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
    processOutbox(onState);
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
    processOutbox(onState);
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

  return (
    <div className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "var(--ax-space-100)" }}>
        <h4>{strings.title}</h4>
        <span className={`ax-lozenge ${changeCount ? "ax-lozenge--warning" : "ax-lozenge--success"}`}>
          {changeCount ? fmt(strings.changeCounter, { n: changeCount }) : strings.noChanges}
        </span>
      </div>
      <p className="t-caption">{strings.hint}</p>
      {readOnly && <div className="ax-banner ax-banner--immutable"><div>{strings.readOnly}</div></div>}
      {checksLoadError && <div className="ax-banner ax-banner--warning"><div>{fmt(strings.loadError, { error: checksLoadError })}</div></div>}
      {failDetail !== null && (
        <div className="ax-banner ax-banner--critical"><div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: "var(--ax-space-200)" }}>
          <span>{strings.syncFailed}{failDetail ? ` · ${failDetail}` : ""}</span>
          <button className="ax-btn ax-btn--secondary" onClick={() => processOutbox(onState)}>{strings.retry}</button>
        </div></div>
      )}
      {msg && <div className="ax-banner"><div>{msg}</div></div>}

      {/* M04-102/103/106 — Source vs Observed side-by-side, per field */}
      <div className="ax-tablewrap"><table className="ax-table">
        <thead><tr>
          <th scope="col">{strings.colField}</th><th scope="col">{strings.colSource}</th><th scope="col">{strings.colObserved}</th><th scope="col">{strings.colStatus}</th><th scope="col">{strings.colEvidence}</th>
        </tr></thead>
        <tbody>
          {fields.map(f => {
            const c = checks[f.key];
            const isUpdated = c?.status === "updated";
            return (
              <tr key={f.key} style={isUpdated ? { background: "var(--ax-color-surface-sunken)" } : undefined}>
                {/* M04-107 — updated-field highlighting */}
                <td style={isUpdated ? { borderInlineStart: "4px solid var(--ax-color-warning)" } : undefined}><strong>{f.label}</strong></td>
                <td>
                  <div>{f.source ?? "—"}</div>
                  <div className="t-caption">{strings.sourceTag}</div>
                </td>
                <td>
                  <input className="ax-input" style={{ minInlineSize: 140 }} disabled={readOnly}
                    value={observedDraft[f.key] ?? ""} placeholder={strings.observedPlaceholder}
                    onChange={e => setObservedDraft(d => ({ ...d, [f.key]: e.target.value }))}
                    onBlur={() => { const v = observedDraft[f.key] ?? ""; if (v.trim() && v.trim() !== (c?.observed_value ?? "")) persist(f, v); }} />
                  <label className="ax-field" style={{ marginBlockStart: "var(--ax-space-100)" }}>
                    <span className="ax-field__label">{strings.noteLabel}</span>
                    <input className="ax-input" disabled={readOnly} value={notes[f.key] ?? ""} placeholder={strings.notePlaceholder}
                      onChange={e => setNotes(n => ({ ...n, [f.key]: e.target.value }))} onBlur={() => persistNote(f)} />
                  </label>
                </td>
                <td>
                  {!readOnly && (
                    <button className="ax-btn ax-btn--secondary" style={{ marginBlockEnd: "var(--ax-space-100)" }} onClick={() => persist(f, f.source ?? "", "verified")}>{strings.verifyBtn}</button>
                  )}
                  <div>
                    {c
                      ? <span className={`ax-lozenge ${c.status === "verified" ? "ax-lozenge--success" : "ax-lozenge--warning"}`}>{c.status === "verified" ? strings.verified : strings.updated}</span>
                      : <span className="t-caption">{strings.unchecked}</span>}
                  </div>
                </td>
                <td>
                  {!readOnly && (
                    <label className="ax-btn ax-btn--secondary" style={{ cursor: "pointer" }}>
                      {strings.evAttach}
                      <input type="file" accept="image/*,.pdf,application/pdf" multiple hidden onChange={e => { if (e.target.files?.length) { attach(f, e.target.files); e.target.value = ""; } }} />
                    </label>
                  )}
                  {(evCountFor[f.key] ?? 0) > 0 && <div className="t-caption numeric">{fmt(strings.evCount, { n: evCountFor[f.key] })}</div>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table></div>

      {/* M04-111 / M04-190 — change review list: every Updated field with before/after + evidence */}
      <div>
        <h4 style={{ marginBlockEnd: "var(--ax-space-100)" }}>{strings.reviewTitle}</h4>
        {updatedFields.length === 0
          ? <p className="t-caption">{strings.reviewEmpty}</p>
          : updatedFields.map(f => {
            const c = checks[f.key]!;
            return (
              <div key={f.key} className="ax-banner ax-banner--warning" style={{ marginBlockEnd: "var(--ax-space-100)" }}>
                <div>
                  <strong>{f.label}</strong>
                  {" · "}{strings.before}: <span className="numeric">{c.source_value ?? "—"}</span>
                  {" → "}{strings.after}: <span className="numeric">{c.observed_value ?? "—"}</span>
                  {(evCountFor[f.key] ?? 0) > 0 && <> · {fmt(strings.evCount, { n: evCountFor[f.key] })}</>}
                  {c.evidence_note && <div className="t-caption">{c.evidence_note}</div>}
                </div>
              </div>
            );
          })}
      </div>

      {/* M04-096 — license leg (issue/expiry from the synced license document) */}
      <div>
        <h4 style={{ marginBlockEnd: "var(--ax-space-100)" }}>{strings.licenseTitle}</h4>
        {license
          ? <p className="t-caption numeric">{strings.licRef}: {license.reference_no ?? "—"} · {strings.licIssue}: {license.valid_from ?? "—"} · {strings.licExpiry}: {license.valid_to ?? "—"}</p>
          : <p className="t-caption">{strings.licNone}</p>}
      </div>

      {/* M04-098 — products & HS codes inside the execution flow (read-only, Senaei-sourced) */}
      <div>
        <h4 style={{ marginBlockEnd: "var(--ax-space-100)" }}>{strings.productsTitle}</h4>
        {products.length === 0 ? <p className="t-caption">{strings.productsEmpty}</p> : (
          <div className="ax-tablewrap"><table className="ax-table">
            <thead><tr><th scope="col">{strings.colProduct}</th><th scope="col">{strings.colHs}</th><th scope="col">{strings.colCapacity}</th></tr></thead>
            <tbody>{products.map((p, i) => (
              <tr key={i}>
                <td>{p.name}{p.is_primary && <> <span className="ax-lozenge ax-lozenge--info">{strings.primaryTag}</span></>}</td>
                <td className="numeric">{p.hs_code ?? "—"}</td>
                <td className="numeric">{p.annual_capacity != null ? `${p.annual_capacity} ${p.unit ?? ""}` : "—"}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>

      {/* M04-099 — raw materials inside the execution flow (read-only, Senaei-sourced) */}
      <div>
        <h4 style={{ marginBlockEnd: "var(--ax-space-100)" }}>{strings.materialsTitle}</h4>
        {materials.length === 0 ? <p className="t-caption">{strings.materialsEmpty}</p> : (
          <div className="ax-tablewrap"><table className="ax-table">
            <thead><tr><th scope="col">{strings.colMaterial}</th><th scope="col">{strings.colMatSource}</th><th scope="col">{strings.colHs}</th></tr></thead>
            <tbody>{materials.map((m, i) => (
              <tr key={i}>
                <td>{m.name}</td>
                <td>{m.source === "imported" ? strings.srcImported : strings.srcLocal}</td>
                <td className="numeric">{m.hs_code ?? "—"}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>

      {annotating && <AnnotateModal file={annotating} strings={strings} onDone={finishAnnotation} onCancel={() => setAnnotating(null)} />}
    </div>
  );
}
