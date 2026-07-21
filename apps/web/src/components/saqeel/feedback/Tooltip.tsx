"use client";
import React from "react";

export interface TooltipProps {
  label: string;
  placement?: "top" | "bottom";
  children?: React.ReactNode;
}

export function Tooltip({ label, children, placement = "top" }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const pos: React.CSSProperties =
    placement === "bottom"
      ? { insetBlockStart: "calc(100% + 6px)", insetInlineStart: "50%", transform: "translateX(-50%)" }
      : { insetBlockEnd: "calc(100% + 6px)", insetInlineStart: "50%", transform: "translateX(-50%)" };
  return (
    <span
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span className="tooltip" role="tooltip" style={{ ...pos, whiteSpace: "nowrap" }}>
          {label}
        </span>
      )}
    </span>
  );
}
