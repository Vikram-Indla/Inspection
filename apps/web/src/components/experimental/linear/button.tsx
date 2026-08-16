import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./button.module.css";

export type LinearButtonVariant = "primary" | "ghost" | "quiet";

const variantClass = {
  primary: styles.primary,
  ghost: styles.ghost,
  quiet: styles.quiet,
} as const;

export function Button({ variant = "ghost", type = "button", disabled = false, name, value, href, label, onClick, children }: {
  variant?: LinearButtonVariant;
  type?: "button" | "submit";
  disabled?: boolean;
  name?: string;
  value?: string;
  href?: string;
  label?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  const className = `${styles.button} ${variantClass[variant]}`;

  if (href) {
    return (
      <Link className={className} href={href} aria-label={label}>
        {children}
      </Link>
    );
  }

  return (
    <button
      className={className}
      type={type}
      disabled={disabled}
      name={name}
      value={value}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
