"use client";
// Create Visit page action (PLN-REQ-006). Reveals the three preserved planning
// method cards as a section of the /planning landing — exact routes from the
// pre-convergence chooser (/planning/bulk, /planning/single, /planning/immediate)
// with no package-mandatory gating (packages are optional, PLN-CON-003).
import { useState } from "react";

export type CreateVisitMethod = { glyph: string; title: string; desc: string; href: string };

export type CreateVisitSectionStrings = {
  createLabel: string;
  oneMethodNote: string;
};

export default function CreateVisitSection({ methods, strings }: { methods: CreateVisitMethod[]; strings: CreateVisitSectionStrings }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="ax-btn" aria-expanded={open} onClick={() => setOpen(v => !v)}>
        {strings.createLabel}
      </button>
      {open && (
        <section aria-label={strings.createLabel}>
          <div className="web-methods" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "var(--ax-space-300)" }}>
            {methods.map(m => (
              <a key={m.href} href={m.href} className="ax-surface ax-panel"
                style={{ padding: "var(--ax-space-400)", display: "flex", flexDirection: "column", gap: "var(--ax-space-150)", textDecoration: "none", color: "inherit" }}>
                <span style={{ fontSize: 22 }}>{m.glyph}</span>
                <h3>{m.title}</h3>
                <p className="ax-caption">{m.desc}</p>
              </a>
            ))}
          </div>
          <p className="ax-caption">{strings.oneMethodNote}</p>
        </section>
      )}
    </>
  );
}
