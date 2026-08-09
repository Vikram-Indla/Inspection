import { useT } from "@/lib/i18n";
import { getMessages } from "@/i18n/messages";
import OperationsSlaTable, { type SlaAlertRow } from "@/components/operations/operations-sla-table/operations-sla-table";
import OperationsKpiContract from "@/components/operations/operations-kpi-contract/operations-kpi-contract";
import type { OperationsData } from "@/features/operations/queries";
import type { OperationsModel } from "./model";
import { kpiMetricLabel, makeLabelers, slaKindLabel, type Labelers } from "./labels";

export function buildSlaAlertRows(
  model: OperationsModel,
  lab: Labelers,
  strings: { resubmissionOverdue: string; resubmissionPending: string; notConfigured: string },
): SlaAlertRow[] {
  return [
    ...model.slaFlags.map(flag => ({
      id: `visit:${flag.visit.id}`,
      visitHref: `/visits/${flag.visit.id}`,
      visitLabel: flag.visit.id.slice(0, 8),
      factoryName: flag.visit.factories?.name ?? "—",
      deadline: lab.fmtTs(flag.deadlineMs),
      status: slaKindLabel(lab, flag),
      overdue: flag.kind !== "reminder",
      escalation: flag.escalation,
    })),
    ...model.resubFlags.map(flag => ({
      id: `resubmission:${flag.inspection_id}`,
      visitHref: `/visits/${flag.visit_id}`,
      visitLabel: flag.visit_id.slice(0, 8),
      factoryName: flag.factory_name ?? "—",
      deadline: lab.fmtTs(flag.deadlineMs),
      status: flag.overdue ? strings.resubmissionOverdue : strings.resubmissionPending,
      overdue: flag.overdue,
      escalation: model.resubSlaAvailable ? null : strings.notConfigured,
    })),
  ];
}

const contractValue = (value: unknown, missing: string) => {
  if (value == null) return missing;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
};

export default async function SlaKpiSection({ data, model }: {
  data: OperationsData;
  model: OperationsModel;
}) {
  const { t, locale } = await useT();
  const lab = makeLabelers(locale, t);
  const { common: commonText, operations: opsText } = getMessages(locale);
  const missing = lab.local("Not configured", "غير مهيأ");
  const kpiContract = data.kpiContract;
  return (
    <>
      <OperationsSlaTable
        rows={buildSlaAlertRows(model, lab, {
          resubmissionOverdue: opsText.sla.resubmissionOverdue,
          resubmissionPending: opsText.sla.resubmissionPending,
          notConfigured: commonText.state.notConfigured,
        })}
        strings={{
          title: opsText.sla.title,
          description: opsText.sla.description,
          visit: opsText.sla.visit,
          factory: opsText.sla.factory,
          deadline: opsText.sla.deadline,
          status: opsText.sla.status,
          escalation: opsText.sla.escalation,
          emptyTitle: opsText.sla.emptyTitle,
        }}
      />
      <OperationsKpiContract
        configured={Boolean(kpiContract?.configured)}
        unavailable={data.kpiContractUnavailable}
        unauthorized={kpiContract?.authorized === false}
        facts={[
          { label: t("ops.kpi.period", "Calculation period"), value: contractValue(kpiContract?.period, missing) },
          { label: t("ops.kpi.timezone", "Timezone"), value: contractValue(kpiContract?.timezone, missing) },
          { label: t("ops.kpi.policyVersion", "Policy version"), value: contractValue(kpiContract?.policy_version, missing) },
          { label: t("ops.kpi.decision", "Decision authority"), value: kpiContract?.decision ?? t("common.notConfigured", "Not configured") },
        ]}
        rows={(kpiContract?.definitions ?? []).map(definition => ({
          key: definition.metric_key,
          metric: kpiMetricLabel(lab, definition.metric_key),
          sourceStatus: lab.enumLabel(definition.source_status),
          formula: definition.formula ?? null,
        }))}
        strings={{
          title: t("ops.kpi.contractHeading", "Operations KPI contract"),
          configured: t("ops.kpi.configured", "Published policy metadata and metric definitions are active."),
          notConfigured: t("ops.kpi.notConfigured", "Policy or published metric definitions are not set up. Undefined formulas stay unavailable."),
          metric: t("ops.kpi.metric", "Metric"),
          status: t("ops.kpi.status", "Source status"),
          formula: t("ops.kpi.formula", "Published formula"),
          unavailableTitle: t("ops.kpi.unavailable", "KPI contract service unavailable"),
          unavailableBody: t("ops.err.retry", "Retry"),
          unauthorizedTitle: t("ops.kpi.unauthorized", "KPI contract access is not authorized for this role"),
          emptyTitle: t("ops.kpi.emptyDefinitions", "No published metric definitions"),
          missing,
        }}
      />
    </>
  );
}
