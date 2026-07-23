import Link from "next/link";

type Method = { glyph: string; title: string; desc: string; href: string };
type Draft = { id: string; method: string; status: string; planReference: string | null; createdAt: string; planner: string; href: string };

export default function PlanningPreview({ methods, drafts, effectivePackage, canCreate, locale }: {
  methods: Method[];
  drafts: Draft[];
  effectivePackage: string | null;
  canCreate: boolean;
  locale: "en" | "ar";
}) {
  const ar = locale === "ar";
  const copy = ar ? {
    packageReady: "توجد حزمة فعّالة", packageMissing: "لا توجد حزمة فعّالة — النشر غير متاح حتى تهيئتها",
    drafts: "مسودات قيد العمل", methods: "طرق التخطيط", plans: "خطط الزيارات", method: "الطريقة",
    status: "الحالة", created: "أُنشئت", planner: "المخطط", continue: "متابعة",
    noDrafts: "لا توجد مسودات تخطيط ضمن نطاق صلاحيتك.", visits: "إدارة الزيارات",
  } : {
    packageReady: "Effective package present", packageMissing: "No effective package — publishing remains unavailable until configured",
    drafts: "drafts in progress", methods: "Planning methods", plans: "Visit plans", method: "Method",
    status: "Status", created: "Created", planner: "Planner", continue: "Continue",
    noDrafts: "No planning drafts are visible in your authorized scope.", visits: "Visit management",
  };

  return (
    <div data-saqeel-design="WA-DES-036" className="ax-stack" style={{ gap: "var(--ax-space-250)" }}>
      <h1 className="ax-sr-only">{ar ? "تخطيط الزيارات" : "Visit planning"}</h1>
      <div className={`ax-banner ${effectivePackage ? "ax-banner--success" : "ax-banner--warning"}`} role="status"><div>
        <strong>{effectivePackage ? copy.packageReady : copy.packageMissing}</strong>
        {effectivePackage ? <> — <span className="ax-numeric">{effectivePackage}</span> · {drafts.length} {copy.drafts}</> : null}
      </div></div>
      <div className="ax-row" style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>{copy.methods}</h2>
        <Link className="ax-btn ax-btn--subtle" href="/visits?wa_preview=1" prefetch={false}>{copy.visits} →</Link>
      </div>
      <div className="ax-grid-3">
        {methods.map(method => (
          <Link key={method.href} href={canCreate ? method.href : "#"} aria-disabled={!canCreate}
            className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-100)", textDecoration: "none", color: "inherit" }}>
            <span aria-hidden="true" style={{ fontSize: 24 }}>{method.glyph}</span><strong>{method.title}</strong><span className="ax-caption">{method.desc}</span>
          </Link>
        ))}
      </div>
      <section className="ax-surface" aria-labelledby="wa-m2-plans-heading" style={{ overflow: "hidden" }}>
        <div className="ax-panel-header"><h2 id="wa-m2-plans-heading" style={{ margin: 0, fontSize: "var(--ax-font-size-300)" }}>{copy.plans}</h2>
          <span className="ax-lozenge ax-lozenge--warning">{drafts.length} {copy.drafts}</span></div>
        {drafts.length === 0 ? <p className="ax-caption" style={{ padding: "var(--ax-space-300)" }}>{copy.noDrafts}</p> : (
          <div className="ax-tablewrap"><table className="ax-table"><thead><tr><th>Plan</th><th>{copy.method}</th><th>{copy.status}</th><th>{copy.created}</th><th>{copy.planner}</th><th /></tr></thead>
            <tbody>{drafts.map(draft => <tr key={draft.id}><td className="ax-numeric"><strong>{draft.planReference ?? draft.id.slice(0, 8)}</strong></td>
              <td>{draft.method}</td><td><span className="ax-lozenge ax-lozenge--info">{draft.status}</span></td>
              <td className="ax-numeric">{new Date(draft.createdAt).toISOString().slice(0, 16).replace("T", " ")}</td><td>{draft.planner}</td>
              <td><Link className="ax-link" href={draft.href}>{copy.continue} →</Link></td></tr>)}</tbody>
          </table></div>
        )}
      </section>
    </div>
  );
}
