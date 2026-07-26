"use client";

// SAQEEL Executive Overview — "Basis and source" disclosure (client island).
//
// A minister asked in public where a number came from has to reach its formula,
// scope, versions and source records fast. The platform already carries that
// lineage on every metric; hiding it entirely made public defence slow, while
// printing it inline would drown the briefing read.
//
// So the headline figure gets ONE action that opens the full basis, and the
// drawer ends at the source-record drill — two actions from statement to
// evidence, which is the executive audit rule this surface is held to.
//
// This renders an existing MethodologyEntry built server-side by
// buildMethodology(). It computes nothing and infers nothing: when a field is
// absent it is simply not shown, and no substitute is displayed.

import { useEffect, useRef, useState } from "react";
import type { MethodologyEntry } from "./dashboard-format";
import styles from "./dashboard.module.css";

export type BasisDrawerStrings = {
  action: string;
  close: string;
  sourceRecords: string;
};

export default function BasisDrawer({
  entry,
  strings: s,
}: {
  entry: MethodologyEntry;
  strings: BasisDrawerStrings;
}) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        {s.action}
      </button>

      {open && (
        <>
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, background: "var(--surface-overlay)", zIndex: 40 }}
          />
          <div className={styles.drawer} role="dialog" aria-modal="true" aria-label={entry.title} style={{ zIndex: 41 }}>
            <div className={styles.drawerHead}>
              <span className={styles.drawerTitle}>{entry.title}</span>
              <button
                ref={closeRef}
                type="button"
                className={styles.methodClose}
                aria-label={s.close}
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.drawerBody}>
              {entry.blockedNote && (
                <p className={styles.drawerBlocked}>{entry.blockedNote}</p>
              )}
              <dl className={styles.methodList}>
                {entry.rows.map((row) => (
                  <div className={styles.methodRow} key={row.label}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            {entry.drillRoute && (
              <div className={styles.drawerFoot}>
                <a className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`} href={entry.drillRoute}>
                  {entry.drillLabel || s.sourceRecords}
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
