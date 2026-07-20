import React from "react";

export interface TagProps {
  onRemove?: () => void;
  children?: React.ReactNode;
}

export function Tag({ children, onRemove }: TagProps) {
  return (
    <span className="tag">
      {children}
      {onRemove && (
        <button className="tag-remove" onClick={onRemove} aria-label="Remove" type="button">
          ✕
        </button>
      )}
    </span>
  );
}
