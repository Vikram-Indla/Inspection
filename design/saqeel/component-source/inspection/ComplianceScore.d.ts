export interface ComplianceScoreProps {
  /** 0–100; tone bands: ≥90 compliant, ≥70 warning, else critical */
  value?: number;
  size?: number;
  label?: string;
}
