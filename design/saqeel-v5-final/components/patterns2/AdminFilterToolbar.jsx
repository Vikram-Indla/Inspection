import React from "react";
export function AdminFilterToolbar({ search, chips, end, className = "" }) {
  return <div className={"ax-commandbar " + className}>{search}{chips}<span className="ax-commandbar__spacer"></span>{end}</div>;
}
