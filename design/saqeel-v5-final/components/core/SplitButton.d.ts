/** Split button — primary action + chevron menu trigger. */
export interface SplitButtonProps {
  label: React.ReactNode;
  onPrimary?: () => void;
  variant?: "primary" | "secondary";
  children?: React.ReactNode;
}
export declare function SplitButton(props: SplitButtonProps): JSX.Element;
