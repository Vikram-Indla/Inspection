/* @retiring 2026-08-08 · replaced-by design/final-cut/saqeel-revamp.html · pending web-admin-m3-operations.spec.ts · delete-when 0-imports */
import type { OperationsData } from "@/features/operations/queries";
import type { OperationsScope } from "@/features/operations/scope";
import styles from "../operations.module.css";
import { buildOperationsModel } from "./model";
import MonitoringSection from "./monitoring-section";
import SlaKpiSection from "./sla-kpi-section";
import WorkloadRiskSection from "./workload-risk-section";
import AlertsSection from "./alerts-section";
import QueuesSection from "./queues-section";
import TimelineHistorySection from "./timeline-history-section";
import ExportSection from "./export-section";

export default function OperationsDetails({ data, scope }: {
  data: OperationsData;
  scope: OperationsScope;
}) {
  const model = buildOperationsModel(data, scope);
  return (
    <div className={styles.operationalDetails}>
      <MonitoringSection data={data} model={model} scope={scope} />
      <SlaKpiSection data={data} model={model} />
      <WorkloadRiskSection data={data} model={model} />
      <AlertsSection data={data} />
      <QueuesSection data={data} />
      <TimelineHistorySection model={model} scope={scope} />
      <ExportSection data={data} model={model} scope={scope} />
    </div>
  );
}
