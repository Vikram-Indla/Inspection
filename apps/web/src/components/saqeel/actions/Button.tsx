import React from "react";
import { cls } from "../cls";

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** primary = the one emerald action per view; danger = destructive */
  variant?: "primary" | "secondary" | "tertiary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  /** square icon-only button — supply aria-label */
  iconOnly?: boolean;
  icon?: React.ReactNode;
  block?: boolean;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", loading, iconOnly, icon, block, children, className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cls(
        "btn",
        "btn-" + variant,
        size !== "md" && "btn-" + size,
        iconOnly && "btn-icon",
        block && "btn-block",
        loading && "is-loading",
        className,
      )}
      aria-busy={loading || undefined}
      {...rest}
    >
      {icon}
      {!iconOnly && children}
    </button>
  );
});
