export interface DateRangePickerProps {
  from?: string;
  to?: string;
  onChange?: (range: { from?: string; to?: string }) => void;
  min?: string; max?: string;
  disabled?: boolean;
}
