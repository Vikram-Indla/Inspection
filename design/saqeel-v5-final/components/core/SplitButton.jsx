import React from "react";
import { Button } from "./Button.jsx";
export function SplitButton({ label, onPrimary, variant = "primary", children, ...rest }) {
  return <span className="ax-splitbtn" {...rest}>
    <Button variant={variant} onClick={onPrimary}>{label}</Button>
    <Button variant={variant} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m8 10 4 4 4-4"/></svg>} aria-label="More actions" />
    {children}
  </span>;
}
