import React from "react";
export function ControlGroup({ legend, children, className = "" }) {
  return <fieldset className={"ax-fieldset " + className}><legend>{legend}</legend>{children}</fieldset>;
}
