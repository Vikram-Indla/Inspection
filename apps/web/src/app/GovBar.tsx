"use client";

import { useState } from "react";
import { IconGovFlag, IconChevronDown, IconLink, IconLock } from "./icons";

export type GovBarStrings = {
  banner: string;
  howToVerify: string;
  linkTitle: string;
  linkBody: string;
  httpsTitle: string;
  httpsBody: string;
};

// SCR-PUB-000/010 — gov.sa-pattern verification strip: collapsed banner,
// expands to a two-card panel explaining how to verify the domain/protocol.
export default function GovBar({ s, prefix = "mk" }: { s: GovBarStrings; prefix?: string }) {
  const [open, setOpen] = useState(false);
  const base = `${prefix}-govbar`;

  return (
    <div className={`${base}-wrap`}>
      <div className={base}>
        <span className={`${base}__flag`} aria-hidden="true"><IconGovFlag size={14} /></span>
        <span className={`${base}__text`}>{s.banner}</span>
        <button
          type="button"
          className={`${base}__toggle`}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {s.howToVerify}
          <IconChevronDown size={14} className={`${base}__chevron${open ? ` ${base}__chevron--open` : ""}`} />
        </button>
      </div>
      {open ? (
        <div className={`${base}__panel`}>
          <div className={`${base}__card`}>
            <span className={`${base}__cardicon`}><IconLink size={20} /></span>
            <div>
              <strong>{s.linkTitle}</strong>
              <p>{s.linkBody}</p>
            </div>
          </div>
          <div className={`${base}__card`}>
            <span className={`${base}__cardicon`}><IconLock size={20} /></span>
            <div>
              <strong>{s.httpsTitle}</strong>
              <p>{s.httpsBody}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
