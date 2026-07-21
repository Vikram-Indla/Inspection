import React, { useId } from "react";

export function Button({
  variant = "primary",
  size,
  icon,
  loading = false,
  disabled = false,
  disabledReason,
  children,
  className = "",
  ...rest
}) {
  const reasonId = useId();
  const classes = [
    "ax-btn",
    variant !== "primary" && `ax-btn--${variant}`,
    size === "prominent" && "ax-btn--prominent",
    size === "field" && "ax-btn--field",
    size === "compact" && "ax-btn--compact",
    icon && !children && "ax-btn--icon",
    loading && "is-loading",
    className,
  ].filter(Boolean).join(" ");

  const unavailable = disabled || loading;
  const describedBy = [
    rest["aria-describedby"],
    disabled && disabledReason ? reasonId : null,
  ].filter(Boolean).join(" ") || undefined;

  return (
    <>
      <button
        type="button"
        className={classes}
        disabled={unavailable}
        aria-busy={loading || undefined}
        aria-disabled={unavailable || undefined}
        aria-describedby={describedBy}
        {...rest}
      >
        {icon}
        {children}
      </button>
      {disabled && disabledReason ? <span id={reasonId} className="ax-sr-only">{disabledReason}</span> : null}
    </>
  );
}
