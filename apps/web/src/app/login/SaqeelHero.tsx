// SCR-PUB-010 — Saqeel brand hero. An accurate, STATIC illustration of the
// national inspection picture: the real KSA boundary (from public GeoJSON),
// regional posture zones, a highlighted Riyadh geofence, factory pins shaped
// by band, and inspectors mid-route. It is a curated illustration — no live
// data, no real factory names, no counts — so it conveys "factories being
// inspected" on a public page without leaking operational intelligence
// (DEC-011 / SAQEEL-07). Tokens only (GLOBAL COLOR LAW); animations are
// disabled under prefers-reduced-motion by the global rule in saqeel-components-legacy.css.

// Accurate KSA outline projected to an 800×640 viewBox (see scratchpad/ksa_path).
const KSA =
  "M320.2,612L315.8,596.2L305.7,585.1L303.1,570.4L285.7,557.2L267.7,526.2L258.2,496.1L234.9,470.7L219.9,464.6L197.6,429.4L193.7,403.7L195.2,381.9L175.9,340.9L160.1,326.5L141.9,318.9L130.8,297.7L132.6,289.3L123.3,270.2L113.5,262L100.3,234.5L79.8,204.7L62.6,179.3L45.9,179.5L51.1,159.2L52.6,146.3L56.8,131.6L94.2,137.4L108.8,126.1L116.9,112.8L142.6,107.7L148.1,95.3L159.2,89L125.7,52.1L193.1,33.6L199.5,28L240.1,38L290.2,63.9L385.2,138.1L447.8,141.1L477.8,144.6L486.2,162.2L510,161.3L523.2,193.1L539.7,201.6L545.5,214.5L568.5,230.1L570.5,245.3L567.1,257.6L571.4,270L581.1,280.4L585.6,292.5L590.6,301.5L600.8,308.9L610.1,306.2L616.5,320.3L617.8,328.9L630.7,366.3L731.9,384.9L738.7,377.1L754.1,403.3L731.7,477.1L630.7,514.1L533.6,528.2L502.2,544.8L478,583.6L462.3,589.8L453.9,577.5L441,579.3L408.4,575.6L402.3,571.9L363.4,572.8L354.3,576.1L340.4,566.5L331.5,584.7L335,600.2L320.2,612Z";

const RIYADH: [number, number] = [451.4, 303];

// Regional posture blobs (illustrative, not live)
const ZONES: { x: number; y: number; r: number; tone: string }[] = [
  { x: 559, y: 229, r: 70, tone: "--status-critical" }, // Eastern industrial
  { x: 210, y: 424, r: 66, tone: "--status-warning" },  // West (Jeddah/Makkah)
  { x: 311, y: 542, r: 58, tone: "--status-critical" }, // South (Abha)
  { x: 283, y: 200, r: 54, tone: "--status-compliant" },  // North (Hail)
  { x: 360, y: 244, r: 52, tone: "--status-compliant" },  // Qassim
];

type Band = "high" | "medium" | "low";
const FACTORIES: { x: number; y: number; band: Band }[] = [
  { x: 551.9, y: 218.4, band: "high" },   // Jubail
  { x: 566.8, y: 240, band: "medium" },   // Dammam
  { x: 161.3, y: 326.1, band: "low" },    // Yanbu
  { x: 199.4, y: 422.3, band: "medium" }, // Jeddah
  { x: 360.5, y: 243.5, band: "low" },    // Qassim
  { x: 283.5, y: 199.7, band: "low" },    // Hail
  { x: 311, y: 541.9, band: "high" },     // Abha
  { x: 432, y: 292, band: "medium" },     // inside Riyadh geofence
  { x: 470, y: 315, band: "low" },        // inside Riyadh geofence
  { x: 458, y: 285, band: "high" },       // inside Riyadh geofence
];

const INSPECTORS: { from: [number, number]; to: [number, number] }[] = [
  { from: [620, 150], to: [500, 250] },   // heading into central-east
  { from: [120, 470], to: [190, 430] },   // approaching Jeddah
  { from: [655, 300], to: [575, 248] },   // approaching Dammam
];

const TONE: Record<Band, string> = {
  high: "--status-critical", medium: "--status-warning", low: "--status-compliant",
};

