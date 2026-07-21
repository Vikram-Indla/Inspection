"use client";
import React from "react";

export interface FilterBarProps {
  filters?: Array<{ id: string; label: string; value?: string }>;
  onOpenFilter?: (id: string) => void;
  onClearFilter?: (id: string) => void;
  savedViews?: Array<{ id: string; label: string }>;
  activeView?: string;
  onView?: (id: string) => void;
  onSaveView?: () => void;
  /** opens the advanced builder (FilterRule rows in a Drawer) */
  onAdvanced?: () => void;
}

/* Filter bar + advanced builder + saved views. Chip dashed until set,
   solid emerald once active. */
export function FilterBar({
  filters = [],
  onOpenFilter,
  onClearFilter,
  savedViews = [],
  activeView,
  onView,
  onSaveView,
  onAdvanced,
}: FilterBarProps) {
  return (
    <div className="filter-bar">
      {savedViews.length > 0 && (
        <select
          className="select"
          style={{ width: "auto", height: "var(--control-h-sm)", fontSize: "var(--type-label-size)" }}
          value={activeView || ""}
          aria-label="Saved views"
          onChange={(e) => onView && onView(e.target.value)}
        >
          <option value="">All records</option>
          {savedViews.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
      )}
      {filters.map((f) => (
        <button
          key={f.id}
          type="button"
          className={"filter-chip" + (f.value ? " is-set" : "")}
          onClick={() => onOpenFilter && onOpenFilter(f.id)}
        >
          {f.label}
          {f.value ? ": " + f.value : ""}
          {f.value && (
            <span
              role="button"
              aria-label={"Clear " + f.label}
              onClick={(e) => {
                e.stopPropagation();
                onClearFilter && onClearFilter(f.id);
              }}
            >
              ✕
            </span>
          )}
        </button>
      ))}
      {onAdvanced && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onAdvanced}>
          Advanced filters
        </button>
      )}
      {onSaveView && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onSaveView}>
          Save view
        </button>
      )}
    </div>
  );
}

export interface FilterRuleValue {
  field?: string;
  op?: string;
  value?: string;
}

export interface FilterRuleProps {
  fields?: Array<{ id: string; label: string }>;
  rule?: FilterRuleValue;
  onChange?: (rule: FilterRuleValue) => void;
  onRemove?: () => void;
}

/* Advanced builder row: field / operator / value; host in a Drawer. */
export function FilterRule({ fields = [], rule = {}, onChange, onRemove }: FilterRuleProps) {
  const set = (k: keyof FilterRuleValue, v: string) => onChange && onChange({ ...rule, [k]: v });
  return (
    <div className="row" style={{ gap: "var(--space-1)" }}>
      <select
        className="select"
        aria-label="Field"
        value={rule.field || ""}
        onChange={(e) => set("field", e.target.value)}
        style={{ flex: 1 }}
      >
        {fields.map((f) => (
          <option key={f.id} value={f.id}>
            {f.label}
          </option>
        ))}
      </select>
      <select
        className="select"
        aria-label="Operator"
        value={rule.op || "is"}
        onChange={(e) => set("op", e.target.value)}
        style={{ width: 110, flex: "none" }}
      >
        {["is", "is not", "contains", "before", "after", "empty"].map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <input
        className="input"
        aria-label="Value"
        value={rule.value || ""}
        onChange={(e) => set("value", e.target.value)}
        style={{ flex: 1 }}
      />
      <button className="btn btn-ghost btn-sm btn-icon" aria-label="Remove rule" onClick={onRemove}>
        ✕
      </button>
    </div>
  );
}
