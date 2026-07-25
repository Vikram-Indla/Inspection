"use client";

import { useEffect, useRef } from "react";
import styles from "./operations.module.css";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type OperationsPreviewEntry = {
  id: string;
  kind: "visit" | "factory";
  href: string;
  factoryId: string | null;
  factoryName: string;
  region: string | null;
  city: string | null;
  state: string;
  visitId: string | null;
  inspectorName: string | null;
  assignmentCount: number;
  lastGeoAt: string | null;
  riskScore: number | null;
  riskRank: number | null;
  riskRankTotal: number;
  activeVisitCount: number;
  openActionCount: number;
};

export type OperationsPreviewStrings = {
  inspectorTitle: string;
  factoryTitle: string;
  close: string;
  currentVisit: string;
  operationalState: string;
  assignments: string;
  lastGeoEvent: string;
  noGeoEvent: string;
  openVisit: string;
  location: string;
  riskScore: string;
  riskRank: string;
  riskUnavailable: string;
  activeVisits: string;
  openActions: string;
  openFactory: string;
};

export default function OperationsPreview({
  entry,
  strings: s,
  onClose,
}: {
  entry: OperationsPreviewEntry | null;
  strings: OperationsPreviewStrings;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!entry) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter(element => element.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      restoreRef.current?.focus();
    };
  }, [entry, onClose]);

  if (!entry) return null;
  const inspectorPreview = entry.kind === "visit" && !!entry.inspectorName;
  const titleId = inspectorPreview ? "operations-inspector-preview-title" : "operations-factory-preview-title";

  return (
    <div
      className={styles.previewBackdrop}
      onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}
    >
      <aside
        ref={dialogRef}
        className={`${styles.previewPanel} ${inspectorPreview ? styles.previewDrawer : styles.previewCard}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid={inspectorPreview ? "operations-inspector-drawer" : "operations-factory-quick-card"}
      >
        <header className={styles.previewHeader}>
          <div>
            <span className="sq-caption">{inspectorPreview ? s.inspectorTitle : s.factoryTitle}</span>
            <h3 id={titleId}>{inspectorPreview ? entry.inspectorName : entry.factoryName}</h3>
          </div>
          <button ref={closeRef} className="sq-btn sq-btn--secondary sq-btn--icon" type="button" aria-label={s.close} onClick={onClose}>×</button>
        </header>

        {inspectorPreview ? (
          <dl className={styles.previewFacts}>
            <div><dt>{s.currentVisit}</dt><dd className="sq-numeric">{entry.visitId?.slice(0, 8) ?? "—"}</dd></div>
            <div><dt>{s.operationalState}</dt><dd>{entry.state}</dd></div>
            <div><dt>{s.assignments}</dt><dd className="sq-numeric">{entry.assignmentCount}</dd></div>
            <div><dt>{s.lastGeoEvent}</dt><dd className="sq-numeric">{entry.lastGeoAt ?? s.noGeoEvent}</dd></div>
          </dl>
        ) : (
          <dl className={styles.previewFacts}>
            <div><dt>{s.location}</dt><dd>{[entry.region, entry.city].filter(Boolean).join(" · ") || "—"}</dd></div>
            <div><dt>{s.riskScore}</dt><dd className="sq-numeric">{entry.riskScore ?? s.riskUnavailable}</dd></div>
            <div><dt>{s.riskRank}</dt><dd className="sq-numeric">{entry.riskRank ? `${entry.riskRank} / ${entry.riskRankTotal}` : s.riskUnavailable}</dd></div>
            <div><dt>{s.activeVisits}</dt><dd className="sq-numeric">{entry.activeVisitCount}</dd></div>
            <div><dt>{s.openActions}</dt><dd className="sq-numeric">{entry.openActionCount}</dd></div>
          </dl>
        )}

        <footer className={styles.previewFooter}>
          <a className="sq-btn sq-btn--primary" href={inspectorPreview && entry.visitId ? `/visits/${entry.visitId}` : entry.href}>
            {inspectorPreview ? s.openVisit : s.openFactory}
          </a>
        </footer>
      </aside>
    </div>
  );
}
