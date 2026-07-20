import React from "react";
export function Checkbox({ label, className = "", ...rest }) {
  return <label className={"ax-choice ax-check " + className}><input type="checkbox" {...rest} /><span>{label}</span></label>;
}
