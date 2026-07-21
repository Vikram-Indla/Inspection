import React from "react";
export function SyncChip({ state = "synced", children, className = "" }) {
  return <span className={`ax-sync ax-sync--${state} ` + className}>{children}</span>;
}
