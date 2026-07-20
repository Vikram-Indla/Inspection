/** KPI value (V4.1) — 28/32 metric token, flat (no bordered card); values trace to records (P12). Prefer MetricStrip for rows of KPIs.
 * @startingPoint section="Data" subtitle="Traceable KPI value" viewport="700x180" */
export interface KpiCardProps {
  label: React.ReactNode;
  value: React.ReactNode;
  delta?: React.ReactNode;
  deltaDirection?: "up" | "down";
  trace?: { label?: string; href?: string };
  stale?: boolean;
  className?: string;
}
export declare function KpiCard(props: KpiCardProps): JSX.Element;
