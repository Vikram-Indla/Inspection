export interface EvidenceCardProps {
  src?: string;
  kind?: "photo" | "document";
  caption?: string;
  /** timestamp · coordinates */
  meta?: string;
  onOpen?: () => void;
  onRemove?: () => void;
}
