export interface RadioGroupProps {
  name: string;
  options?: Array<string | { value: string; label: string; help?: string; disabled?: boolean }>;
  value?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}
