import React from "react";
export function Switch({ label, className = "", ...rest }) {
  const control = <span className={"ax-switch " + className}><input type="checkbox" role="switch" {...rest} /><span className="ax-switch__track"></span></span>;
  return label ? <label className="ax-choice">{control}<span>{label}</span></label> : control;
}
