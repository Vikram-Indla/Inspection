"use client";
import React from "react";

export type MenuItem =
  | "sep"
  | {
      label: string;
      heading?: boolean;
      icon?: React.ReactNode;
      danger?: boolean;
      disabled?: boolean;
      onSelect?: () => void;
    };

export interface MenuProps {
  trigger: React.ReactElement;
  items?: MenuItem[];
  align?: "start" | "end";
}

/* Overflow / context menu attached to a trigger. */
export function Menu({ trigger, items = [], align = "start" }: MenuProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);
  React.useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("keydown", k);
    };
  }, []);
  return (
    <span style={{ position: "relative", display: "inline-flex" }} ref={ref}>
      {React.cloneElement(trigger as React.ReactElement<any>, {
        onClick: () => setOpen(!open),
        "aria-haspopup": "menu",
        "aria-expanded": open,
      })}
      {open && (
        <div
          className="menu"
          role="menu"
          style={{
            position: "absolute",
            insetBlockStart: "calc(100% + 4px)",
            [align === "start" ? "insetInlineStart" : "insetInlineEnd"]: 0,
          }}
        >
          {items.map((it, i) =>
            it === "sep" ? (
              <hr key={i} className="menu-sep" />
            ) : it.heading ? (
              <div key={i} className="menu-label">
                {it.label}
              </div>
            ) : (
              <button
                key={i}
                role="menuitem"
                disabled={it.disabled}
                className={"menu-item" + (it.danger ? " is-danger" : "")}
                onClick={() => {
                  setOpen(false);
                  it.onSelect && it.onSelect();
                }}
              >
                {it.icon}
                {it.label}
              </button>
            ),
          )}
        </div>
      )}
    </span>
  );
}
