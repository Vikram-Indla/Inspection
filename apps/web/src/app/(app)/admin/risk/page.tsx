import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { NotYetBoundary } from "@/components/NotYetBoundary";
import EmptyState from "@/components/EmptyState";
import RiskForm, { type RiskLabels } from "./RiskForm";
import { RiskSectionNav, type RiskNavLabels } from "./RiskSectionNav";

export const dynamic = "force-dynamic";

export default async function RiskStudio() {
  const { t } = await useT();
  const sb = await supabaseServer();
  const { data, error } = await sb.from("engine_settings").select("settings, version_label, updated_at").eq("engine", "risk").maybeSingle();
  if (error) console.error("[risk studio] load", error);
  const s = data?.settings as { factors: { key: string; weight: number }[]; bands: Record<string, number[]> } | undefined;

  const factors = (s?.factors ?? []).map(f => ({
    ...f,
    name: t(`enum.${f.key}`, f.key.replace(/_/g, " ")),
  }));

  const labels: RiskLabels = {
    factorsTitle: t("admin.risk.factors.title", "Factors & weights (must sum to 1.00)"),
    bandsTitle: t("admin.risk.bands.title", "Bands"),
    lowEnds: t("admin.risk.bands.lowEnds", "Low ends at"),
    mediumEnds: t("admin.risk.bands.mediumEnds", "Medium ends at"),
    high: t("admin.risk.bands.high", "High"),
    sumOk: t("admin.risk.sumOk", "Σ weights = 1.00 ✓"),
    sumBad: t("admin.risk.sumBad", "Σ weights = {sum} — must equal 1.00 before saving"),
    save: t("admin.risk.save", "Save configuration (risk_owner only)"),
    saving: t("admin.risk.saving", "Saving…"),
    saved: t("admin.risk.saved", "saved — effective immediately"),
    savedNote: t("admin.risk.savedNote", "Saving writes factors and bands to engine_settings after the weights-sum check, effective immediately for new score calculations — there is no draft or approval step on this screen."),
    lastUpdated: t("admin.risk.lastUpdated", "last updated"),
    bandLow: t("admin.risk.band.low", "Low"),
    bandMedium: t("admin.risk.band.medium", "Medium"),
    bandHigh: t("admin.risk.band.high", "High"),
    invalidBands: t("admin.risk.bands.invalid", "Bands must use whole numbers and cover 0–100 without gaps."),
    confirmLive: t("admin.risk.confirmLive", "I understand this configuration becomes effective immediately for new score calculations."),
  };
  const navLabels: RiskNavLabels = {
    label: t("admin.risk.nav.label", "Risk configuration"),
    studio: t("admin.risk.nav.studio", "Risk Studio"),
    studioHint: t("admin.risk.nav.studioHint", "Immediate-live settings"),
    models: t("admin.risk.nav.models", "Governed models"),
    modelsHint: t("admin.risk.nav.modelsHint", "Draft and maker-checker lifecycle"),
  };

  return (
    <Shell current="/admin/risk" title={t("admin.risk.title", "Risk Engine configuration")}
      context={<><span className="badge badge-info">SCR-ADM-060 · ENG-04</span><span className="sq-version">{data?.version_label}</span></>}>
      <RiskSectionNav current="/admin/risk" labels={navLabels} />
      <div className="sq-banner"><div><strong>{t("admin.risk.banner.title", "This is the Risk Studio (MVP1 foundation scope).")}</strong> {t("admin.risk.banner.before", "Weights and bands are live configuration in")} <code>engine_settings</code> {t("admin.risk.banner.after", "— scores must be reproducible from stored inputs + this version (EV-004). Writes require the risk_owner role; RLS rejects everyone else. Every save lands in the immutable audit trail.")}</div></div>

      {error && (
        <div className="sq-banner sq-banner--critical" role="alert"><div>
          <strong>{t("admin.risk.error.title", "Couldn’t load risk configuration.")}</strong>{" "}
          {t("admin.risk.error.body", "The existing configuration was not verified. Nothing changed; retry or check your risk-owner access.")}
        </div></div>
      )}

      {!error && !data && (
        <EmptyState glyph="⚖" title={t("admin.risk.empty.title", "No risk model stored")}
          body={t("admin.risk.empty.desc", "No risk configuration exists in your authorized scope. Create it through the governed provisioning process before using this studio.")} />
      )}

      {!error && data && s && (
        <RiskForm
          factors={factors}
          lowMax={s.bands?.low?.[1] ?? 39}
          medMax={s.bands?.medium?.[1] ?? 69}
          updatedAt={data.updated_at}
          labels={labels}
        />
      )}

      {/* Per-factory "why this score" trace needs a selected factory and its
          stored scoring inputs — neither is read on this settings screen. Shown
          as an honest boundary rather than a fabricated worked example. */}
      <div style={{ maxInlineSize: 720 }}>
        <NotYetBoundary
          title={t("admin.risk.trace.title", "Why this factory? — worked calculation trace")}
          consequence={t("admin.risk.trace.desc", "A line-by-line score trace isn’t shown here — this screen configures the model, not individual factories.")}
          seam="NEEDS_FACTORY_SCORING_INPUTS — per-factory trace"
          prerequisites={[
            t("admin.risk.trace.pre1", "A selected factory and its stored scoring inputs"),
            t("admin.risk.trace.pre2", "The per-factor normalized values used at scoring time"),
          ]}
          notAvailableLabel={t("admin.risk.notYet", "Not available yet")}
          detailLabel={t("common.whyPrereq", "Why / prerequisites")}
        />
      </div>
    </Shell>
  );
}
