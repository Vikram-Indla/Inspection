import React from "react";
export function DiffText({ type = "ins", children }) {
  return <span className={type === "del" ? "ax-diff-del" : "ax-diff-ins"}>{children}</span>;
}
