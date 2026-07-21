"use client";
import React from "react";
import { STATUS_LABELS, type StatusRole } from "../data/StatusBadge";

export interface StatusSelectorProps {
  value?: string;
  onChange?: (status: string) => void;
  /** subset of the 10 canonical statuses */
  statuses?: string[];
  disabled?: boolean;
}

export function StatusSelector({
  value,
  onChange,
  statuses = Object.keys(STATUS_LABELS),
  disabled,
}: StatusSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="combo" ref={ref}>
      <button
        type="button"
        className="btn btn-secondary btn-touch"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {value ? (
          <span className={"badge badge-" + value}>
            <i className="dot" aria-hidden="true" />
            {STATUS_LABELS[value as StatusRole]}
          </span>
        ) : (
          "Status"
        )}
        <span aria-hidden="true" style={{ fontSize: 9 }}>
          ▾
        </span>
      </button>
      {open && (
        <div className="menu combo-list" role="listbox" style={{ minWidth: 200 }}>
          {statuses.map((s) => (
            <button
              key={s}
              role="option"
              aria-selected={s === value}
              className={"menu-item" + (s === value ? " is-selected" : "")}
              onClick={() => {
                onChange && onChange(s);
                setOpen(false);
              }}
            >
              <span className={"badge badge-" + s}>
                <i className="dot" aria-hidden="true" />
                {STATUS_LABELS[s as StatusRole]}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
