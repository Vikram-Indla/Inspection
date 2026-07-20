/** One principal action per zone. Loading retains its visible label. */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "subtle" | "danger" | "danger-subtle";
  size?: "compact" | "default" | "prominent" | "field";
  icon?: React.ReactNode;
  loading?: boolean;
  /** Required whenever disabled; connected through aria-describedby. */
  disabledReason?: string;
}
export declare function Button(props: ButtonProps): JSX.Element;
