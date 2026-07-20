export interface InputProps {
  /** text | number | password | search | date | time | tel */
  type?: string;
  /** IBM Plex Mono + forced LTR — identifiers, coordinates, reference codes */
  mono?: boolean;
  /** leading icon (16px Lucide) */
  icon?: React.ReactNode;
  placeholder?: string;
  value?: string;
  disabled?: boolean;
  readOnly?: boolean;
  onChange?: (e: any) => void;
}
