import React from "react";
export function Tooltip({ tip, children, className = "" }) {
  return <span className={"ax-tooltip " + className} data-tip={tip} tabIndex={0}>{children}</span>;
}
