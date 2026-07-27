// Hand-rolled SVG bar chart — zero deps; colors only via var(--sq-*) tokens
// (GLOBAL COLOR LAW). Server-component safe (no hooks, no browser APIs).
// RTL: the SVG itself never mirrors — callers get a dir="ltr" wrapper here;
// surrounding labels/legends in pages use logical properties.

export type BarDatum = { label: string; value: number };

const AXIS_TEXT: React.CSSProperties = {
  font: "var(--type-caption-font)",
  fontSize: 10,
  fill: "var(--text-secondary)",
};
const VALUE_TEXT: React.CSSProperties = {
  font: "var(--type-caption-font)",
  fontSize: 10,
  fontWeight: 600,
  fill: "var(--text-primary)",
  fontVariantNumeric: "tabular-nums lining-nums",
};

export default function BarChart({ data, title, emptyLabel = "No data", height = 170 }: {
  data: BarDatum[]; title: string; emptyLabel?: string; height?: number;
}) {
  if (data.length === 0) {
    return <p className="t-caption" role="status">{emptyLabel}</p>;
  }
  const w = 360, padX = 8, padTop = 18, padBottom = 22;
  const innerH = height - padTop - padBottom;
  const max = Math.max(1, ...data.map(d => d.value));
  const slot = (w - padX * 2) / data.length;
  const baseline = padTop + innerH;
  return (
    <div dir="ltr" style={{ inlineSize: "100%" }}>
      <svg viewBox={`0 0 ${w} ${height}`} role="img" aria-label={title}
        style={{ inlineSize: "100%", blockSize: "auto", display: "block" }}>
        {data.map((d, i) => {
          const h = Math.round((d.value / max) * innerH);
          const cx = padX + i * slot + slot / 2;
          const y = baseline - h;
          return (
            <g key={`${d.label}-${i}`}>
              <rect x={cx - slot * 0.32} y={y} width={slot * 0.64}
                height={Math.max(h, d.value > 0 ? 2 : 0)} rx={3}
                fill="var(--action-primary)" />
              <text x={cx} y={y - 5} textAnchor="middle" className="numeric" style={VALUE_TEXT}>{d.value}</text>
              <text x={cx} y={height - 6} textAnchor="middle" style={AXIS_TEXT}>{d.label}</text>
            </g>
          );
        })}
        <line x1={padX} y1={baseline + 0.5} x2={w - padX} y2={baseline + 0.5} stroke="var(--border-subtle)" />
      </svg>
    </div>
  );
}
