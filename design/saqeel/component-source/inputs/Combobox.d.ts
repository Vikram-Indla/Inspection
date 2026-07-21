export interface ComboboxProps {
  options?: Array<string | { value: string; label: string }>;
  /** single: string | null; multi: string[] */
  value?: any;
  onChange?: (value: any) => void;
  /** multi-select — selected values render as removable chips */
  multi?: boolean;
  placeholder?: string;
  disabled?: boolean;
  renderOption?: (opt: { value: string; label: string }) => any;
}
