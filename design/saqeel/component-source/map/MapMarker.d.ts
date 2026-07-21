export interface MapMarkerProps {
  kind?: "facility" | "vehicle" | "inspector" | "zone";
  /** status colour carries meaning — matches StatusBadge semantics */
  tone?: "critical" | "major" | "warning" | "compliant" | "info" | "pending";
  label?: string;
  selected?: boolean;
}
