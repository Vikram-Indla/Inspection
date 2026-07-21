import React from "react";
export function Tag({ children, onRemove }) {
  return (
    <span className="tag">{children}
      {onRemove && <button onClick={onRemove} aria-label="Remove" style={{ border: 0, background: "none", cursor: "pointer", color: "inherit", padding: 0, lineHeight: 1 }}>✕</button>}
    </span>
  );
}