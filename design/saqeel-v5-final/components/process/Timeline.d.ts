/** Audit timeline — actor, action, time, version. Append-only: no edit affordances (ENG-12, MVP1-FND-003). */
export interface TimelineProps {
  items: { actor: React.ReactNode; action: React.ReactNode; time: React.ReactNode; version?: string; detail?: React.ReactNode; key?: boolean }[];
  className?: string;
}
export declare function Timeline(props: TimelineProps): JSX.Element;
