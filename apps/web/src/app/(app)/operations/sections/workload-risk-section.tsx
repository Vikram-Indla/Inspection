import { useT } from "@/lib/i18n";
import OperationsWorkloadTable from "@/components/operations/operations-workload-table/operations-workload-table";
import OperationsRiskTable, { type RiskBand, type RiskRow } from "@/components/operations/operations-risk-table/operations-risk-table";
import type { OperationsData } from "@/features/operations/queries";
import { buildWorkloadRows, type OperationsModel } from "./model";
import { makeLabelers } from "./labels";

export default async function WorkloadRiskSection({ data, model }: {
  data: OperationsData;
  model: OperationsModel;
}) {
  const { t, locale } = await useT();
  const lab = makeLabelers(locale, t);
  const missing = lab.local("Not configured", "غير مهيأ");
  return (
    <>
      <OperationsWorkloadTable
        rows={buildWorkloadRows(data, model)}
        strings={{
          title: t("ops.workload.heading", "Inspector workload"),
          description: t("ops.workload.body", "Assigned, active, submitted and overdue visits in the current authorized geography."),
          inspector: t("ops.live.th.inspector", "Inspector"),
          assigned: t("ops.workload.assigned", "Assigned"),
          active: t("ops.workload.active", "Active"),
          completed: t("ops.workload.completed", "Submitted"),
          overdue: t("ops.workload.overdue", "Overdue"),
          emptyTitle: t("ops.workload.empty", "No inspector workload in this scope"),
        }}
      />
      <OperationsRiskTable
        rows={data.highRisk.map<RiskRow>(factory => ({
          id: factory.id,
          name: factory.name,
          href: `/factories/${factory.id}`,
          location: [factory.region, factory.city].filter(Boolean).join(" · ") || "—",
          score: factory.risk_score != null ? Number(factory.risk_score).toFixed(1) : missing,
          band: (factory.risk_band as RiskBand | null) ?? null,
          bandLabel: factory.risk_band ? lab.enumLabel(factory.risk_band) : "",
        }))}
        strings={{
          title: t("ops.risk.heading", "Risk monitoring"),
          description: t("ops.risk.body", "Read-only Risk Engine outputs in the current authorized scope."),
          factory: t("ops.risk.th.factory", "Factory"),
          location: t("ops.risk.th.location", "Location"),
          score: t("ops.risk.th.score", "Score"),
          band: t("ops.risk.th.band", "Band"),
          emptyTitle: t("ops.risk.empty", "No configured risk scores in this scope"),
          missing,
        }}
      />
    </>
  );
}
