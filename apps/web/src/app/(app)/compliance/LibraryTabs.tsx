"use client";

import { useState, type ReactNode } from "react";

export type LibraryTabDef = { key: string; label: string; count: number };

// CLASS-CONTRACT.md § Compliance Library — div.tabs > button.tab(.is-active) >
// span.tab-count, 6 tabs. Empty tabs are a valid "No records" state, not a
// reason to omit them.
export default function LibraryTabs({ tabs, panels }: { tabs: LibraryTabDef[]; panels: ReactNode[] }) {
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
