/** Form field wrapper — auto-wires label/for, aria-describedby (hint), aria-invalid and aria-errormessage onto its control. Errors preserve user work (ERR-SUB-001). */
export interface FieldProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  invalid?: boolean;
  /** iPad field-critical sizing (17px text, 52px controls) */
  field?: boolean;
  children?: React.ReactNode;
  className?: string;
}
export declare function Field(props: FieldProps): JSX.Element;
