import React from "react";
export function Freshness({ state = "live", children, className = "" }) {
  const mod = state === "live" ? "" : ` ax-freshness--${state}`;
  return <span className={"ax-freshness" + mod + " " + className}>{children}</span>;
}
