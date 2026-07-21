import React from "react";
export function Input({ mono, icon, className, ...rest }) {
  const input = <input className={"input" + (mono ? " input-mono" : "") + (className ? " " + className : "")} {...rest} />;
  if (!icon) return input;
  return <span className="input-affix">{icon}{input}</span>;
}