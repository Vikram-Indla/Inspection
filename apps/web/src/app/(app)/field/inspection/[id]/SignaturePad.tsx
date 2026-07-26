"use client";
// DEC-009 / M04-197 — factory-representative acknowledgement signature.
// Real canvas capture (pointer events → strokes → PNG dataURL). The dataURL
// rides inside submission_versions.acknowledgement, so it is stored with the
// immutable version and survives offline queueing unchanged.
import { useEffect, useRef, useState } from "react";
import Modal from "@/components/Modal";
import styles from "./factory-verification.module.css";

export type SignaturePadStrings = {
  title: string; hint: string;
  attendance: string; present: string; absent: string; objected: string;
  reasonLabel: string; unsupported: string;
  nameLabel: string; namePlaceholder: string;
  clear: string; cancel: string; confirm: string;
  required: string;
};

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
  const present = attendance === "present";

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
        <fieldset className={styles.attendanceGroup}>
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
        </fieldset>
        <p className="t-caption">{strings.hint}</p>
        {present ? <>
          <label className={styles.signatureField}>
            <span className={styles.fieldLabel}>{strings.nameLabel}<span className="req">*</span></span>
            <input className="input" value={name} placeholder={strings.namePlaceholder} onChange={e => { setName(e.target.value); setErr(null); }} />
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
        </> : <>
          <label className={styles.signatureField}>
            <span className={styles.fieldLabel}>{strings.reasonLabel}<span className="req">*</span></span>
            <textarea className="input" rows={3} value={reason} onChange={e => setReason(e.target.value)} />
          </label>
          <p className="field-error" role="status">{strings.unsupported}</p>
        </>}
        {err && <p className="field-error">{err}</p>}
      </div>
    </Modal>
  );
}
