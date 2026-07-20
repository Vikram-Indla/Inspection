import React from "react";
export function Lozenge({ domain, tone, live, children, className = "", ...rest }) {
  const cls = ["ax-lozenge", domain && `ax-lozenge--${domain}`, tone && `ax-lozenge--${tone}`, live && "ax-lozenge--live", className].filter(Boolean).join(" ");
  return <span className={cls} {...rest}>{children}</span>;
}
