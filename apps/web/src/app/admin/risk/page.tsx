import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { NotYetBoundary } from "@/components/NotYetBoundary";
import RiskForm, { type RiskLabels } from "./RiskForm";

export const dynamic = "force-dynamic";

export default async function RiskStudio() {
  const { t } = await useT();
  const sb = await supabaseServer();
  const { data } = await sb.from("engine_settings").select("settings, version_label, updated_at").eq("engine", "risk").single();
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
  };

  return (
    <Shell current="/admin" title={t("admin.risk.title", "Risk Engine configuration")}
      context={<><span className="ax-lozenge ax-lozenge--info">SCR-ADM-060 · ENG-04</span><span className="ax-version">{data?.version_label}</span></>}>
      <div className="ax-banner"><div><strong>{t("admin.risk.banner.title", "This is the Risk Studio (MVP1 foundation scope).")}</strong> {t("admin.risk.banner.before", "Weights and bands are live configuration in")} <code>engine_settings</code> {t("admin.risk.banner.after", "— scores must be reproducible from stored inputs + this version (EV-004). Writes require the risk_owner role; RLS rejects everyone else. Every save lands in the immutable audit trail.")}</div></div>

      {!data && (
        <div className="ax-surface"><div className="ax-state">
          <span className="ax-state__glyph">⚖</span>
          <h4>{t("admin.risk.empty.title", "No risk model stored")}</h4>
          <p className="ax-caption">{t("admin.risk.empty.desc", "The engine_settings row for the risk engine is empty or not readable under your role.")}</p>
        </div></div>
      )}

      {data && s && (
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