function FactoryPin({ x, y, band }: { x: number; y: number; band: Band }) {
  const c = `var(${TONE[band]})`;
  const common = { fill: c, stroke: "var(--surface-canvas)", strokeWidth: 1.5 };
  if (band === "high") return <path d={`M${x},${y - 6} L${x + 5.5},${y + 4} L${x - 5.5},${y + 4} Z`} {...common} />;
  if (band === "medium") return <path d={`M${x},${y - 6} L${x + 6},${y} L${x},${y + 6} L${x - 6},${y} Z`} {...common} />;
  return <circle cx={x} cy={y} r={5} {...common} />;
}

function Inspector({ from, to }: { from: [number, number]; to: [number, number] }) {
  const t = 0.55;
  const px = from[0] + (to[0] - from[0]) * t;
  const py = from[1] + (to[1] - from[1]) * t;
  const ang = Math.atan2(to[1] - from[1], to[0] - from[0]) * 180 / Math.PI + 90;
  return (
    <g>
      <line x1={from[0]} y1={from[1]} x2={px} y2={py}
        stroke="var(--action-primary)" strokeWidth={1.4} strokeDasharray="2 6" opacity={0.6} />
      <circle cx={to[0]} cy={to[1]} r={9} className="lg-hero__ping" fill="var(--action-primary)" />
      <g transform={`translate(${px} ${py}) rotate(${ang})`}>
        <circle r={9} fill="var(--surface-primary)" stroke="var(--action-primary)" strokeWidth={1.4} />
        <path d="M0,-4 L3.4,4 L0,1.8 L-3.4,4 Z" fill="var(--action-primary)" />
      </g>
    </g>
  );
}

export default function SaqeelHero({ riyadhLabel = "RIYADH · GEOFENCED" }: { riyadhLabel?: string } = {}) {
  return (
    <svg className="lg-hero" viewBox="0 0 800 640" aria-hidden="true" focusable="false"
      preserveAspectRatio="xMidYMid meet">
      <defs>
        <clipPath id="lg-ksa"><path d={KSA} /></clipPath>
        <pattern id="lg-grat" width="26" height="26" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="color-mix(in srgb, var(--action-primary) 40%, transparent)" />
        </pattern>
        <radialGradient id="lg-glow">
          <stop offset="0%" stopColor="var(--action-primary)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--action-primary)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* landmass */}
      <path d={KSA} fill="color-mix(in srgb, var(--action-primary) 7%, var(--surface-primary))" />
      <rect x="0" y="0" width="800" height="640" fill="url(#lg-grat)" clipPath="url(#lg-ksa)" opacity="0.5" />

      {/* regional posture zones (clipped to the landmass) */}
      <g clipPath="url(#lg-ksa)">
        {ZONES.map((z, i) => (
          <circle key={i} cx={z.x} cy={z.y} r={z.r}
            fill={`color-mix(in srgb, var(${z.tone}) 22%, transparent)`}
            stroke={`color-mix(in srgb, var(${z.tone}) 60%, transparent)`} strokeWidth={1} />
        ))}
      </g>

      <path d={KSA} fill="none" stroke="color-mix(in srgb, var(--action-primary) 65%, transparent)"
        strokeWidth={1.6} strokeLinejoin="round" />

      {/* Riyadh — the highlighted geofenced zone */}
      <circle cx={RIYADH[0]} cy={RIYADH[1]} r={64} fill="url(#lg-glow)" />
      <circle cx={RIYADH[0]} cy={RIYADH[1]} r={64} className="lg-hero__fence"
        fill="none" stroke="var(--action-primary)" strokeWidth={1.6} strokeDasharray="5 6" />
      <circle cx={RIYADH[0]} cy={RIYADH[1]} r={40} className="lg-hero__pulse"
        fill="none" stroke="var(--action-primary)" strokeWidth={1.2} />

      {/* factory pins */}
      {FACTORIES.map((f, i) => <FactoryPin key={i} {...f} />)}

      {/* inspectors mid-route */}
      {INSPECTORS.map((ins, i) => <Inspector key={i} {...ins} />)}

      {/* Riyadh label chip */}
      <g transform={`translate(${RIYADH[0]} ${RIYADH[1] + 78})`}>
        <rect x="-64" y="-13" width="128" height="26" rx="13"
          fill="var(--surface-primary)" stroke="var(--border-subtle)" />
        <circle cx="-48" cy="0" r="3.5" fill="var(--action-primary)" />
        <text x="-38" y="4" fill="var(--text-primary)"
          style={{ font: "600 12px var(--font-mono)" }}>{riyadhLabel}</text>
      </g>
    </svg>
  );
}
