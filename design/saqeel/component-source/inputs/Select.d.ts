export interface SelectProps {
  options?: Array<string | { value: string; label: string }>;
  placeholder?: string;
  value?: string;
  disabled?: boolean;
  onChange?: (e: any) => void;
}
