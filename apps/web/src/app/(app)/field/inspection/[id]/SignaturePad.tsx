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
  // Design authority (SAQEEL PWA-Field Completion.dc.html, `ack` panel): the
  // readiness requirement is stated continuously while the acknowledgement is
  // incomplete, not only after a rejected confirm. Presentation only — the
  // submit guard below is unchanged and still refuses without ink AND a name.
  const ready = hasInk && name.trim().length > 0;

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
    if (!c || !hasInk || !name.trim()) return;          // DEC-009 gate — unchanged
    onConfirm({ signature_data_url: c.toDataURL("image/png"), name: name.trim(), signed_at: new Date().toISOString() });
  }

  return (
    <Modal
      open
      onClose={onCancel}
      titleId="signature-title"
      title={strings.title}
      closeLabel={strings.cancel}
      footer={<>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>{strings.cancel}</button>
        <button type="button" className="btn btn-primary" aria-disabled={!ready} onClick={confirm}>{strings.confirm}</button>
      </>}
    >
      <div className={styles.signatureBlock}>
        <p className="t-caption">{strings.hint}</p>
        <label className={styles.signatureField}>
          {/* Design: `t.sigName + " *"` — the required marker is part of the
              label text (the global `.req` rule is scoped to `.field`, so it
              never applied inside this CSS-module label). */}
          <span className={styles.fieldLabel}>{strings.nameLabel} *</span>
          <input className="input" aria-required="true" value={name} placeholder={strings.namePlaceholder} onChange={e => setName(e.target.value)} />
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
        {!ready && <p className="t-caption" style={{ margin: 0, color: "var(--status-warning-text)" }}>{strings.required}</p>}
      </div>
    </Modal>
  );
}
