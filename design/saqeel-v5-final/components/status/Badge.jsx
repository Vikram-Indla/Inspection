import React from "react";
export function Badge({ critical, children, className = "" }) {
  return <span className={"ax-badge" + (critical ? " ax-badge--critical" : "") + " " + className}>{children}</span>;
}
