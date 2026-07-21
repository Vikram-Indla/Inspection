"use client";
import React from "react";

type Opt = { value: string; label: string };

export interface ComboboxProps {
  options?: Array<string | Opt>;
  /** single: string | null; multi: string[] */
  value?: string | string[] | null;
  onChange?: (value: string | string[] | null) => void;
  /** multi-select — selected values render as removable chips */
  multi?: boolean;
  placeholder?: string;
  disabled?: boolean;
  renderOption?: (opt: Opt) => React.ReactNode;
}

/* Combobox / autocomplete / multi-select. ARIA combobox pattern. */
export function Combobox({
  options = [],
  value,
  onChange,
  multi,
  placeholder = "Search…",
  disabled,
  renderOption,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const norm: Opt[] = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const selected: string[] = multi
    ? ((value as string[]) || [])
    : value
      ? [value as string]
      : [];
  const filtered = norm.filter(
    (o) => o.label.toLowerCase().includes(query.toLowerCase()) && (!multi || !selected.includes(o.value)),
  );
  React.useEffect(() => {
    const h = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const pick = (v: string) => {
    if (multi) {
      onChange && onChange([...selected, v]);
      setQuery("");
    } else {
      onChange && onChange(v);
      setQuery("");
      setOpen(false);
    }
  };
  const remove = (v: string) => onChange && onChange(multi ? selected.filter((s) => s !== v) : null);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      setActive((a) => Math.min(a + 1, filtered.length - 1));
      setOpen(true);
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setActive((a) => Math.max(a - 1, 0));
      e.preventDefault();
    } else if (e.key === "Enter" && open && filtered[active]) {
      pick(filtered[active].value);
      e.preventDefault();
    } else if (e.key === "Escape") setOpen(false);
    else if (e.key === "Backspace" && !query && selected.length) remove(selected[selected.length - 1]);
  };
  const labelOf = (v: string) => (norm.find((o) => o.value === v) || { label: v }).label;
  return (
    <div className="combo" ref={rootRef}>
      <div
        className="combo-control"
        onClick={() => !disabled && setOpen(true)}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {multi &&
          selected.map((v) => (
            <span className="combo-chip" key={v}>
              {labelOf(v)}
              <button
                aria-label={"Remove " + labelOf(v)}
                onClick={(e) => {
                  e.stopPropagation();
                  remove(v);
                }}
              >
                ✕
              </button>
            </span>
          ))}
        {!multi && selected.length > 0 && !query && !open && (
          <span style={{ fontSize: "var(--type-compact-size)" }}>{labelOf(selected[0])}</span>
        )}
        <input
          value={query}
          placeholder={selected.length ? "" : placeholder}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          aria-autocomplete="list"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="menu combo-list" role="listbox">
          {filtered.map((o, i) => (
            <button
              key={o.value}
              role="option"
              aria-selected={i === active}
              className={"menu-item" + (i === active ? " is-selected" : "")}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(o.value)}
            >
              {renderOption ? renderOption(o) : o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
