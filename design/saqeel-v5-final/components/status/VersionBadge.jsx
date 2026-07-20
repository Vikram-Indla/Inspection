import React from "react";
export function VersionBadge({ children, className = "" }) {
  return <span className={"ax-version " + className}>{children}</span>;
}
