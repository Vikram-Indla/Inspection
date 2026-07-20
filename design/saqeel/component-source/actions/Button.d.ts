/** @startingPoint section="Actions" subtitle="All action variants, sizes and states" viewport="700x260" */
export interface ButtonProps {
  /** primary = the one emerald action per view; danger = destructive */
  variant?: "primary" | "secondary" | "tertiary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  /** square icon-only button — supply aria-label */
  iconOnly?: boolean;
  icon?: React.ReactNode;
  block?: boolean;
  disabled?: boolean;
  onClick?: (e: any) => void;
  children?: React.ReactNode;
}
