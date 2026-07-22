"use client";
// M04-109/124/147/160 — image annotation on captured photo evidence.
// Canvas overlay (pen strokes + rectangle highlight) drawn in IMAGE pixel
// coordinates, DPR-safe on screen. Confirm flattens the annotation layer onto
// the photo and returns a single JPEG payload — annotation happens BEFORE the
// evidence op is enqueued, so it is fully offline-safe and the flattened image
// simply replaces the base64 payload of the outbox op (offline engine untouched).
// M04-166 — compressImageB64/compressImageFile: client-side compression
// (longest edge 1600 px, JPEG q0.8) applied to all photo evidence pre-enqueue.
import { useCallback, useEffect, useRef, useState } from "react";

export type AnnotatorStrings = {
  title: string; hint: string;
  pen: string; rect: string; undo: string; clear: string;
  cancel: string; confirm: string;
  imgAlt: string;
};

type Point = { x: number; y: number };
type Shape =
  | { tool: "pen"; points: Point[] }
  | { tool: "rect"; x0: number; y0: number; x1: number; y1: number };

const MAX_EDGE = 1600;
const JPEG_Q = 0.8;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("image decode failed"));
    img.src = src;
  });
}

/** Ink resolved from design-system tokens at draw time — never a bare color. */
function tokenInk(el: HTMLElement): string {
  const cs = getComputedStyle(el);
  return cs.getPropertyValue("--status-critical").trim() || cs.getPropertyValue("--text-primary").trim();
}

/** M04-166 — compress a base64 image: longest edge ≤1600px, JPEG q0.8. Returns null when the browser cannot decode it (caller falls back to the raw payload). */
export async function compressImageB64(b64: string, mime: string): Promise<{ b64: string; mime: string } | null> {
  try {
    const img = await loadImage(`data:${mime};base64,${b64}`);
    const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const g = c.getContext("2d"); if (!g) return null;
    g.drawImage(img, 0, 0, w, h);
    const dataUrl = c.toDataURL("image/jpeg", JPEG_Q);
    return { b64: dataUrl.slice(dataUrl.indexOf(",") + 1), mime: "image/jpeg" };
  } catch { return null; }
}

/** M04-166 — File → compressed base64 (images only; non-images return null). */
export async function compressImageFile(file: File): Promise<{ b64: string; mime: string } | null> {
  if (!file.type.startsWith("image/")) return null;
  const raw = btoa(String.fromCharCode(...new Uint8Array(await file.arrayBuffer())));
  return compressImageB64(raw, file.type || "image/jpeg");
}

