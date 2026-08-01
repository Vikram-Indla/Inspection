import Shell from "@/components/Shell";
import { useT } from "@/lib/i18n";

// SCR-WEB-500 — loading state (web.md: every screen needs loading/empty/error states)
export default async function Loading() {
  const { t } = await useT();
  return (
    <Shell current="/operations" title={t("ops.title", "Operations Center")}>
      <div className="stack" role="status" aria-label={t("ops.loading.title", "Loading Operations Center…")} aria-busy="true">
        <div className="seg" aria-hidden="true">
          <span className="seg-opt">{t("ops.views.map", "Operations Map")}</span>
          <span className="seg-opt">{t("ops.views.performance", "National Performance")}</span>
        </div>
        <div className="kpi-grid" aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => <div className="panel kpi skeleton" key={index} />)}
        </div>
        <div className="map-panel skeleton" aria-hidden="true" />
        <span className="tl-meta">{t("ops.loading.desc", "Loading visits, location events, corrective actions and notifications.")}</span>
      </div>
    </Shell>
  );
}
