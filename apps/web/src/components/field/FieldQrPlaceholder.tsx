// SAQEEL Field — placeholder QR (O-15 STUB). This is NOT a scannable QR code:
// it is a deterministic visual placeholder (three finder squares + a seeded
// module grid) that "puts the provision" for the establishment-feedback QR
// while the real encoder + public scan/PDF-handoff destination are still
// undecided. The `payload` is the real linkage string the eventual QR will
// encode (visit/inspector ids), shown so the wiring point is explicit.
// DS tokens only — the modules use --text-primary on --surface-primary.

// Tiny deterministic PRNG (mulberry32) seeded from the payload so the same
// visit always renders the same placeholder pattern (stable, not random noise).
function seeded(payload: string): () => number {
  let h = 1779033703 ^ payload.length;
  for (let i = 0; i < payload.length; i++) {
    h = Math.imul(h ^ payload.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const N = 21; // module grid size (a real QR v1 is 21×21 — matches the look)

function isFinder(r: number, c: number): boolean {
  const inBox = (br: number, bc: number) => r >= br && r < br + 7 && c >= bc && c < bc + 7;
  return inBox(0, 0) || inBox(0, N - 7) || inBox(N - 7, 0);
}

export default function FieldQrPlaceholder({ payload, size = 176 }: { payload: string; size?: number }) {
  const rand = seeded(payload || "saqeel");
  const cells: { x: number; y: number }[] = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (isFinder(r, c)) continue;         // finder squares drawn separately
      if (rand() > 0.5) cells.push({ x: c, y: r });
    }
  }
  const finder = (br: number, bc: number) => (
    <g key={`${br}-${bc}`}>
      <rect x={bc} y={br} width={7} height={7} rx={1} fill="var(--text-primary)" />
      <rect x={bc + 1} y={br + 1} width={5} height={5} rx={0.5} fill="var(--surface-primary)" />
      <rect x={bc + 2} y={br + 2} width={3} height={3} fill="var(--text-primary)" />
    </g>
  );
  return (
    <svg viewBox={`-1 -1 ${N + 2} ${N + 2}`} width={size} height={size} role="img"
      aria-label="Feedback QR placeholder" shapeRendering="crispEdges"
      style={{ background: "var(--surface-primary)", borderRadius: 10, border: "1px solid var(--border-subtle)", padding: 6 }}>
      {cells.map((m, i) => <rect key={i} x={m.x} y={m.y} width={1} height={1} fill="var(--text-primary)" />)}
      {finder(0, 0)}{finder(0, N - 7)}{finder(N - 7, 0)}
    </svg>
  );
}
