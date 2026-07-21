import React from "react";
export function CommandBar({ children, end, className = "" }) {
  return <div className={"ax-commandbar " + className}>{children}<span className="ax-commandbar__spacer"></span>{end}</div>;
}
