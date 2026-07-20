import React from "react";
const cls = (...a) => a.filter(Boolean).join(" ");
export function Button({ variant = "secondary", size = "md", loading, iconOnly, icon, block, children, className, ...rest }) {
  return (
    <button
      className={cls("btn", "btn-" + variant, size !== "md" && "btn-" + size, iconOnly && "btn-icon", block && "btn-block", loading && "is-loading", className)}
      aria-busy={loading || undefined} {...rest}>
      {icon}{!iconOnly && children}
    </button>
  );
}