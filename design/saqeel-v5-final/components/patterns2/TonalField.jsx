import React from "react";
export function TonalField({ children, className = "", ...rest }) {
  return <div className={"ax-field-tonal " + className} {...rest}>{children}</div>;
}
