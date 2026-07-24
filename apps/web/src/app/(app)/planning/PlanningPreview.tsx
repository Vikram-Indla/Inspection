import Link from "next/link";
import { formatDateTime } from "@/lib/dates";
import styles from "./PlanningPreview.module.css";

type Method = { glyph?: string; title: string; desc: string; href: string };
type Draft = { id: string; method: string; status: string; planReference: string | null; createdAt: string; planner: string; href: string };

function PlanningMethodIcon({ href }: { href: string }) {
  const common = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (href.endsWith("/bulk")) return <svg {...common}><rect x="3" y="5" width="7" height="6" rx="1.5"/><rect x="14" y="5" width="7" height="6" rx="1.5"/><rect x="3" y="15" width="7" height="4" rx="1.5"/><path d="M14 17h7M17.5 13.5v7"/></svg>;
  if (href.endsWith("/single")) return <svg {...common}><path d="M12 21s7-4.8 7-11a7 7 0 1 0-14 0c0 6.2 7 11 7 11z"/><circle cx="12" cy="10" r="2.25"/></svg>;
  return <svg {...common}><path d="M13 2 5.5 13h6L11 22l7.5-12h-6z"/><path d="M4 5h3M3 9h3"/></svg>;
}

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
    <div data-saqeel-design="WA-DES-036" className="sq-stack" style={{ gap: "var(--space-5)" }}>
      <h1 className="sq-sr-only">{ar ? "تخطيط الزيارات" : "Visit planning"}</h1>
      <div className={`sq-banner ${effectivePackage ? "sq-banner--success" : "sq-banner--warning"}`} role="status"><div>
        <strong>{effectivePackage ? copy.packageReady : copy.packageMissing}</strong>
        {effectivePackage ? <> — <span className="sq-numeric">{effectivePackage}</span> · {drafts.length} {copy.drafts}</> : null}
      </div></div>
      <div className="sq-row" style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>{copy.methods}</h2>
        <Link className="sq-btn sq-btn--subtle" href="/planning/visits?wa_preview=1" prefetch={false}>{copy.visits}</Link>
      </div>
      <div className={styles.methods} data-testid="planning-methods">
        {methods.map(method => (
          <Link key={method.href} href={canCreate ? method.href : "#"} aria-disabled={!canCreate}
            className={`sq-surface ${styles.method}`} style={{ textDecoration: "none", color: "inherit" }}>
            <span className={styles.methodIcon} data-testid="planning-method-icon"><PlanningMethodIcon href={method.href} /></span>
            <span className={styles.methodCopy}><strong>{method.title}</strong><span className="sq-caption">{method.desc}</span></span>
          </Link>
        ))}
      </div>
      <section className="sq-surface" aria-labelledby="wa-m2-plans-heading" style={{ overflow: "hidden" }}>
        <div className={styles.panelHeader}><h2 id="wa-m2-plans-heading" style={{ margin: 0, fontSize: "var(--type-page-title-size)" }}>{copy.plans}</h2>
          <span className="sq-lozenge sq-lozenge--warning">{drafts.length} {copy.drafts}</span></div>
        {drafts.length === 0 ? <p className="sq-caption" style={{ padding: "var(--space-6)" }}>{copy.noDrafts}</p> : (
          <div className="sq-tablewrap"><table className="sq-table"><thead><tr><th>Plan</th><th>{copy.method}</th><th>{copy.status}</th><th>{copy.created}</th><th>{copy.planner}</th><th /></tr></thead>
            <tbody>{drafts.map(draft => <tr key={draft.id}><td className="sq-numeric"><strong>{draft.planReference ?? draft.id.slice(0, 8)}</strong></td>
              <td>{draft.method}</td><td><span className="sq-lozenge sq-lozenge--info">{draft.status}</span></td>
              <td className="sq-numeric">{formatDateTime(draft.createdAt, locale)}</td><td>{draft.planner}</td>
              <td><Link className="sq-link" href={draft.href}>{copy.continue}</Link></td></tr>)}</tbody>
          </table></div>
        )}
      </section>
    </div>
  );
}
