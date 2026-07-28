import Shell from "@/app/(app)/admin/_components/AdminShell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";
import EmptyState from "@/components/EmptyState";
import { IconChart } from "@/app/icons";
import { NotYetBoundary } from "@/components/NotYetBoundary";
import { RiskModelsBoard, type RiskModelRow, type RiskStrings } from "./RiskModels";
import { RiskSectionNav, type RiskNavLabels } from "../RiskSectionNav";

// TASK-MVP2-M2-04-RISK-TARGETING-001 · MVP2-REQ-0005..0012 · CD-032 (risk_workbench_v2).
const MODES = ["off", "on"] as const;

export default async function RiskModelsPage() {
  const { t } = await useT();
  const navLabels: RiskNavLabels = {
    label: t("admin.risk.nav.label", "Risk configuration"),
    studio: t("admin.risk.nav.studio", "Risk Studio"),
    studioHint: t("admin.risk.nav.studioHint", "Immediate-live settings"),
    models: t("admin.risk.nav.models", "Governed models"),
    modelsHint: t("admin.risk.nav.modelsHint", "Draft and maker-checker lifecycle"),
  };
  const enabled = resolveFeatureFlag(process.env.FEATURE_RISK_WORKBENCH, MODES, "off") === "on";
  if (!enabled) {
    return (
      <Shell current="/admin/risk" title={t("risk.wb.title", "Risk model workbench")}
        context={<span className="badge badge-warning">MVP2-REQ-0005</span>}>
        <RiskSectionNav current="/admin/risk/models" labels={navLabels} />
        <NotYetBoundary title={t("risk.wb.title", "Risk model workbench")}
          consequence={t("risk.wb.off", "The governed risk-model draft layer is not enabled here; live risk config is still edited on the Risk Studio.")}
          seam="FEATURE_RISK_WORKBENCH=off" notAvailableLabel={t("tasks.notYet", "Not available yet")} detailLabel={t("common.whyPrereq", "Why / prerequisites")} />
      </Shell>
    );
  }
  const sb = await supabaseServer();
  const { data: rows, error } = await sb.from("risk_models")
    .select("id, version_label, status, row_version, payload, created_at, updated_at").order("created_at", { ascending: false });
  if (error) console.error("[risk models] load", error);
  const strings: RiskStrings = {
    newLabel: t("risk.wb.newLabel", "New draft version label"),
    payload: t("risk.wb.payload", "Model payload (factors[] weights sum to 1.00 · bands 0..100)"),
    create: t("risk.wb.create", "Create draft"), creating: t("risk.wb.creating", "Creating…"),
    created: t("risk.wb.created", "draft created"),
    transition: t("risk.wb.transition", "Transition"), apply: t("risk.wb.apply", "Apply"),
    applying: t("risk.wb.applying", "Applying…"), done: t("risk.wb.done", "done"),
    reasonPh: t("risk.wb.reason", "Reason"),
    factorKey: t("risk.wb.factorKey", "Factor key"),
    factorWeight: t("risk.wb.factorWeight", "Weight"),
    addFactor: t("risk.wb.addFactor", "Add factor"),
    removeFactor: t("risk.wb.removeFactor", "Remove"),
    lowEnds: t("risk.wb.lowEnds", "Low ends at"),
    mediumEnds: t("risk.wb.mediumEnds", "Medium ends at"),
    validationReady: t("risk.wb.validationReady", "Canonical structure valid"),
    validationNeeded: t("risk.wb.validationNeeded", "Complete a valid model before creating the draft"),
    inspect: t("risk.wb.inspect", "Model structure"),
    immutable: t("risk.wb.immutable", "Published versions are immutable"),
    noTransitions: t("risk.wb.noTransitions", "No further transitions"),
  };
  return (
    <Shell current="/admin/risk" title={t("risk.wb.title", "Risk model workbench")}
      context={<span className="badge badge-info">MVP2-REQ-0005..0012</span>}>
      <RiskSectionNav current="/admin/risk/models" labels={navLabels} />
      <div className="alert"><div><strong>{t("risk.wb.banner.title", "Governed draft layer.")}</strong> {t("risk.wb.banner.body", "Drafts validate weights-sum and bands (parity with Risk Studio) and publish through maker-checker; published versions are immutable. No policy value is set here that the accepted structure does not require.")}</div></div>
      {error && <div className="alert alert-critical" role="alert"><div><strong>{t("risk.wb.error", "Couldn’t load risk models. Nothing changed.")}</strong></div></div>}
      {!error && (rows ?? []).length === 0 && (
        <EmptyState icon={<IconChart size={28} />} title={t("risk.wb.empty.title", "No risk model drafts")}
          body={t("risk.wb.empty.body", "No governed risk models exist in your authorized scope. Create a draft to begin the maker-checker lifecycle.")} />
      )}
      {!error && <RiskModelsBoard rows={(rows ?? []) as RiskModelRow[]} strings={strings} />}
    </Shell>
  );
}
