export interface MetricStripProps {
  items?: Array<{ label: string; value: React.ReactNode; tone?: "critical" | "warning" | "compliant" }>;
}
