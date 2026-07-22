import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";
import { NotYetBoundary } from "@/components/NotYetBoundary";
import EmptyState from "@/components/EmptyState";
import { OpenCase } from "./OpenCase";
import { IconFolder } from "@/app/icons";

// TASK-MVP2-M2-10-CASE-SPINE-001 · MVP2-REQ-0114..0119 · CD-046 (case_spine_v1).
const MODES = ["off", "on"] as const;

export default async function CasesPage() {
  const { t } = await useT();
  if (resolveFeatureFlag(process.env.FEATURE_CASE_SPINE, MODES, "off") !== "on") {
    return (
      <Shell current="/cases" title={t("cases.title", "Cases")} context={<span className="badge badge-warning">CD-046 · REQ-0114</span>}>
        <NotYetBoundary title={t("cases.title", "Cases")} consequence={t("cases.off", "The correction/reinspection/appeal case spine is not enabled here.")}
          seam="FEATURE_CASE_SPINE=off" notAvailableLabel={t("tasks.notYet", "Not available yet")} detailLabel={t("common.whyPrereq", "Why / prerequisites")} />
      </Shell>
    );
  }
  const sb = await supabaseServer();
  const [{ data: rows, error }, { data: fac }] = await Promise.all([
    sb.from("cases").select("id, case_type, status, origin_type, opened_at").order("opened_at", { ascending: false }),
    sb.from("factories").select("id").limit(1).maybeSingle(),
  ]);
  if (error) console.error("[cases] load", error);
  const factoryId = fac?.id ?? null;
  return (
    <Shell current="/cases" title={t("cases.title", "Cases")} context={<span className="badge badge-info">CD-046 · REQ-0114..0119</span>}>
      <div className="sq-banner"><div><strong>{t("cases.banner.title", "Correction / reinspection / appeal.")}</strong> {t("cases.banner.body", "One open case per origin object is enforced by the database. You see only cases in your scope (RLS).")}</div></div>
      <OpenCase factoryId={factoryId} strings={{
        type: t("cases.type", "Case type"), open: t("cases.open", "Open case"), opening: t("cases.opening", "Opening…"),
        opened: t("cases.opened", "case opened"), noFactory: t("cases.noFactory", "No factory in scope to open a case against."),
      }} />
      {error && <div className="sq-banner sq-banner--critical" role="alert"><div><strong>{t("cases.error", "Couldn’t load cases. Nothing changed.")}</strong></div></div>}
      {!error && (rows ?? []).length === 0 && (
        <EmptyState icon={<IconFolder size={28} />} title={t("cases.empty.title", "No cases in your scope")}
          body={t("cases.empty.body", "Cases open from a review, violation or inspection. Empty may also mean none are in your scope (RLS).")} />
      )}
      {(rows ?? []).map((c) => (
        <div key={c.id} className="panel" style={{ padding: "var(--space-6)" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h3>{c.case_type} <span className="t-caption">· {c.origin_type ?? "—"}</span></h3>
            <span className="badge badge-info">{c.status}</span>
          </div>
        </div>
      ))}
    </Shell>
  );
}
