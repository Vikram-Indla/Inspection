import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function EnforcementPage() {
  const [{ t }, sb] = await Promise.all([useT(), supabaseServer()]);
  const [{ data: cases, error }, { data: objections }, { data: violations }] = await Promise.all([
    sb.from("cases").select("id,case_type,status,origin_type,origin_ref,opened_at,updated_at").order("updated_at", { ascending: false }).limit(100),
    sb.from("objections").select("id,status,grounds,created_at").order("created_at", { ascending: false }).limit(50),
    sb.from("violations").select("id,inspection_id,violation_code_id,mapping_version").limit(100),
  ]);
  return (
    <Shell current="/enforcement" title={t("mvp3.enforcement.title", "Enforcement and correction lifecycle")}
      context={<span className="badge badge-info">{"M3-09 · CD-059 · "}{t("mvp3.enforcement.badge", "source-linked cases")}</span>}>
      <div className="ax-banner"><div><strong>{t("mvp3.enforcement.rule", "Every outcome remains linked to its source inspection, clause and human decision.")}</strong> {t("mvp3.enforcement.ruleBody", "Missing links are shown as incomplete—not silently repaired.")}</div></div>
      {error ? <div className="ax-banner ax-banner--warning" role="alert">{t("mvp3.enforcement.unavailable", "The enforcement case contract is unavailable in this environment. No case count is claimed.")}</div> : null}
      <div className="ax-grid" style={{ marginBlock: "var(--ax-space-200)" }}><section className="panel" style={{ padding: "var(--ax-space-300)" }}><p className="t-caption">{t("mvp3.enforcement.openCases", "Open cases")}</p><strong className="ax-display">{(cases ?? []).filter(x => !["resolved","closed"].includes(x.status)).length}</strong></section><section className="panel" style={{ padding: "var(--ax-space-300)" }}><p className="t-caption">{t("mvp3.enforcement.violations", "RLS-visible violations")}</p><strong className="ax-display">{(violations ?? []).length}</strong></section><section className="panel" style={{ padding: "var(--ax-space-300)" }}><p className="t-caption">{t("mvp3.enforcement.objections", "Objections")}</p><strong className="ax-display">{(objections ?? []).length}</strong></section></div>
      <section className="panel stack" style={{ padding: "var(--ax-space-300)" }}><h3>{t("mvp3.enforcement.board", "Case board")}</h3><div className="ax-tablewrap"><table className="ax-table"><thead><tr><th scope="col">{t("mvp3.enforcement.case", "Case")}</th><th scope="col">{t("common.source", "Source")}</th><th scope="col">{t("common.status", "Lifecycle")}</th><th scope="col">{t("common.updated", "Updated")}</th></tr></thead><tbody>{(cases ?? []).map(row => <tr key={row.id}><th scope="row"><a href={`/cases?case=${row.id}`}>{row.case_type}<div className="t-caption"><bdi>{row.id}</bdi></div></a></th><td>{row.origin_type ?? "unlinked"}<div className="t-caption"><bdi>{row.origin_ref ?? "—"}</bdi></div></td><td><span className="badge">{row.status}</span></td><td>{new Date(row.updated_at).toLocaleString()}</td></tr>)}{!error && !(cases ?? []).length ? <tr><td colSpan={4}>{t("mvp3.enforcement.empty", "No RLS-visible enforcement cases.")}</td></tr> : null}</tbody></table></div></section>
      <section className="panel stack" style={{ padding: "var(--ax-space-300)", marginBlockStart: "var(--ax-space-200)" }}><h3>{t("mvp3.enforcement.objectionQueue", "Correction and objection queue")}</h3>{(objections ?? []).map(row => <div className="row" key={row.id} style={{ justifyContent: "space-between", flexWrap: "wrap" }}><span><strong>{row.grounds}</strong><small className="t-caption"> · {new Date(row.created_at).toLocaleDateString()}</small></span><span className="badge">{row.status}</span></div>)}{!(objections ?? []).length ? <p className="t-caption">{t("mvp3.enforcement.noObjections", "No RLS-visible objections.")}</p> : null}</section>
    </Shell>
  );
}
