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

export type CreateVisitMethod = {
  glyph: string;
  title: string;
  desc: string;
  href: string;
  blockedReason?: string;
};

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
      <div className="grid-toolbar">
        {children}
        {canCreate && (
          <button type="button" className="btn btn-primary" aria-expanded={open} aria-controls="plan-create-methods"
            onClick={() => setOpen(v => !v)}>
            {strings.createLabel}
          </button>
        )}
      </div>
      {canCreate && open && (
        <section id="plan-create-methods" className="panel" aria-label={strings.createLabel}>
          <div className="panel-body">
            {methods.map(m => m.blockedReason ? (
              <div key={m.href} className="panel" aria-disabled="true">
                <span className="panel-title">{m.title}</span>
                <span>{m.desc}</span>
                <span className="badge badge-warning">{m.blockedReason}</span>
              </div>
            ) : (
              <a key={m.href} href={m.href} className="panel">
                <span className="panel-title">{m.title}</span>
                <span>{m.desc}</span>
              </a>
            ))}
          </div>
          <div className="alert alert-info">{strings.oneMethodNote}</div>
        </section>
      )}
    </>
  );
}
