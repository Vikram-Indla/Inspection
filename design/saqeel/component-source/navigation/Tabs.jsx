import React from "react";
export function Tabs({ tabs = [], value, onChange, vertical }) {
  return (
    <div className="tabs" role="tablist" style={vertical ? { flexDirection: "column", borderBlockEnd: 0, borderInlineEnd: "1px solid var(--border-subtle)" } : undefined}>
      {tabs.map((t) => (
        <button key={t.id} role="tab" className="tab" aria-selected={t.id === value}
          style={vertical ? { textAlign: "start", borderBlockEnd: 0, borderInlineEnd: t.id === value ? "2px solid var(--action-primary)" : "2px solid transparent", marginBlockEnd: 0, marginInlineEnd: -1 } : undefined}
          onClick={() => onChange && onChange(t.id)}>
          {t.label}{t.count != null && <span className="tab-count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}