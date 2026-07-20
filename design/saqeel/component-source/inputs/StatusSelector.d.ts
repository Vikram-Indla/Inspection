export interface StatusSelectorProps {
  value?: string;
  onChange?: (status: string) => void;
  /** subset of the 10 canonical statuses */
  statuses?: string[];
  disabled?: boolean;
}
