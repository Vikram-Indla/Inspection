/** Validation summary — exact blockers with deep links (ERR-SUB-001). */
export interface ValidationSummaryProps {
  title: React.ReactNode;
  blockers?: ({ label: React.ReactNode; href?: string } | string)[];
  /** All clear (success tint) */
  clear?: boolean;
  className?: string;
}
export declare function ValidationSummary(props: ValidationSummaryProps): JSX.Element;
