import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";
import { NotYetBoundary } from "@/components/NotYetBoundary";
import EmptyState from "@/components/EmptyState";
import { CreateRequest } from "./CreateRequest";

// TASK-MVP2-M2-08-EXTERNAL-PORTAL-001 · MVP2-REQ-0109..0113 · CD-044 (external_portal_v1).
// Internal review view of external requests + self-assessments. External-rep
// IDENTITY is HELD — no external session is authorised here; this is the internal
// compliance-facing surface (RLS-scoped).
export const dynamic = "force-dynamic";
const MODES = ["off", "on"] as const;

export default async function PortalPage() {
  const { t } = await useT();
  if (resolveFeatureFlag(process.env.FEATURE_EXTERNAL_PORTAL, MODES, "off") !== "on") {
    return (
      <Shell current="/portal" title={t("portal.title", "External portal")} context={<span className="ax-lozenge ax-lozenge--warning">CD-044 · REQ-0109</span>}>
        <NotYetBoundary title={t("portal.title", "External portal")} consequence={t("portal.off", "The external factory portal is not enabled here. External-representative identity policy is also held.")}
          seam="FEATURE_EXTERNAL_PORTAL=off + external identity policy held" notAvailableLabel={t("tasks.notYet", "Not available yet")} detailLabel={t("common.whyPrereq", "Why / prerequisites")} />
      </Shell>
    );
  }
  const sb = await supabaseServer();
  const [{ data: reqs, error: e1 }, { data: sas, error: e2 }, { data: fac }] = await Promise.all([
    sb.from("external_requests").select("id, request_type, status, subject, created_at").order("created_at", { ascending: false }),
    sb.from("self_assessments").select("id, status, risk_signal_emitted, created_at").order("created_at", { ascending: false }),
    sb.from("factories").select("id").limit(1).maybeSingle(),
  ]);
  const error = e1 || e2;
  if (error) console.error("[portal] load", error);
  const factoryId = fac?.id ?? null;
  return (
    <Shell current="/portal" title={t("portal.title", "External portal")} context={<span className="ax-lozenge ax-lozenge--info">CD-044 · REQ-0109..0113</span>}>
      <div className="ax-banner"><div><strong>{t("portal.banner.title", "Internal compliance view.")}</strong> {t("portal.banner.body", "External requests and self-assessments. Only accepted self-assessments emit a risk signal. External-representative identity/MFA is held; this surface is internal and RLS-scoped.")}</div></div>
      <CreateRequest factoryId={factoryId} strings={{
        type: t("portal.type", "Request type"), subject: t("portal.subject", "Subject"),
        create: t("portal.create", "Create request"), creating: t("portal.creating", "Creating…"),
        created: t("portal.created", "request created"), noFactory: t("portal.noFactory", "No factory in scope."),
      }} />
      {error && <div className="ax-banner ax-banner--critical" role="alert"><div><strong>{t("portal.error", "Couldn’t load portal data. Nothing changed.")}</strong></div></div>}
      {!error && (reqs ?? []).length === 0 && (sas ?? []).length === 0 && (
        <EmptyState glyph="🏭" title={t("portal.empty.title", "No external submissions in scope")}
          body={t("portal.empty.body", "Requests and self-assessments appear here once submitted. Empty may also mean none are in your scope (RLS).")} />
      )}
      {(reqs ?? []).map((r) => (
        <div key={r.id} className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <div className="row" style={{ justifyContent: "space-between" }}><h3>{r.request_type} <span className="ax-caption">{r.subject ?? ""}</span></h3><span className="ax-lozenge ax-lozenge--info">{r.status}</span></div>
        </div>
      ))}
      {(sas ?? []).map((a) => (
        <div key={a.id} className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <div className="row" style={{ justifyContent: "space-between" }}><h3>{t("portal.sa", "Self-assessment")}</h3>
            <span className={`ax-lozenge ${a.risk_signal_emitted ? "ax-lozenge--success" : "ax-lozenge--warning"}`}>{a.status}</span></div>
        </div>
      ))}
    </Shell>
  );
}
