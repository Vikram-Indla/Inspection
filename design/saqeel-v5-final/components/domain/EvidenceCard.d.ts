/** Evidence gallery card with canonical image/video icons, custody metadata and linkage. */
export interface EvidenceCardProps {
  icon?: React.ReactNode;
  kind?: "image" | "video";
  state?: "linked" | "unsynced" | "quarantined" | "uploading";
  linked?: React.ReactNode;
  meta?: React.ReactNode[];
  className?: string;
}
export declare function EvidenceCard(props: EvidenceCardProps): JSX.Element;
