/** Data freshness chrome — stale data never presented as live (FND-013). */
export interface FreshnessProps { state?: "live" | "stale" | "dead"; children?: React.ReactNode; className?: string; }
export declare function Freshness(props: FreshnessProps): JSX.Element;
