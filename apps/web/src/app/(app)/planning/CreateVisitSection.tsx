"use client";
import { type ReactNode, useState } from "react";
import Button from "@/components/saqeel/button/button";
import Icon from "@/components/saqeel/icon/icon";
import type { IconName } from "@/components/saqeel/icon/icon-registry";

export type CreateVisitMethod = {
  icon: IconName;
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
          <Button variant="primary" expanded={open} controls="plan-create-methods" onClick={() => setOpen(v => !v)}>
            {strings.createLabel}
          </Button>
        )}
      </div>
      {canCreate && open && (
        <section id="plan-create-methods" className="panel planning-create-methods" aria-label={strings.createLabel}>
          <div className="planning-create-methods__intro">
            <h2>{strings.createLabel}</h2>
            <p>{strings.oneMethodNote}</p>
          </div>
          <div className="planning-create-methods__grid">
            {methods.map(m => m.blockedReason ? (
              <div key={m.href} className="planning-create-method planning-create-method--blocked" aria-disabled="true">
                <span className="planning-create-method__glyph"><Icon name={m.icon} size="md" /></span>
                <div><span className="panel-title">{m.title}</span><span>{m.desc}</span></div>
                <span className="badge badge-warning">{m.blockedReason}</span>
              </div>
            ) : (
              <a key={m.href} href={m.href} className="planning-create-method">
                <span className="planning-create-method__glyph"><Icon name={m.icon} size="md" /></span>
                <span><span className="panel-title">{m.title}</span><span>{m.desc}</span></span>
              </a>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
