import React from "react";
export function StatusChip({ tone, children, className = "" }) {
  const map = { ok: "ax-chip--ok", warn: "ax-chip--warn", crit: "ax-chip--crit", info: "ax-chip--info-tone", lock: "ax-chip--lock" };
  return <span className={["ax-chip", tone && map[tone], className].filter(Boolean).join(" ")}>{children}</span>;
}
