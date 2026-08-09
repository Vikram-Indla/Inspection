import { useT } from "@/lib/i18n";
import OperationsExport from "@/components/operations/operations-export/operations-export";
import type { OperationsData } from "@/features/operations/queries";
import type { OperationsScope } from "@/features/operations/scope";
import OpsExport, { type ExportDataset, type OpsExportStrings } from "../OpsExport";
import { buildMonitorRows, type OperationsModel } from "./model";
import { buildHighlights, buildViewHrefs, kpiMetricLabel, makeLabelers } from "./labels";

export default async function ExportSection({ data, model, scope }: {
  data: OperationsData;
  model: OperationsModel;
  scope: OperationsScope;
}) {
  const { t, locale } = await useT();
  const lab = makeLabelers(locale, t);
  const { performanceAnchor } = buildViewHrefs(scope);
  const highlights = buildHighlights(data, model, lab, performanceAnchor);
  const monitorRows = buildMonitorRows(data, model);
  const notConfigured = lab.local("Not configured", "غير مهيأ");
  const exportStrings: OpsExportStrings = {
    heading: t("ops.export.heading", "Export CSV:"),
    scopeNote: t("ops.export.scopeNote", "The receipt and CSV use this exact region/city scope and row count."),
    authorizing: t("ops.export.authorizing", "Authorizing and recording export…"),
    authorized: t("ops.export.authorized", "Export authorized. Receipt:"),
    unavailable: t("ops.export.unavailable", "Export authorization is unavailable. No file was generated."),
  };
  const exportFilters = {
    region: data.routeRoleKeys.includes("admin") ? scope.region : data.authorizedScope,
    view_region: scope.region,
    city: scope.city,
  };
  const exportDatasets: ExportDataset[] = [
    {
      key: "visits",
      label: t("ops.export.monitoring", "Live monitoring"),
      filename: "ops_monitoring.csv",
      filters: exportFilters,
      headers: [
        t("ops.live.th.visit", "Visit"), t("ops.live.th.factory", "Factory"),
        t("ops.live.th.operational", "Visit status"), t("ops.live.th.geofence", "Geofence"),
        t("ops.live.th.inspector", "Inspector"),
      ],
      rows: monitorRows.map(r => [
        r.id.slice(0, 8), r.factory_name ?? "—", lab.enumLabel(r.operational_state),
        r.geofence ? lab.enumLabel(r.geofence) : "—", r.inspector ?? "—",
      ]),
    },
    {
      key: "alerts",
      label: t("ops.export.alerts", "Operational alerts"),
      filename: "ops_alerts.csv",
      filters: exportFilters,
      headers: [
        t("ops.export.alertType", "Alert type"),
        t("ops.export.alertSummary", "Summary"),
        t("ops.export.alertTime", "Recorded at"),
        t("ops.export.alertDestination", "Destination"),
      ],
      rows: highlights.map(item => [item.label, item.description, lab.fmtTs(item.at), item.href]),
    },
    {
      key: "kpis",
      label: t("ops.export.kpis", "KPI contract"),
      filename: "ops_kpi_contract.csv",
      filters: exportFilters,
      headers: [
        t("ops.kpi.metric", "Metric"),
        t("ops.kpi.status", "Source status"),
        t("ops.kpi.formula", "Published formula"),
        t("ops.kpi.policyVersion", "Policy version"),
      ],
      rows: (data.kpiContract?.definitions ?? []).map(definition => [
        kpiMetricLabel(lab, definition.metric_key),
        definition.source_status,
        definition.formula ?? notConfigured,
        data.kpiContract?.policy_version != null
          ? String(data.kpiContract.policy_version)
          : notConfigured,
      ]),
    },
  ];
  return (
    <OperationsExport
      authorized={data.routeRoleKeys.some(role => ["supervisor", "admin"].includes(role))}
      strings={{
        title: t("ops.export.heading", "Export data"),
        description: t("ops.export.auditRequired", "Every file needs a matching database receipt for your role and region, plus a recorded audit event, before you can download it."),
        unauthorizedTitle: t("ops.export.unauthorized", "Export is not authorized for this role"),
      }}
    >
      <OpsExport datasets={exportDatasets} strings={exportStrings} />
    </OperationsExport>
  );
}