export default function ImageAnnotator({ srcB64, mime, strings, onCancel, onConfirm }: {
  srcB64: string; mime: string; strings: AnnotatorStrings;
  onCancel: () => void;
  onConfirm: (b64: string, mime: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [ready, setReady] = useState(false);
  const [tool, setTool] = useState("pen" as "pen" | "rect");
  const [shapes, setShapes] = useState([] as Shape[]);
  const liveShape = useRef(null as Shape | null);
  const drawing = useRef(false);
  const shapesRef = useRef(shapes); shapesRef.current = shapes;

  // Shapes live in IMAGE pixel coordinates; screen rendering maps through
  // scale = displayed-size / natural-size, with DPR-sized backing store.
  const paintShape = useCallback((g: CanvasRenderingContext2D, s: Shape, lineW: number) => {
    g.lineWidth = lineW; g.lineCap = "round"; g.lineJoin = "round";
    if (s.tool === "pen") {
      if (s.points.length < 2) return;
      g.beginPath();
      g.moveTo(s.points[0].x, s.points[0].y);
      for (const p of s.points.slice(1)) g.lineTo(p.x, p.y);
      g.stroke();
    } else {
      g.strokeRect(Math.min(s.x0, s.x1), Math.min(s.y0, s.y1), Math.abs(s.x1 - s.x0), Math.abs(s.y1 - s.y0));
    }
  }, []);

  const redraw = useCallback(() => {
    const c = canvasRef.current, img = imgRef.current;
    if (!c || !img) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    if (c.width !== Math.round(rect.width * dpr)) {
      c.width = Math.round(rect.width * dpr);
      c.height = Math.round(rect.width * (img.naturalHeight / img.naturalWidth) * dpr);
    }
    const g = c.getContext("2d"); if (!g) return;
    const scale = c.width / img.naturalWidth;                    // screen px per image px (incl. DPR)
    g.setTransform(scale, 0, 0, scale, 0, 0);
    g.clearRect(0, 0, img.naturalWidth, img.naturalHeight);
    g.drawImage(img, 0, 0);
    g.strokeStyle = tokenInk(c);
    const lineW = Math.max(3, Math.round(img.naturalWidth / 220));
    for (const s of shapesRef.current) paintShape(g, s, lineW);
    if (liveShape.current) paintShape(g, liveShape.current, lineW);
  }, [paintShape]);

  useEffect(() => {
    let alive = true;
    loadImage(`data:${mime};base64,${srcB64}`).then(img => {
      if (!alive) return;
      imgRef.current = img; setReady(true);
    }).catch(() => { onCancel(); });
    return () => { alive = false; };
  }, [srcB64, mime, onCancel]);
  useEffect(() => { if (ready) redraw(); }, [ready, shapes, redraw]);
  useEffect(() => {
    const onResize = () => redraw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [redraw]);

  // pointer position → image coordinates
  const pos = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const c = e.currentTarget, img = imgRef.current!;
    const r = c.getBoundingClientRect();
    const s = img.naturalWidth / r.width;
    return { x: (e.clientX - r.left) * s, y: (e.clientY - r.top) * s };
  };
  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!ready) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const p = pos(e);
    liveShape.current = tool === "pen" ? { tool: "pen", points: [p] } : { tool: "rect", x0: p.x, y0: p.y, x1: p.x, y1: p.y };
  }
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || !liveShape.current) return;
    const p = pos(e);
    if (liveShape.current.tool === "pen") liveShape.current.points.push(p);
    else { liveShape.current.x1 = p.x; liveShape.current.y1 = p.y; }
    redraw();
  }
  function up(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    drawing.current = false;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* already released */ }
    const s = liveShape.current; liveShape.current = null;
    if (s && (s.tool === "rect" ? Math.abs(s.x1 - s.x0) > 2 && Math.abs(s.y1 - s.y0) > 2 : s.points.length > 1)) {
      setShapes(prev => [...prev, s]);
    } else redraw();
  }

  /** Flatten photo + annotation layer at native resolution → JPEG q0.8 payload. */
  function confirm() {
    const img = imgRef.current, c = canvasRef.current;
    if (!img || !c) return;
    const flat = document.createElement("canvas");
    flat.width = img.naturalWidth; flat.height = img.naturalHeight;
    const g = flat.getContext("2d"); if (!g) return;
    g.drawImage(img, 0, 0);
    g.strokeStyle = tokenInk(c);
    const lineW = Math.max(3, Math.round(img.naturalWidth / 220));
    for (const s of shapesRef.current) paintShape(g, s, lineW);
    const dataUrl = flat.toDataURL("image/jpeg", JPEG_Q);
    onConfirm(dataUrl.slice(dataUrl.indexOf(",") + 1), "image/jpeg");
  }

  return (
    <div className="sq-modal-backdrop" role="dialog" aria-modal="true" aria-label={strings.title}>
      <div className="sq-modal" style={{ inlineSize: "min(720px, 100%)" }}>
        <div className="sq-modal__header"><h3>{strings.title}</h3></div>
        <div className="sq-modal__body">
          <p className="t-caption">{strings.hint}</p>
          <div className="sq-segmented" style={{ marginBlockEnd: "var(--space-3)" }}>
            <button aria-pressed={tool === "pen"} onClick={() => setTool("pen")}>{strings.pen}</button>
            <button aria-pressed={tool === "rect"} onClick={() => setTool("rect")}>{strings.rect}</button>
          </div>
          <canvas
            ref={canvasRef}
            role="img" aria-label={strings.imgAlt}
            onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
            style={{
              inlineSize: "100%", touchAction: "none", cursor: "crosshair", display: "block",
              background: "var(--surface-sunken)",
              border: "1.5px solid var(--border-strong)",
              borderRadius: "var(--radius-sm)",
            }}
          />
        </div>
        <div className="sq-modal__footer">
          <button className="btn btn-ghost btn-touch" onClick={() => setShapes(s => s.slice(0, -1))} disabled={!shapes.length}>{strings.undo}</button>
          <button className="btn btn-ghost btn-touch" onClick={() => setShapes([])} disabled={!shapes.length}>{strings.clear}</button>
          <button className="btn btn-secondary btn-touch" onClick={onCancel}>{strings.cancel}</button>
          <button className="btn btn-primary btn-lg btn-touch" onClick={confirm} disabled={!ready}>{strings.confirm}</button>
        </div>
      </div>
    </div>
  );
}
