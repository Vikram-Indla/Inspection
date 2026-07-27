"use client";
// Create Visit page action (PLN-REQ-006). Reveals the three preserved planning
// method cards as a section of the /planning landing — exact routes from the
// pre-convergence chooser (/planning/bulk, /planning/single, /planning/immediate)
// with no package-mandatory gating (packages are optional, PLN-CON-003).
//
// This component owns the whole command bar, not just its own button. The
// revealed method cards are a sibling of the bar, never a child of it:
// .sq-planning-commandbar is a wrapping flex row, so a panel rendered inside
// it becomes a flex item and collapses into a narrow column beside the
// trigger, overlapping the insights panel below.
import { type ReactNode, useState } from "react";

export type CreateVisitMethod = { glyph: string; title: string; desc: string; href: string };

export type CreateVisitSectionStrings = {
  createLabel: string;
  oneMethodNote: string;
};

export default function CreateVisitSection({ methods, strings, canCreate, children }: {
  methods: CreateVisitMethod[];
  strings: CreateVisitSectionStrings;
  canCreate: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="sq-planning-commandbar">
        {children}
        {canCreate && (
          <button type="button" className="sq-btn" aria-expanded={open} aria-controls="plan-create-methods"
            onClick={() => setOpen(v => !v)}>
            {strings.createLabel}
          </button>
        )}
      </div>
      {canCreate && open && (
        <section id="plan-create-methods" className="sq-stack" aria-label={strings.createLabel}>
          <div className="sq-typecards">
            {methods.map(m => (
              <a key={m.href} href={m.href} className="sq-typecard">
                <span className="sq-typecard__title">{m.title}</span>
                <span className="sq-typecard__meta">{m.desc}</span>
              </a>
            ))}
          </div>
          <p className="sq-caption">{strings.oneMethodNote}</p>
        </section>
      )}
    </>
  );
}
