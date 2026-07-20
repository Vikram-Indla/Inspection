import React, { useState, useRef, useId } from "react";

/**
 * In-page tabs with the WAI-ARIA tabs contract.
 * Route navigation must use RouteTabs, which renders ordinary links without tab roles.
 */
export function Tabs({
  tabs = [],
  value,
  defaultValue,
  onChange,
  children,
  ariaLabel = "Sections",
  className = "",
}) {
  const [internal, setInternal] = useState(defaultValue ?? tabs[0]);
  const current = value ?? internal;
  const base = useId();
  const refs = useRef([]);
  const idx = Math.max(0, tabs.indexOf(current));

  const select = tab => {
    if (value === undefined) setInternal(tab);
    onChange?.(tab);
  };

  const onKeyDown = event => {
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    let next = null;
    if (event.key === "ArrowRight") next = rtl ? idx - 1 : idx + 1;
    else if (event.key === "ArrowLeft") next = rtl ? idx + 1 : idx - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    if (next === null || !tabs.length) return;
    event.preventDefault();
    next = (next + tabs.length) % tabs.length;
    select(tabs[next]);
    refs.current[next]?.focus();
  };

  const panels = React.Children.toArray(children);
  return (
    <>
      <div className={`ax-tabs ${className}`} role="tablist" aria-label={ariaLabel} onKeyDown={onKeyDown}>
        {tabs.map((tab, index) => (
          <button
            key={tab}
            ref={element => { refs.current[index] = element; }}
            type="button"
            role="tab"
            id={`${base}-tab-${index}`}
            aria-selected={tab === current}
            aria-controls={`${base}-panel-${index}`}
            tabIndex={tab === current ? 0 : -1}
            onClick={() => select(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      {panels.length
        ? tabs.map((tab, index) => (
            <div
              key={tab}
              role="tabpanel"
              id={`${base}-panel-${index}`}
              aria-labelledby={`${base}-tab-${index}`}
              hidden={tab !== current}
              tabIndex={0}
            >
              {panels[index] ?? null}
            </div>
          ))
        : null}
    </>
  );
}

/** Route-level navigation: links + aria-current, never role="tab". */
export function RouteTabs({ items = [], current, ariaLabel = "Sections", className = "" }) {
  return (
    <nav className={`ax-tabs ax-route-tabs ${className}`} aria-label={ariaLabel}>
      {items.map(item => (
        <a key={item.href} href={item.href} aria-current={item.href === current ? "page" : undefined}>
          {item.label}
        </a>
      ))}
    </nav>
  );
}
