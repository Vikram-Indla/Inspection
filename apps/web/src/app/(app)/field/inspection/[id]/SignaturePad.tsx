"use client";
// DEC-009 / M04-197 — factory-representative acknowledgement signature.
// Real canvas capture (pointer events → strokes → PNG dataURL). The dataURL
// rides inside submission_versions.acknowledgement, so it is stored with the
// immutable version and survives offline queueing unchanged.
import { useEffect, useRef, useState } from "react";
import Modal from "@/components/Modal";
import styles from "./factory-verification.module.css";

// Two product modes, declared explicitly rather than inferred from which copy
// happens to be present.
//
// `inspection` records whether the representative was present, absent or
// objected, so it needs the whole attendance bundle. `capture` is signature-only
// — a feedback rating is signed by a representative who is already there, so the
// attendance question would be meaningless.
//
// This is a discriminated union, not six independent optional fields, because
// the optional shape failed OPEN: omitting only `attendance` compiled fine and
// silently removed the entire attendance/refusal path, and supplying
// `attendance` while omitting a label compiled fine and rendered incomplete
// controls. Both are now compile errors. `mode` also stops missing localisation
// copy from becoming an implicit assertion that the signer was present.
// (Codex review of 208ba436, 2026-07-26.)
type SignaturePadBase = {
  title: string; hint: string;
  nameLabel: string; namePlaceholder: string;
  clear: string; cancel: string; confirm: string;
  required: string;
};

/** All six attendance strings travel together or not at all. */
export type AttendanceStrings = {
  attendance: string; present: string; absent: string; objected: string;
  reasonLabel: string; unsupported: string;
};

export type SignaturePadStrings =
  | (SignaturePadBase & { mode: "inspection" } & AttendanceStrings)
  // `?: never` makes passing attendance copy to a capture-only surface a
  // compile error too, so the two modes cannot quietly blur back together.
  | (SignaturePadBase & { mode: "capture" } & Partial<Record<keyof AttendanceStrings, never>>);

export type SignatureAck = { signature_data_url: string; name: string; signed_at: string };

export default function SignaturePad({ strings, onConfirm, onCancel }: {
  strings: SignaturePadStrings;
  onConfirm: (ack: SignatureAck) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const [hasInk, setHasInk] = useState(false);
  const [name, setName] = useState("");
  const [err, setErr] = useState(null as string | null);
  const [attendance, setAttendance] = useState<"present" | "absent" | "objected">("present");
  const [reason, setReason] = useState("");

  // Size the backing store to CSS pixels × DPR so strokes stay crisp in the PNG.
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = Math.round(rect.width * dpr);
    c.height = Math.round(rect.height * dpr);
    const g = c.getContext("2d"); if (!g) return;
    g.scale(dpr, dpr);
    g.lineWidth = 2.25;
    g.lineCap = "round";
    g.lineJoin = "round";
    // Ink color comes from the design system, never a bare color.
    g.strokeStyle = getComputedStyle(c).getPropertyValue("--text-primary").trim();
  }, []);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = pos(e);
  }
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const g = e.currentTarget.getContext("2d"); if (!g) return;
    const p = pos(e);
    g.beginPath();
    g.moveTo(last.current.x, last.current.y);
    g.lineTo(p.x, p.y);
    g.stroke();
    last.current = p;
    if (!hasInk) setHasInk(true);
  }
  function up(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = false;
    if ("releasePointerCapture" in e.currentTarget && "pointerId" in e) {
      try { (e.currentTarget as HTMLCanvasElement).releasePointerCapture(e.pointerId); } catch { /* already released */ }
    }
  }
  function clear() {
    const c = canvasRef.current; if (!c) return;
    const g = c.getContext("2d"); if (!g) return;
    g.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
  }
  function confirm() {
    const c = canvasRef.current;
    if (!c || !hasInk || !name.trim()) { setErr(strings.required); return; }
    onConfirm({ signature_data_url: c.toDataURL("image/png"), name: name.trim(), signed_at: new Date().toISOString() });
  }
  // Driven by the declared mode, never by whether a string happens to exist.
  // In capture mode the signer is present by definition — that is the mode's
  // meaning, not a fallback for absent copy.
  const asksAttendance = strings.mode === "inspection";
  const present = !asksAttendance || attendance === "present";

  return (
    <Modal
      open
      onClose={onCancel}
      titleId="signature-title"
      title={strings.title}
      closeLabel={strings.cancel}
      footer={<>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>{strings.cancel}</button>
        <button type="button" className="btn btn-primary" disabled={!present} aria-disabled={!present || !hasInk || !name.trim()} onClick={confirm}>{strings.confirm}</button>
      </>}
    >
      <div className={styles.signatureBlock}>
        {strings.mode === "inspection" && <fieldset className={styles.attendanceGroup}>
          <legend className={styles.fieldLabel}>{strings.attendance}</legend>
          <div className={styles.attendanceOptions}>
            {([
              ["present", strings.present],
              ["absent", strings.absent],
              ["objected", strings.objected],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={styles.attendanceOption}
                aria-pressed={attendance === value}
                onClick={() => { setAttendance(value); setErr(null); }}
              >
                <span className={styles.attendanceIndicator} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </fieldset>}
        <p className="t-caption">{strings.hint}</p>
        {present ? <>
          <label className={styles.signatureField}>
            {/* The design writes the required marker as a literal " *". The global
                rule is scoped `.field .req`, so a CSS-module label never matches it
                and a <span className="req"> renders completely unstyled. */}
            <span className={styles.fieldLabel}>{strings.nameLabel} *</span>
            <input className="input" aria-required value={name} placeholder={strings.namePlaceholder} onChange={e => { setName(e.target.value); setErr(null); }} />
          </label>
          <div className={styles.signatureCapture}>
            <canvas
              ref={canvasRef}
              className={styles.signatureCanvas}
              aria-label={strings.title}
              onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
            />
            <button type="button" className="btn btn-secondary" onClick={clear}>{strings.clear}</button>
          </div>
        </> : strings.mode === "inspection" ? <>
          {/* Only reachable in inspection mode: capture mode has no way to select
              absent/objected, so `present` is always true there. The explicit
              check is what lets TypeScript prove the attendance copy exists. */}
          <label className={styles.signatureField}>
            <span className={styles.fieldLabel}>{strings.reasonLabel}<span className="req">*</span></span>
            <textarea className="input" rows={3} value={reason} onChange={e => setReason(e.target.value)} />
          </label>
          <p className="field-error" role="status">{strings.unsupported}</p>
        </> : null}
        {err && <p className="field-error">{err}</p>}
      </div>
    </Modal>
  );
}
