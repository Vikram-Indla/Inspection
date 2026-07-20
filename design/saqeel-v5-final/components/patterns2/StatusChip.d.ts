/** Status chip — glyph + word, 3:1 boundary. Pills are reserved for filters and status chips only. */
export interface StatusChipProps { tone?: "ok" | "warn" | "crit" | "info" | "lock"; children?: React.ReactNode; className?: string; }
export declare function StatusChip(props: StatusChipProps): JSX.Element;
