// Hand-rolled SVG line chart — zero deps; colors only via var(--ax-*) tokens
// (GLOBAL COLOR LAW). Server-component safe. SVG wrapped dir="ltr" (charts
// never mirror); labels around it use logical properties.

export type LineDatum = { label: string; value: number };

const AXIS_TEXT: React.CSSProperties = {
  font: "var(--ax-text-caption)",
  fontSize: 10,
  fill: "var(--ax-color-text-secondary)",
};
const VALUE_TEXT: React.CSSProperties = {
  font: "var(--ax-text-caption)",
  fontSize: 10,
  fontWeight: 600,
  fill: "var(--ax-color-text)",
  fontVariantNumeric: "tabular-nums lining-nums",
};

export default function LineChart({ data, title, emptyLabel = "No data", height = 170 }: {
  data: LineDatum[]; title: string; emptyLabel?: string; height?: number;
}) {
  if (data.length === 0) {
    return <p className="t-caption" role="status">{emptyLabel}</p>;
  }
  const w = 360, padX = 18, padTop = 18, padBottom = 22;
  const innerH = height - padTop - padBottom;
  const max = Math.max(1, ...data.map(d => d.value));
  const baseline = padTop + innerH;
  const step = data.length > 1 ? (w - padX * 2) / (data.length - 1) : 0;
  const pts = data.map((d, i) => ({
    x: data.length > 1 ? padX + i * step : w / 2,
    y: baseline - (d.value / max) * innerH,
    ...d,
  }));
  const path = pts.map(p => `${p.x},${p.y}`).join(" ");
  return (
    <div dir="ltr" style={{ inlineSize: "100%" }}>
      <svg viewBox={`0 0 ${w} ${height}`} role="img" aria-label={title}
        style={{ inlineSize: "100%", blockSize: "auto", display: "block" }}>
        <line x1={padX - 10} y1={baseline + 0.5} x2={w - padX + 10} y2={baseline + 0.5} stroke="var(--ax-color-border)" />
        {pts.length > 1 && (
          <polyline points={path} fill="none" stroke="var(--ax-color-primary)"
            strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        )}
        {pts.map((p, i) => (
          <g key={`${p.label}-${i}`}>
            <circle cx={p.x} cy={p.y} r={3.5} fill="var(--ax-color-surface)"
              stroke="var(--ax-color-primary)" strokeWidth="2" />
            <text x={p.x} y={p.y - 8} textAnchor="middle" className="numeric" style={VALUE_TEXT}>{p.value}</text>
            <text x={p.x} y={height - 6} textAnchor="middle" style={AXIS_TEXT}>{p.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
