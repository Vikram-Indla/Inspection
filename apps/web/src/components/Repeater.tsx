/**
 * Shared repeater / dynamic-list-item component. Genuine pre-existing frontend
 * gap (DSM-034): grep for "repeater"/"dynamic list" across apps/web/src returned
 * zero matches before this — add/remove-row UI was ad hoc per form. Built from
 * existing ax-panel/ax-btn tokens, no new colors or geometry.
 */
"use client";

type RepeaterProps<T> = {
  items: T[];
  onChange: (items: T[]) => void;
  makeItem: () => T;
  renderItem: (item: T, index: number, update: (next: T) => void) => React.ReactNode;
  addLabel: string;
  removeLabel: string;
  minItems?: number;
};

export default function Repeater<T>({ items, onChange, makeItem, renderItem, addLabel, removeLabel, minItems = 0 }: RepeaterProps<T>) {
  function update(index: number, next: T) {
    onChange(items.map((it, i) => (i === index ? next : it)));
  }
  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }
  function add() {
    onChange([...items, makeItem()]);
  }
  return (
    <div className="ax-stack" style={{ gap: "var(--ax-space-200)" }}>
      {items.map((item, i) => (
        <div key={i} className="ax-panel" style={{ padding: "var(--ax-space-200)", border: "1px solid var(--ax-color-border)" }}>
          <div className="ax-row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>{renderItem(item, i, next => update(i, next))}</div>
            {items.length > minItems && (
              <button type="button" className="ax-btn ax-btn--subtle" style={{ color: "var(--ax-color-critical)" }} onClick={() => remove(i)}>{removeLabel}</button>
            )}
          </div>
        </div>
      ))}
      <button type="button" className="ax-btn ax-btn--secondary" onClick={add}>{addLabel}</button>
    </div>
  );
}
