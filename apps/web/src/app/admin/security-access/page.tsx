import Shell from "@/components/Shell";
import Mvp3ActionForm from "@/components/Mvp3ActionForm";
import { decideAccessReview } from "../mvp3-actions";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function SecurityAccessPage() {
  const [{ t }, sb] = await Promise.all([useT(), supabaseServer()]);
  const [{ data: reviews, error }, { data: grants }, { count: roleCount }] = await Promise.all([
    sb.from("mvp3_access_reviews").select("id,subject_user_id,scope,purpose,status,due_at,reviewed_at").order("due_at"),
    sb.from("mvp3_evidence_access_grants").select("id,grantee_user_id,purpose,granted_at,expires_at,revoked_at").order("expires_at"),
    sb.from("user_roles").select("user_id", { count: "exact", head: true }),
  ]);
  const now = Date.now();
  return (
    <Shell current="/admin/security-access" title={t("mvp3.security.title", "Security posture and access review")}
      context={<span className="ax-lozenge ax-lozenge--info">{"M3-00 · CD-050 · "}{t("mvp3.security.badge", "purpose-bound evidence access")}</span>}>
      <div className="ax-banner"><div><strong>{t("mvp3.security.boundary", "Navigation is not authorization.")}</strong> {t("mvp3.security.boundaryBody", "Database grants and RLS enforce every read and action. This screen exposes only the signed-in actor's readable scope.")}</div></div>
      {error ? <div className="ax-banner ax-banner--warning" role="alert">{t("mvp3.schema.pending", "MVP3 database contract is not applied in this environment. No data is inferred.")}</div> : null}
      <div className="ax-grid" style={{ marginBlock: "var(--ax-space-200)" }}>
        <section className="ax-surface" style={{ padding: "var(--ax-space-300)" }}><p className="ax-caption">{t("mvp3.security.roleHoldings", "RLS-visible role holdings")}</p><strong className="ax-display">{roleCount ?? 0}</strong><p>{t("mvp3.security.notPermission", "Holdings are not an effective-permission proof.")}</p></section>
        <section className="ax-surface" style={{ padding: "var(--ax-space-300)" }}><p className="ax-caption">{t("mvp3.security.openReviews", "Open reviews")}</p><strong className="ax-display">{(reviews ?? []).filter(x => x.status === "open").length}</strong><p>{(reviews ?? []).filter(x => x.status === "open" && new Date(x.due_at).getTime() < now).length} {t("mvp3.security.overdue", "overdue")}</p></section>
        <section className="ax-surface" style={{ padding: "var(--ax-space-300)" }}><p className="ax-caption">{t("mvp3.security.activeEvidence", "Active evidence grants")}</p><strong className="ax-display">{(grants ?? []).filter(x => !x.revoked_at && new Date(x.expires_at).getTime() > now).length}</strong><p>{t("mvp3.security.expiry", "Every grant has purpose and expiry.")}</p></section>
      </div>
      <section className="ax-surface ax-stack" style={{ padding: "var(--ax-space-300)" }}><h3>{t("mvp3.security.reviews", "Access certification queue")}</h3><div className="ax-tablewrap"><table className="ax-table"><thead><tr><th>{t("mvp3.security.subject", "Subject")}</th><th>{t("mvp3.security.scope", "Scope and purpose")}</th><th>{t("common.status", "Status")}</th><th>{t("common.action", "Independent decision")}</th></tr></thead><tbody>{(reviews ?? []).map(row => <tr key={row.id}><th scope="row"><bdi>{row.subject_user_id}</bdi></th><td><strong>{row.scope}</strong><div className="ax-caption">{row.purpose}</div></td><td><span className={`ax-lozenge ${row.status === "open" ? "ax-lozenge--warning" : "ax-lozenge--success"}`}>{row.status}</span><div className="ax-caption">{new Date(row.due_at).toLocaleDateString()}</div></td><td>{row.status === "open" ? <Mvp3ActionForm action={decideAccessReview} submitLabel={t("mvp3.security.record", "Record decision")}><input type="hidden" name="reviewId" value={row.id}/><label>{t("mvp3.security.decision", "Decision")}<select name="decision" required defaultValue=""><option value="" disabled>—</option><option value="retain">{t("mvp3.security.retain", "Retain")}</option><option value="revoke">{t("mvp3.security.revoke", "Revoke")}</option></select></label><label>{t("common.reason", "Reason")}<textarea name="reason" minLength={8} required /></label></Mvp3ActionForm> : "—"}</td></tr>)}{!error && !(reviews ?? []).length ? <tr><td colSpan={4}>{t("mvp3.security.noReviews", "No RLS-visible access reviews.")}</td></tr> : null}</tbody></table></div></section>
      <section className="ax-surface ax-stack" style={{ padding: "var(--ax-space-300)", marginBlockStart: "var(--ax-space-200)" }}><h3>{t("mvp3.security.grants", "Purpose-bound evidence grants")}</h3>{(grants ?? []).map(row => <div className="ax-row" key={row.id} style={{ justifyContent: "space-between", flexWrap: "wrap" }}><span><strong><bdi>{row.grantee_user_id}</bdi></strong><small className="ax-caption"> · {row.purpose}</small></span><span className="ax-lozenge">{row.revoked_at ? t("mvp3.security.revoked", "revoked") : new Date(row.expires_at).getTime() > now ? t("mvp3.security.active", "active") : t("mvp3.security.expired", "expired")}</span></div>)}{!(grants ?? []).length ? <p className="ax-caption">{t("mvp3.security.noGrants", "No RLS-visible evidence grants.")}</p> : null}</section>
    </Shell>
  );
}
