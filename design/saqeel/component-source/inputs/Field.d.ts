export interface FieldProps {
  label?: string;
  required?: boolean;
  help?: string;
  /** replaces help; announces via role=alert */
  error?: string;
  htmlFor?: string;
  children?: React.ReactNode;
}
