/** Offline/sync indicator — persistent iPad shell chrome; 6 states always visible.
 * @startingPoint section="Primitives" subtitle="6-state offline sync chip" viewport="700x150" */
export interface SyncChipProps {
  state: "synced" | "offline" | "pending" | "syncing" | "conflict" | "failed";
  children?: React.ReactNode;
  className?: string;
}
export declare function SyncChip(props: SyncChipProps): JSX.Element;
