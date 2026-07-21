import React from "react";
import { Button } from "./Button.jsx";
export function SplitButton({ variant = "primary", children, onClick, onMenu, menuLabel = "More actions", ...rest }) {
  return (
    <div className="btn-group" {...rest}>
      <Button variant={variant} onClick={onClick}>{children}</Button>
      <Button variant={variant} iconOnly aria-label={menuLabel} onClick={onMenu}
        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>} />
    </div>
  );
}