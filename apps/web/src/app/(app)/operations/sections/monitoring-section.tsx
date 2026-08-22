import { useT } from "@/lib/i18n";
import { getMessages } from "@/i18n/messages";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import OperationsMonitoringTable from "@/components/operations/operations-monitoring-table/operations-monitoring-table";
import OperationsScopeFilter from "@/components/operations/operations-scope-filter/operations-scope-filter";
import type { OperationsData } from "@/features/operations/queries";
import type { OperationsScope } from "@/features/operations/scope";
import { buildMonitorRows, type OperationsModel } from "./model";
import { makeLabelers } from "./labels";

export default async function MonitoringSection({ data, model, scope }: {
  data: OperationsData;
  model: OperationsModel;
  scope: OperationsScope;
}) {
  const { t, locale } = await useT();
  const lab = makeLabelers(locale, t);
  const { operations: opsText } = getMessages(locale);
  const enumLabels = Object.fromEntries(
    [...model.states, "inside", "outside", "override"].map(v => [v, lab.enumLabel(v)]));
  return (
    <Card as="section" labelledBy="operations-monitoring-heading">
      <CardHeader
        level="h2"
        titleId="operations-monitoring-heading"
        title={opsText.monitoring.title}
        trailing={
          <OperationsScopeFilter
            view={scope.view}
            region={scope.region}
            city={scope.city}
            regions={model.regions}
            cities={model.cities}
            basePath="/operations"
            strings={opsText.scope}
          />
        }
      />
      <CardBody>
        <OperationsMonitoringTable
          rows={buildMonitorRows(data, model)}
          refreshedAt={data.nowIso}
          enumLabels={enumLabels}
          strings={{
            visit: t("ops.live.th.visit", "Visit"),
            factory: t("ops.live.th.factory", "Factory"),
            state: t("ops.live.th.operational", "Visit status"),
            geofence: t("ops.live.th.geofence", "Geofence"),
            inspector: t("ops.live.th.inspector", "Inspector"),
            emptyTitle: t("ops.live.empty.title", "No published visits to monitor"),
            emptyBody: t("ops.live.empty.desc", "Visits appear here once planning publishes them."),
            refreshedAt: t("ops.live.refreshedAt", "Refreshed"),
            autoNote: t("ops.live.scopeNote", "Records limited to your access"),
          }}
        />
      </CardBody>
    </Card>
  );
}
