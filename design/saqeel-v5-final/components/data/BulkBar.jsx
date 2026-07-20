import React from "react";
export function BulkBar({ count, label = "selected", children, className = "" }) {
  return <div className={"ax-bulkbar " + className}><span>{count} {label}</span>{children}</div>;
}
