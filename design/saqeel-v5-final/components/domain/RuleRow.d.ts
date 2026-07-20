/** Rule builder row (criteria AND/OR — risk studio, bulk targeting). */
export interface RuleRowProps { op?: "AND" | "OR" | string; children?: React.ReactNode; className?: string; }
export declare function RuleRow(props: RuleRowProps): JSX.Element;
