/** Metric strip — rules not boxes; values use the 28/32 metric token (display 32/40 max once per page). */
export interface MetricStripProps {
  items: { label: React.ReactNode; value: React.ReactNode; sub?: React.ReactNode; tone?: "success" | "warning" | "critical" }[];
  className?: string;
}
export declare function MetricStrip(props: MetricStripProps): JSX.Element;
