import React from "react";
export function Radio({ label, className = "", ...rest }) {
  return <label className={"ax-choice ax-check " + className}><input type="radio" {...rest} /><span>{label}</span></label>;
}
