/**
 * Canonical in-page tabs (Saqeel V5.1 §6 "Navigation" — WAI-ARIA tabs
 * contract with RTL-aware roving focus). Renders the existing .sq-tabs CSS.
 * For same-page content panels only — route-level navigation must stay
 * <a>/aria-current, never role="tab" (see components/RouteTabs pattern).
 */
"use client";
import { useRef } from "react";

export type TabItem = { id: string; label: React.ReactNode; panel: React.ReactNode; disabled?: boolean };

export type TabsProps = {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  label: string;
};

export default function Tabs({ items, active, onChange, label }: TabsProps) {
  const listRef = useRef<HTMLDivElement>(null);

  function move(fromIndex: number, delta: number) {
    const enabled = items.map((it, i) => ({ it, i })).filter(x => !x.it.disabled);
    if (enabled.length === 0) return;
    const pos = enabled.findIndex(x => x.i === fromIndex);
    const nextPos = (pos + delta + enabled.length) % enabled.length;
    const next = enabled[nextPos];
    onChange(next.it.id);
    const btn = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next.i];
    btn?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    const rtl = (e.currentTarget.closest("[dir]") as HTMLElement | null)?.dir === "rtl";
    switch (e.key) {
      case "ArrowRight": e.preventDefault(); move(index, rtl ? -1 : 1); break;
      case "ArrowLeft": e.preventDefault(); move(index, rtl ? 1 : -1); break;
      case "Home": e.preventDefault(); move(-1, 1); break;
      case "End": e.preventDefault(); move(0, -1); break;
    }
  }

  const activeItem = items.find(it => it.id === active) ?? items[0];

  return (
    <>
      <div ref={listRef} role="tablist" aria-label={label} className="sq-tabs">
        {items.map((item, index) => (
          <button
            key={item.id}
            id={`sq-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={item.id === activeItem?.id}
            aria-controls={`sq-tabpanel-${item.id}`}
            aria-disabled={item.disabled || undefined}
            tabIndex={item.id === activeItem?.id ? 0 : -1}
            onClick={() => !item.disabled && onChange(item.id)}
            onKeyDown={e => onKeyDown(e, index)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map(item => (
        <div
          key={item.id}
          id={`sq-tabpanel-${item.id}`}
          role="tabpanel"
          aria-labelledby={`sq-tab-${item.id}`}
          hidden={item.id !== activeItem?.id}
          tabIndex={0}
        >
          {item.id === activeItem?.id ? item.panel : null}
        </div>
      ))}
    </>
  );
}
