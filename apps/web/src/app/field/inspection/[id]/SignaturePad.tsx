"use client";
// DEC-009 / M04-197 — factory-representative acknowledgement signature.
// Real canvas capture (pointer events → strokes → PNG dataURL). The dataURL
// rides inside submission_versions.acknowledgement, so it is stored with the
// immutable version and survives offline queueing unchanged.
import { useEffect, useRef, useState } from "react";

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
  const [err, setErr] = useState(null as string | null);

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
    g.strokeStyle = getComputedStyle(c).getPropertyValue("--ax-color-text").trim();
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

  return (
    <div className="ax-modal-backdrop" role="dialog" aria-modal="true" aria-label={strings.title}>
      <div className="ax-modal" style={{ inlineSize: "min(560px, 100%)" }}>
        <div className="ax-modal__header"><h3>{strings.title}</h3></div>
        <div className="ax-modal__body">
          <p className="t-caption">{strings.hint}</p>
          <label className="ax-field">
            <span className="ax-field__label">{strings.nameLabel}<span className="ax-req">*</span></span>
            <input className="ax-input" value={name} placeholder={strings.namePlaceholder} onChange={e => { setName(e.target.value); setErr(null); }} />
          </label>
          <canvas
            ref={canvasRef}
            onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
            style={{
              inlineSize: "100%", blockSize: 180, touchAction: "none", cursor: "crosshair",
              background: "var(--ax-color-surface-sunken)",
              border: "1.5px dashed var(--ax-color-border-strong)",
              borderRadius: "var(--ax-radius-standard)",
            }}
          />
          {err && <p className="ax-field__error">{err}</p>}
        </div>
        <div className="ax-modal__footer">
          <button className="btn btn-ghost btn-touch" onClick={clear}>{strings.clear}</button>
          <button className="btn btn-secondary btn-touch" onClick={onCancel}>{strings.cancel}</button>
          <button className="btn btn-primary btn-lg btn-touch" aria-disabled={!hasInk || !name.trim()} onClick={confirm}>{strings.confirm}</button>
        </div>
      </div>
    </div>
  );
}
