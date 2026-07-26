// CD-001 V7 Atlas — premium isometric 3D factory builder (Layer 2 visual).
// ORIGINAL geometry composed from isometric primitives — no element copied
// from the reference render (REF-V7-R1 is inspiration only). Each structure is
// storytelling only: it carries a factory's INDUSTRY character, never any
// operational metric. Faces are classed (f-top / f-side / f-front / f-win) so
// login.css can light them from the node's --tone with warm work-lights,
// giving real depth without shipping raster assets.
import type { StructGlyph } from "./saudi-atlas-locations";

const C = 0.866, S = 0.5;   // iso cos/sin(30°)
const U = 8.5;              // px per grid unit
const OX = 70, OY = 100;    // baseline-centre origin in the 140×112 viewBox

type Pt = [number, number];
const P = (x: number, y: number, z: number): Pt => [OX + (x - y) * C * U, OY + ((x + y) * S - z) * U];
const pts = (ps: Pt[]) => ps.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
const poly = (ps: Pt[], cls: string) => `<polygon class="${cls}" points="${pts(ps)}"/>`;

// A box: three visible iso faces (roof lightest, east side mid, south front dark).
function box(x: number, y: number, w: number, d: number, h: number, win = 0): string {
  const roof = poly([P(x, y, h), P(x + w, y, h), P(x + w, y + d, h), P(x, y + d, h)], "f-top");
  const east = poly([P(x + w, y, 0), P(x + w, y + d, 0), P(x + w, y + d, h), P(x + w, y, h)], "f-side");
  const south = poly([P(x, y + d, 0), P(x + w, y + d, 0), P(x + w, y + d, h), P(x, y + d, h)], "f-front");
  let windows = "";
  if (win) {
    for (let i = 0; i < win; i++) {
      const fx = x + 0.28 + i * ((w - 0.4) / Math.max(1, win));
      const wy = y + d;
      const a = P(fx, wy, h * 0.62), b = P(fx + 0.24, wy, h * 0.62);
      const cc = P(fx + 0.24, wy, h * 0.28), dd = P(fx, wy, h * 0.28);
      windows += poly([a, b, cc, dd], "f-win");
    }
  }
  return roof + east + south + windows;
}

// A cylindrical tank / tower / silo.
function tank(x: number, y: number, r: number, h: number, cap = false): string {
  const b = P(x, y, 0), t = P(x, y, h), rr = r * U;
  const body = `<rect class="f-side" x="${(t[0] - rr).toFixed(1)}" y="${t[1].toFixed(1)}" width="${(rr * 2).toFixed(1)}" height="${(b[1] - t[1]).toFixed(1)}"/>`;
  const bottom = `<ellipse class="f-front" cx="${b[0].toFixed(1)}" cy="${b[1].toFixed(1)}" rx="${rr.toFixed(1)}" ry="${(rr * S).toFixed(1)}"/>`;
  const top = `<ellipse class="f-top" cx="${t[0].toFixed(1)}" cy="${t[1].toFixed(1)}" rx="${rr.toFixed(1)}" ry="${(rr * S).toFixed(1)}"/>`;
  const flare = cap
    ? `<polygon class="f-flame" points="${pts([P(x - 0.18, y, h), P(x + 0.18, y, h), P(x, y, h + 0.9)])}"/>` : "";
  return body + bottom + top + flare;
}

// Industry archetypes — each an original composition.
const BUILDERS: Record<StructGlyph, () => string> = {
  process: () =>            // process towers + tanks + pipe rack
    box(0.4, 2.6, 3.4, 1.1, 0.8) + tank(1.2, 1.2, 1.1, 2.4) + tank(3.0, 1.4, 0.9, 2.0) +
    tank(1.6, 3.2, 0.5, 5.2) + tank(2.7, 3.0, 0.5, 4.6),
  refining: () =>           // storage tanks + flare stack + quay
    box(0.2, 3.4, 4.2, 0.5, 0.4) + tank(1.0, 1.4, 1.3, 1.9) + tank(2.9, 1.6, 1.1, 1.6) +
    tank(1.9, 3.0, 0.9, 1.4) + tank(3.7, 3.2, 0.4, 5.4, true),
  metals: () =>             // long smelter hall + tall bay + crane beam
    box(0.2, 1.4, 4.2, 2.0, 1.8, 4) + box(0.6, 1.0, 1.2, 1.2, 3.0) +
    box(0.1, 1.2, 4.4, 0.14, 3.2),
  pharma: () =>             // clean production hall + assembly bay (window rows)
    box(0.4, 1.6, 3.4, 2.4, 2.2, 5) + box(3.0, 2.2, 1.2, 1.4, 1.4, 2),
  fabrication: () =>        // wide fabrication bay + gantry frame
    box(0.4, 1.8, 3.8, 2.2, 1.6, 4) + box(0.5, 1.5, 0.18, 2.6, 3.0) +
    box(3.6, 1.5, 0.18, 2.6, 3.0) + box(0.4, 1.5, 3.9, 0.16, 3.0),
  packaging: () =>          // twin packaging halls + quay cue
    box(0.4, 1.8, 1.8, 2.4, 2.0, 3) + box(2.5, 2.0, 1.8, 2.0, 1.6, 3) + box(0.2, 4.4, 4.2, 0.4, 0.4),
  food: () =>               // grain silos + processing block
    tank(0.9, 1.6, 0.85, 3.8) + tank(2.1, 1.6, 0.85, 3.8) + tank(3.3, 1.6, 0.85, 3.4) +
    box(0.5, 3.0, 3.4, 1.2, 1.2, 3),
  mfg: () =>                // compact production hall
    box(0.8, 1.8, 2.8, 2.6, 2.2, 4) + box(3.2, 2.6, 0.9, 1.2, 1.2),
  logistics: () =>          // long warehouse + loading dock
    box(0.3, 1.6, 4.0, 2.6, 1.8, 5) + box(0.0, 2.6, 0.5, 1.2, 1.0),
};

export function buildStructure(glyph: StructGlyph): string {
  return `<svg class="lg-atlas3d__factory" viewBox="0 0 140 112" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${BUILDERS[glyph]()}</svg>`;
}
