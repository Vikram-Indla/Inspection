import React from "react";
export function RuleRow({ op, children, className = "" }) {
  return <div className={"ax-rule " + className}>{op ? <span className="ax-rule__op">{op}</span> : null}{children}</div>;
}
