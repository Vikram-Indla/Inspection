import { useT } from "@/lib/i18n";
import { getMessages } from "@/i18n/messages";
import type { OperationsData } from "@/features/operations/queries";
import type { OperationsScope } from "@/features/operations/scope";
import RevampOperationsCenter from "../RevampOperationsCenter";
import type { OperationsMapWorkspaceStrings } from "../OperationsMapWorkspace";
import { buildOperationsModel } from "./model";
import {
  buildHighlights, buildMapEntries, buildRegionalMapEntries, buildRegionSummaries,
  buildViewHrefs, makeLabelers,
} from "./labels";

export default async function OperationsOverview({ data, scope }: {
  data: OperationsData;
  scope: OperationsScope;
}) {
  const { t, locale } = await useT();
  const lab = makeLabelers(locale, t);
  const model = buildOperationsModel(data, scope);
  const { performanceAnchor } = buildViewHrefs(scope);
  const { common } = getMessages(locale);
  const mapStrings: OperationsMapWorkspaceStrings = {
    mapLabel: t("ops.map.workspaceLabel", "Operations map"),
    loadingTitle: t("ops.map.loading.title", "Loading KSA map"),
    loadingBody: t("ops.map.loading.body", "Mapbox renders in the browser only."),
    listHeading: t("ops.map.list.heading", "Map records"),
    listDescription: t("ops.map.list.description", "The list and map show the same records you can see."),
    emptyTitle: t("ops.map.empty.title", "No mappable factories in scope"),
    emptyBody: t("ops.map.empty.desc", "Factories gain map positions when GIS Admin records official coordinates (/006)."),
    open: t("ops.map.open", "Open"),
    selected: t("ops.map.selected", "Selected on map and list"),
    factory: t("ops.map.factory", "Factory 360"),
    visit: t("ops.map.visit", "visit"),
    preview: t("ops.map.preview", "Preview"),
    previewStrings: {
      inspectorTitle: t("ops.preview.inspector", "Inspector preview"),
      factoryTitle: t("ops.preview.factory", "Factory quick card"),
      close: t("ops.preview.close", "Close preview"),
      currentVisit: t("ops.preview.currentVisit", "Current visit"),
      operationalState: t("ops.preview.operationalState", "Visit status"),
      assignments: t("ops.preview.assignments", "Assignments in current scope"),
      lastGeoEvent: t("ops.preview.lastGeoEvent", "Last geo event"),
      noGeoEvent: t("ops.preview.noGeoEvent", "No recorded position"),
      openVisit: t("ops.preview.openVisit", "Open full visit"),
      location: t("ops.preview.location", "Location"),
      riskScore: t("ops.preview.riskScore", "Raw risk score"),
      riskRank: t("ops.preview.riskRank", "Visible rank"),
      riskUnavailable: t("ops.preview.riskUnavailable", "Unavailable"),
      activeVisits: t("ops.preview.activeVisits", "Active visits"),
      openActions: t("ops.preview.openActions", "Open corrective actions"),
      openFactory: t("ops.preview.openFactory", "Open Factory 360"),
    },
  };
  return (
    <>
      {data.loadErrors.length > 0 && (
        <div className="sq-banner sq-banner--critical" role="alert"><div>
          <strong>{t("ops.err.partial", "Some information could not be loaded.")}</strong> {data.loadErrors.join(" · ")}.{" "}
          <a className="sq-link" href="/operations">{t("ops.err.retry", "Retry")}</a>
        </div></div>
      )}
      {data.outOfScopeRecordCount > 0 && (
        <div className="sq-sr-only" role="status"><div>
          {t(
            "ops.outOfScopeGeography",
            lab.local(
              "Records outside your authorized region are excluded from this view. Excluded records:",
              "تُستبعد السجلات خارج نطاقك الجغرافي المخوَّل من هذا العرض. السجلات المستبعدة:",
            ),
          )} <strong>{data.outOfScopeRecordCount}</strong>
        </div></div>
      )}
      <RevampOperationsCenter
        locale={locale}
        view={scope.view}
        mapEntries={buildMapEntries(data, model, lab)}
        regionalMapEntries={buildRegionalMapEntries(data, model, lab)}
        mapStrings={mapStrings}
        counts={model.counts}
        monitoredCount={model.monitored.length}
        highlights={buildHighlights(data, model, lab, performanceAnchor, common.state.unavailable)}
        regions={buildRegionSummaries(data, model)}
      />
    </>
  );
}
