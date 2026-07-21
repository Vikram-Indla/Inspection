import React from "react";
export function FilterChip({ active, children, className = "", ...rest }) {
  return <button type="button" className={["ax-filterchip", active && "is-active", className].filter(Boolean).join(" ")} {...rest}>{children}</button>;
}
