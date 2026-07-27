"use client";

import { useState, type ReactNode } from "react";

export type RecordTabDef = { key: string; label: string; count: number };

// CLASS-CONTRACT.md § Review & Approval — div.tabs > button.tab(.is-active) >
// span.tab-count. The 7 tabs are the record's existing content regions
// (Checklist, Violations·actions·evidence, Factory verification,
// Acknowledgement, Version comparison, Timeline, Prior decisions), not new
// content — this component only adds the switcher.
export default function RecordTabs({ tabs, panels }: { tabs: RecordTabDef[]; panels: ReactNode[] }) {
  const [active, setActive] = useState(0);
  return (
    <>
      <div className="tabs" role="tablist">
        {tabs.map((tab, index) => (
          <button key={tab.key} type="button" role="tab" aria-selected={index === active}
            className={`tab${index === active ? " is-active" : ""}`}
            onClick={() => setActive(index)}>
            {tab.label} <span className="tab-count">{tab.count}</span>
          </button>
        ))}
      </div>
      {panels[active]}
    </>
  );
}
