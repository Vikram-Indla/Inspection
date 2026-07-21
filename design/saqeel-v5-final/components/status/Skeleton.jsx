import React from "react";
export function Skeleton({ width, height, className = "", style }) {
  return <span className={"ax-skeleton " + className} style={{ display: "block", inlineSize: width, blockSize: height, ...style }} aria-hidden="true"></span>;
}
