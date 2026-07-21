const { KpiCard, WidgetFrame, DataTable, Lozenge, Freshness, Banner } = window.SaqeelDesignSystem_49c57d;
function Bars({ values, tone = "var(--ax-color-primary)" }) {
  const max = Math.max(...values);
  return <div style={{ display: "flex", alignItems: "flex-end", gap: 6, blockSize: 96 }}>
    {values.map((v, i) => <div key={i} style={{ flex: 1, blockSize: (v / max * 100) + "%", background: i === values.length - 1 ? tone : "var(--ax-color-primary-weak)", borderRadius: "3px 3px 0 0" }}></div>)}
  </div>;
}
function DashboardScreen({ onNavigate }) {
  return <>
    <Banner tone="warning" title="SLA at risk.">4 visits are due within 24 hours. <a href="#" onClick={e => { e.preventDefault(); onNavigate("visits"); }}>Open visit queue</a></Banner>
    <div className="ax-kpi-row">
      <KpiCard label="PUBLISHED VISITS" value="1,284" delta="+12 this week" deltaDirection="up" trace={{ label: "View records" }} />
      <KpiCard label="SLA ON TIME" value="98.2%" delta="−0.4 pts" deltaDirection="down" />
      <KpiCard label="AWAITING REVIEW" value="47" trace={{ label: "Open queue" }} />
      <KpiCard label="UNSYNCED CONFLICTS" value="2" />
    </div>
    <div className="ax-grid-2">
      <WidgetFrame title="Visits completed · last 12 weeks" chrome={<Freshness>Live · 12s</Freshness>}>
        <Bars values={[42, 51, 39, 61, 58, 64, 57, 70, 66, 74, 69, 81]} />
      </WidgetFrame>
      <WidgetFrame title="Risk band distribution" chrome={<Freshness state="stale">Stale · 41 min</Freshness>}>
        <div className="ax-stack" style={{ gap: "var(--ax-space-100)" }}>
          {[["High", 118, "var(--ax-color-critical)"], ["Medium", 411, "var(--ax-color-warning)"], ["Low", 902, "var(--ax-color-success)"]].map(([b, n, c]) =>
            <div key={b} style={{ display: "grid", gridTemplateColumns: "72px 1fr 48px", gap: 12, alignItems: "center", font: "var(--ax-text-caption)" }}>
              <span>{b}</span>
              <div style={{ blockSize: 10, background: "var(--ax-color-neutral-tint)", borderRadius: 999 }}><div style={{ blockSize: "100%", inlineSize: (n / 902 * 100) + "%", background: c, borderRadius: 999 }}></div></div>
              <span className="ax-numeric" style={{ textAlign: "end" }}>{n}</span>
            </div>)}
        </div>
      </WidgetFrame>
    </div>
    <section className="ax-stack" style={{ gap: "var(--ax-space-150)" }}>
      <h3 style={{ margin: 0, font: "var(--ax-text-heading)" }}>Latest visits</h3>
      <DataTable columns={[
        { key: "id", label: "Visit" },
        { key: "name", label: "Factory" },
        { key: "type", label: "Type" },
        { key: "plan", label: "Planning", render: r => <Lozenge domain="plan" tone={r.planTone}>{r.plan}</Lozenge> },
        { key: "review", label: "Review", render: r => <Lozenge domain="review" tone={r.revTone}>{r.review}</Lozenge> }]}
        rows={[
          { id: "VIS-2026-004821", name: "Gulf Steel Works", type: "periodic · physical", plan: "Published", planTone: "success", review: "Awaiting review", revTone: "info" },
          { id: "VIS-2026-004818", name: "Al Amal Plastics", type: "follow-up · physical", plan: "Assigned", planTone: "info", review: "—" },
          { id: "VIS-2026-004816", name: "Najd Food Industries", type: "periodic · virtual", plan: "Published", planTone: "success", review: "Approved", revTone: "success" }]} />
    </section>
  </>;
}
Object.assign(window, { DashboardScreen });
