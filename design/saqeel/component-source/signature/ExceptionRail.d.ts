export interface ExceptionMarkProps {
  tone?: "critical" | "major" | "warning" | "pending" | "onhold" | "info" | "compliant" | "completed" | "disabled";
  label?: string;
  /** icon-only contexts (map, dense tables) — keeps a screen-reader label */
  hideLabel?: boolean;
}
