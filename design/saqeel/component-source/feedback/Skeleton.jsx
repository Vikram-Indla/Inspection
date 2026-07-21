import React from "react";
export function Skeleton({ width = "100%", height = 14, style, ...rest }) {
  return <span className="skeleton" style={{ display: "block", width, height, ...style }} aria-hidden="true" {...rest} />;
}