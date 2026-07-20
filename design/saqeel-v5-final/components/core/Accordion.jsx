import React, { useState } from "react";
export function Accordion({ items = [], className = "" }) {
  const [open, setOpen] = useState(() => items.map((it, i) => it.defaultOpen ?? i === 0));
  return <div className={"ax-accordion " + className}>
    {items.map((it, i) => <div className="ax-accordion__item" key={i}>
      <button type="button" className="ax-accordion__trigger" aria-expanded={!!open[i]} onClick={() => setOpen(o => o.map((v, j) => j === i ? !v : v))}>
        <span>{it.title}</span>
        <span className="ax-row" style={{ gap: "var(--ax-space-100)" }}>
          {it.progress ? <span className="ax-accordion__progress">{it.progress}</span> : null}
          <svg className="ax-accordion__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m8 10 4 4 4-4"/></svg>
        </span>
      </button>
      {open[i] ? <div className="ax-accordion__body">{it.content}</div> : null}
    </div>)}
  </div>;
}
