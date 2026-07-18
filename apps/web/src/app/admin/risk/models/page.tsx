import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";
import { NotYetBoundary } from "@/components/NotYetBoundary";
import { RiskModelsBoard, type RiskModelRow, type RiskStrings } from "./RiskModels";

// TASK-MVP2-M2-04-RISK-TARGETING-001 · MVP2-REQ-0005..0012 · CD-032 (risk_workbench_v2).
export const dynamic = "force-dynamic";
const MODES = ["off", "on"] as const;

export default async function RiskModelsPage() {
  const { t } = await useT();
  const enabled = resolveFeatureFlag(process.env.FEATURE_RISK_WORKBENCH, MODES, "off") === "on";
  if (!enabled) {
    return (
      <Shell current="/admin/risk" title={t("risk.wb.title", "Risk model workbench")}
        context={<span className="ax-lozenge ax-lozenge--warning">CD-032 · MVP2-REQ-0005</span>}>
        <NotYetBoundary title={t("risk.wb.title", "Risk model workbench")}
          consequence={t("risk.wb.off", "The governed risk-model draft layer is not enabled here; live risk config is still edited on the Risk Studio.")}
          seam="FEATURE_RISK_WORKBENCH=off" notAvailableLabel={t("tasks.notYet", "Not available yet")} detailLabel={t("common.whyPrereq", "Why / prerequisites")} />
      </Shell>
    );
  }
  const sb = await supabaseServer();
  const { data: rows, error } = await sb.from("risk_models")
    .select("id, version_label, status, row_version").order("created_at", { ascending: false });
  if (error) console.error("[risk models] load", error);
  const strings: RiskStrings = {
    newLabel: t("risk.wb.newLabel", "New draft version label"),
    payload: t("risk.wb.payload", "Model payload (factors[] weights sum to 1.00 · bands 0..100)"),
    create: t("risk.wb.create", "Create draft"), creating: t("risk.wb.creating", "Creating…"),
    created: t("risk.wb.created", "draft created"),
    transition: t("risk.wb.transition", "Transition"), apply: t("risk.wb.apply", "Apply"),
    applying: t("risk.wb.applying", "Applying…"), done: t("risk.wb.done", "done"),
    reasonPh: t("risk.wb.reason", "Reason"),
  };
  return (
    <Shell current="/admin/risk" title={t("risk.wb.title", "Risk model workbench")}
      context={<span className="ax-lozenge ax-lozenge--info">CD-032 · MVP2-REQ-0005..0012</span>}>
      <div className="ax-banner"><div><strong>{t("risk.wb.banner.title", "Governed draft layer.")}</strong> {t("risk.wb.banner.body", "Drafts validate weights-sum and bands (parity with Risk Studio) and publish through maker-checker; published versions are immutable. No policy value is set here that the accepted structure does not require.")}</div></div>
      {error && <div className="ax-banner ax-banner--critical" role="alert"><div><strong>{t("risk.wb.error", "Couldn’t load risk models. Nothing changed.")}</strong></div></div>}
      {!error && (rows ?? []).length === 0 && (
        <div className="ax-surface"><div className="ax-state"><span className="ax-state__glyph">📊</span>
          <h4>{t("risk.wb.empty.title", "No risk model drafts")}</h4>
          <p className="ax-caption">{t("risk.wb.empty.body", "Create a draft to compose a governed risk model. Empty may also mean none are in your scope (RLS).")}</p></div></div>
      )}
      <RiskModelsBoard rows={(rows ?? []) as RiskModelRow[]} strings={strings} />
    </Shell>
  );
}
