import React from "react";
export function ValidationSummary({ title, blockers = [], clear, className = "" }) {
  return <div className={["ax-validation", clear && "ax-validation--clear", className].filter(Boolean).join(" ")} role={clear ? "status" : "alert"}>
    <strong>{title}</strong>
    {blockers.length ? <ul>{blockers.map((b, i) => <li key={i}>{b.href ? <a href={b.href}>{b.label}</a> : b.label || b}</li>)}</ul> : null}
  </div>;
}
