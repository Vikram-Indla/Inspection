// CD-001 V7 Atlas — 14s illustrative motion timeline (MOTION_STORYBOARD_CD001).
// A single rAF loop that advances the six lifecycle stages on a calm cadence
// and hands the active index back to the caller. It NEVER runs when the user
// prefers reduced motion, and it pauses while a dossier is open, while any
// atlas element holds focus, or while the tab is hidden (document.hidden).
// No whole-map pulsing, particles or flashing — the visual restraint lives in
// the components; this file only owns time.

import { STAGE_ORDER } from "./saudi-atlas-locations";

// Cumulative stage end times (seconds) from the storyboard.
//   plan 0–2.5 · travel 2.5–5 · arrive 5–7 · inspect 7–9.5 · review 9.5–12 · decide 12–14
const STAGE_END_S = [2.5, 5.0, 7.0, 9.5, 12.0, 14.0];
const LOOP_MS = STAGE_END_S[STAGE_END_S.length - 1] * 1000;

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined"
    && !!window.matchMedia
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function stageIndexAt(ms: number): number {
  const t = (ms % LOOP_MS) / 1000;
  for (let i = 0; i < STAGE_END_S.length; i++) if (t < STAGE_END_S[i]) return i;
  return STAGE_ORDER.length - 1;
}

export type AtlasTimeline = {
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
};

// onStage is called only when the active stage index changes.
export function createAtlasTimeline(onStage: (index: number) => void): AtlasTimeline {
  let raf = 0;
  let running = false;
  let paused = false;
  let last = 0;            // timestamp of the previous frame
  let elapsed = 0;         // accumulated, pause-aware playback time (ms)
  let current = -1;

  function frame(now: number) {
    if (!running) return;
    if (!paused) {
      if (last) elapsed += now - last;
      const idx = stageIndexAt(elapsed);
      if (idx !== current) { current = idx; onStage(idx); }
    }
    last = now;
    raf = requestAnimationFrame(frame);
  }

  function onVisibility() {
    if (document.hidden) paused = true;
    else { last = 0; paused = false; }
  }

  return {
    start() {
      if (running || prefersReducedMotion()) return;
      running = true; paused = false; last = 0; elapsed = 0; current = -1;
      document.addEventListener("visibilitychange", onVisibility);
      onStage(0);
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
    },
    pause() { paused = true; },
    resume() { if (running && !document.hidden) { last = 0; paused = false; } },
  };
}
