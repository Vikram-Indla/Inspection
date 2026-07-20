// Hand-rolled SVG donut chart — zero deps; colors only via var(--ax-*) tokens
// (GLOBAL COLOR LAW). Server-component safe. SVG wrapped dir="ltr" (charts
// never mirror); the legend uses logical properties so it flows with RTL.

export type DonutTone = "primary" | "success" | "warning" | "critical" | "info" | "neutral";
export type DonutSlice = { label: string; value: number; tone: DonutTone };

// Token references only — never raw colors (GLOBAL COLOR LAW).
const TONE_VAR: Record<DonutTone, string> = {
  primary: "var(--ax-color-primary)",
  success: "var(--ax-color-success)",
  warning: "var(--ax-color-warning)",
  critical: "var(--ax-color-critical)",
  info: "var(--ax-color-info)",
  neutral: "var(--ax-color-text-secondary)",
};

export default function DonutChart({ data, title, centerLabel, emptyLabel = "No data" }: {
  data: DonutSlice[]; title: string; centerLabel: string; emptyLabel?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (data.length === 0 || total === 0) {
    return <p className="t-caption" role="status">{emptyLabel}</p>;
  }
  let cumulative = 0;
  const arcs = data.filter(d => d.value > 0).map(d => {
    const pct = (d.value / total) * 100;
    const offset = 25 - cumulative; // start at 12 o'clock, clockwise
    cumulative += pct;
    return { ...d, pct, offset };
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--ax-space-300)", flexWrap: "wrap" }}>
      <div dir="ltr" style={{ inlineSize: 132, flexShrink: 0 }}>
        <svg viewBox="0 0 120 120" role="img" aria-label={title}
          style={{ inlineSize: "100%", blockSize: "auto", display: "block" }}>
          <circle cx="60" cy="60" r="46" fill="none" strokeWidth="14"
            stroke="var(--ax-color-neutral-weak)" />
          {arcs.map((a, i) => (
            <circle key={`${a.label}-${i}`} cx="60" cy="60" r="46" fill="none" strokeWidth="14"
              stroke={TONE_VAR[a.tone]} pathLength={100}
              strokeDasharray={`${a.pct} ${100 - a.pct}`} strokeDashoffset={a.offset} />
          ))}
          <text x="60" y="57" textAnchor="middle" className="ax-numeric"
            style={{ font: "var(--ax-text-title)", fontSize: 22, fontWeight: 600, fill: "var(--ax-color-text)", fontVariantNumeric: "tabular-nums lining-nums" }}>
            {total}
          </text>
          <text x="60" y="74" textAnchor="middle"
            style={{ font: "var(--ax-text-caption)", fontSize: 10, fill: "var(--ax-color-text-secondary)" }}>
            {centerLabel}
          </text>
        </svg>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--ax-space-100)" }}>
        {data.map((d, i) => (
          <li key={`${d.label}-${i}`} className="t-caption" style={{ display: "flex", alignItems: "center", gap: "var(--ax-space-100)" }}>
            <span aria-hidden style={{ inlineSize: 10, blockSize: 10, borderRadius: 3, background: TONE_VAR[d.tone], flexShrink: 0 }} />
            <span>{d.label}</span>
            <span className="ax-numeric" style={{ marginInlineStart: "auto", fontWeight: 600, color: "var(--ax-color-text)" }}>{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
