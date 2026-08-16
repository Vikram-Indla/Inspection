import type { ReactNode } from "react";
import styles from "./button.module.css";

export type LinearButtonVariant = "primary" | "ghost" | "quiet";

const variantClass = {
  primary: styles.primary,
  ghost: styles.ghost,
  quiet: styles.quiet,
} as const;

export function Button({ variant = "ghost", type = "button", disabled = false, name, value, onClick, children }: {
  variant?: LinearButtonVariant;
  type?: "button" | "submit";
  disabled?: boolean;
  name?: string;
  value?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      className={`${styles.button} ${variantClass[variant]}`}
      type={type}
      disabled={disabled}
      name={name}
      value={value}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
