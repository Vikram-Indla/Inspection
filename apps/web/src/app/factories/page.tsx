import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import FactoryList, { type FactoryRow, type FactoryListStrings } from "./FactoryList";

export const dynamic = "force-dynamic";

// SCR-WEB-400 / M07-001 — factory registry (Factory 360 entry point).
export default async function Factories() {
  const { t } = await useT();
  const sb = await supabaseServer();
  const { data: fs, error } = await sb.from("factories")
    .select("id, factory_code, name, cr_number, region, city, risk_band, risk_score")
    .order("risk_score", { ascending: false });
  if (error) console.error("[factory registry] load failed", error);
  const listStrings: FactoryListStrings = {
    regionLabel: t("f360.list.region", "Region"),
    allRegions: t("f360.list.allRegions", "All regions"),
    of: t("f360.list.of", "of"),
    factoriesWord: t("f360.list.factoriesWord", "factories"),
    emptyRegionTitle: t("f360.list.emptyRegion.title", "No factories in this region"),
    emptyRegionDesc: t("f360.list.emptyRegion.desc", "Clear the filter to see the full registry."),
    thFactory: t("f360.list.th.factory", "Factory"),
    thCr: t("f360.list.th.cr", "CR"),
    thRegion: t("f360.list.th.region", "Region"),
    thCity: t("f360.list.th.city", "City"),
    thRisk: t("f360.list.th.risk", "Risk"),
    dossier: t("f360.list.dossier", "dossier"),
    bandLabels: {
      high: t("enum.high", "high"),
      medium: t("enum.medium", "medium"),
      low: t("enum.low", "low"),
    },
  };
  const isEmpty = (fs ?? []).length === 0;
  return (
    <Shell current="/factories" title={t("f360.title", "Factory 360")} context={<span className="ax-lozenge ax-lozenge--info">SCR-WEB-400</span>}>
      {error && <div className="ax-banner ax-banner--critical" role="alert"><div><strong>{t("f360.err.load", "Couldn’t load factories.")}</strong> {t("f360.err.neutral", "The factory registry is temporarily unavailable. Nothing was changed.")} — {t("f360.err.retry", "retry")}.</div></div>}
      {!error && isEmpty && (
        <div className="ax-surface"><div className="ax-state">
          <span className="ax-state__glyph">🏭</span><h4>{t("f360.empty.title", "No factories in the registry")}</h4>
          <p className="ax-caption">{t("f360.empty.desc", "Factory identity records sync from the national source (M07-002).")}</p></div></div>
      )}
      {!error && !isEmpty && <FactoryList factories={(fs ?? []) as FactoryRow[]} strings={listStrings} />}
    </Shell>
  );
}
