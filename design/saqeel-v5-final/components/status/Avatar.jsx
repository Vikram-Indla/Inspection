import React from "react";
export function Avatar({ name = "", className = "" }) {
  const initials = name.split(/[\s._-]+/).slice(0, 2).map(p => p[0]?.toUpperCase()).join("") || "S";
  return <span className={"ax-avatar " + className} aria-hidden="true">{initials}</span>;
}
