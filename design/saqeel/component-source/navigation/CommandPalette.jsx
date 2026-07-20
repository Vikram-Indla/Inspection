import React from "react";
/* Global command palette (Ctrl/Cmd-K). Searches commands + entities;
   groups by section; full keyboard navigation. */
export function CommandPalette({ open, onClose, items = [], placeholder = "Search inspections, facilities, actions…" }) {
  const [q, setQ] = React.useState("");
  const [active, setActive] = React.useState(0);
  React.useEffect(() => { if (open) { setQ(""); setActive(0); } }, [open]);
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === "Escape") onClose && onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  const filtered = items.filter((it) => it.label.toLowerCase().includes(q.toLowerCase()));
  const sections = [...new Set(filtered.map((it) => it.section || ""))];
  const flat = sections.flatMap((s) => filtered.filter((it) => (it.section || "") === s));
  const onKey = (e) => {
    if (e.key === "ArrowDown") { setActive((a) => Math.min(a + 1, flat.length - 1)); e.preventDefault(); }
    else if (e.key === "ArrowUp") { setActive((a) => Math.max(a - 1, 0)); e.preventDefault(); }
    else if (e.key === "Enter" && flat[active]) { onClose && onClose(); flat[active].onSelect && flat[active].onSelect(); }
  };
  let idx = -1;
  return (
    <div className="dialog-backdrop" style={{ alignItems: "start", paddingBlockStart: "12vh" }} onClick={(e) => e.target === e.currentTarget && onClose && onClose()}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="palette-input">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
          <input autoFocus value={q} placeholder={placeholder} onChange={(e) => { setQ(e.target.value); setActive(0); }} onKeyDown={onKey} />
          <span className="kbd" style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-muted)", border: "1px solid var(--border-subtle)", borderRadius: 2, padding: "1px 5px" }}>ESC</span>
        </div>
        <div className="palette-list">
          {flat.length === 0 && <div className="t-meta" style={{ padding: "var(--space-4)", textAlign: "center" }}>No results for “{q}”</div>}
          {sections.map((s) => (
            <React.Fragment key={s || "_"}>
              {s && <div className="menu-label">{s}</div>}
              {filtered.filter((it) => (it.section || "") === s).map((it) => {
                idx += 1; const i = idx;
                return (
                  <button key={i} className={"palette-item" + (i === active ? " is-active" : "")}
                    onMouseEnter={() => setActive(i)} onClick={() => { onClose && onClose(); it.onSelect && it.onSelect(); }}>
                    {it.icon}{it.label}
                    {it.meta && <span className="t-caption" style={{ marginInlineStart: 6 }}>{it.meta}</span>}
                    {it.kbd && <span className="kbd">{it.kbd}</span>}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}