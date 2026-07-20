import React from "react";
export function Banner({ tone = "info", title, children, className = "" }) {
  const mod = tone === "info" ? "" : ` ax-banner--${tone}`;
  return <div className={"ax-banner" + mod + " " + className} role={tone === "critical" ? "alert" : "status"}>
    <div>{title ? <strong>{title} </strong> : null}{children}</div>
  </div>;
}
