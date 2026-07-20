import React from "react";
export function Toast({ tone, children, className = "" }) {
  const mod = tone ? ` ax-toast--${tone}` : "";
  return <div className={"ax-toast" + mod + " " + className} role="status">{children}</div>;
}
