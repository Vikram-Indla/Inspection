export interface TextAreaProps {
  rows?: number;
  placeholder?: string;
  value?: string;
  disabled?: boolean;
  readOnly?: boolean;
  onChange?: (e: any) => void;
}
