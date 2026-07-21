import React from "react";
export function ButtonGroup({ children, ...rest }) {
  return <div className="btn-group" role="group" {...rest}>{children}</div>;
}