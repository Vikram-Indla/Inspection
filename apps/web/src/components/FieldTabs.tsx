// Inspector task bar for the field channel (/field routes only).
// Shell A remains the governed global navigation. This local bar keeps the
// three highest-frequency field destinations and one explicit next action
// within reach without the legacy raised circular FAB. Labels arrive
// pre-translated from the server page; logical properties preserve RTL.

export type FieldTabsLabels = {
  dashboard: string;
  visits: string;
  virtual: string;
  fab: string;
};

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

// Simple stroke glyphs, single path each (no external icon deps).
const GLYPHS = {
  dashboard: "M4 4h7v7H4zM13 4h7v4h-7zM13 11h7v9h-7zM4 14h7v6H4z",
  visits: "M4 6h16M4 12h16M4 18h10",
  virtual: "M3 7a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM16 10l5-3v10l-5-3",
  next: "M5 12h14M13 6l6 6-6 6",
};

export default function FieldTabs({ active, fabHref, labels }: {
  active: "dashboard" | "visits";
  fabHref: string;
  labels: FieldTabsLabels;
}) {
  return (
    <nav aria-label={labels.dashboard} className="ax-field-taskbar">
      <a href="/field" className="ax-field-taskbar__item"
        aria-current={active === "dashboard" ? "page" : undefined}>
        <Icon d={GLYPHS.dashboard} />{labels.dashboard}
      </a>
      <a href="/field#visits" className="ax-field-taskbar__item"
        aria-current={active === "visits" ? "page" : undefined}>
        <Icon d={GLYPHS.visits} />{labels.visits}
      </a>
      <a href="/virtual" className="ax-field-taskbar__item">
        <Icon d={GLYPHS.virtual} />{labels.virtual}
      </a>
      <a href={fabHref} aria-label={labels.fab} className="ax-field-taskbar__primary">
        <span>{labels.fab}</span><Icon d={GLYPHS.next} />
      </a>
    </nav>
  );
}
