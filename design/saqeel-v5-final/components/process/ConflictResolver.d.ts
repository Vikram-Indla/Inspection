/** Two-sided conflict resolver — silent overwrite is prohibited (STM-SYNC-002, ERR-OFF-002). */
export interface ConflictResolverProps {
  title?: React.ReactNode;
  local: React.ReactNode;
  server: React.ReactNode;
  onKeepLocal?: () => void;
  onKeepServer?: () => void;
  className?: string;
}
export declare function ConflictResolver(props: ConflictResolverProps): JSX.Element;
