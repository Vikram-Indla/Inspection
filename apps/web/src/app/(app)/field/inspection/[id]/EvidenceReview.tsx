"use client";

// SAQEEL Field — pre-submission Evidence Review panel (additive, read-only).
// Aggregates every captured evidence item for the inspection — synced and
// still-pending (offline outbox) — with its question/finding linkage, sync
// status, and the mandatory-evidence gate summary that mirrors the real submit
// blockers. A pending row is NEVER painted "failed" from the workspace-global
// sync state (a global failure may be a DIFFERENT op ahead in the FIFO queue);
// a failed/offline sync surfaces once as a SEPARATE workspace warning while the
// rows stay pending. It OWNS NO write path: capture, annotate, replace,
// soft-delete, offline replay and the submission guards all remain in
// Workspace.tsx / offline.ts untouched. "Retry uploads" simply re-triggers the
// existing outbox replay the workspace already runs on its sync tick.
import { useMemo } from "react";
import type { EvidenceSyncWarning } from "./evidence-review-status";
import styles from "./evidence-review.module.css";

export type EvidenceReviewStrings = {
  title: string;
  caption: string;
  countSynced: string; countPending: string;
  retry: string; retrying: string;
  statusSynced: string; statusPending: string;
  syncWarningFailed: string; syncWarningOffline: string;
  mandatoryLabel: string; mandatoryMet: string; mandatoryComplete: string;
  mandatoryNone: string; mandatoryGaps: string;
  linkFinding: string; linkAction: string; linkInspection: string;
  typePhoto: string; typeVideo: string; typeDocument: string; typeComment: string;
  empty: string; previewAlt: string;
};

export type EvidenceReviewRow = {
  key: string;
  linkLabel: string;
  type: string;                       // photo | video | document | comment
  status: "synced" | "pending";       // never global-"failed" per row (see header)
  previewUrl?: string;                // synced image → presigned URL
  previewB64?: string;                // pending image → inline data URI
};

export type EvidenceMandatory = { met: number; total: number; gaps: string[] };

const fmt = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (m, k) => String(vars[k] ?? m));

const TYPE_GLYPH: Record<string, string> = { photo: "🖼", video: "🎞", document: "📄", comment: "💬" };

export default function EvidenceReview({
  rows, mandatory, counts, warning, retrying, onRetry, strings,
}: {
  rows: EvidenceReviewRow[];
  mandatory: EvidenceMandatory;
  counts: { synced: number; pending: number };
  warning: EvidenceSyncWarning;
  retrying: boolean;
  onRetry: () => void;
  strings: EvidenceReviewStrings;
}) {
  const typeLabel = useMemo(() => ({
    photo: strings.typePhoto, video: strings.typeVideo, document: strings.typeDocument, comment: strings.typeComment,
  } as Record<string, string>), [strings]);

  const statusText = (s: EvidenceReviewRow["status"]) =>
    s === "synced" ? strings.statusSynced : strings.statusPending;
  const statusBadge = (s: EvidenceReviewRow["status"]) =>
    s === "synced" ? "badge-compliant" : "badge-info";

  // Mandatory-evidence gate line — mirrors the submit blockers exactly (met =
  // total − gaps). total 0 → nothing mandatory for the current answers.
  const mandatoryLine = mandatory.total === 0
    ? strings.mandatoryNone
    : mandatory.gaps.length === 0
      ? strings.mandatoryComplete
      : fmt(strings.mandatoryMet, { met: mandatory.met, total: mandatory.total });
  const mandatoryOk = mandatory.total === 0 || mandatory.gaps.length === 0;

  // The panel offers a retry only when something is actually queued; it never
  // fabricates progress — pending stays pending until the real replay clears it.
  const canRetry = counts.pending > 0;

  return (
    <section className={styles.panel} aria-label={strings.title} data-testid="evidence-review">
      <header className={styles.head}>
        <div className={styles.headText}>
          <h3 className={styles.title}>{strings.title}</h3>
          <p className={`t-caption ${styles.caption}`}>{strings.caption}</p>
        </div>
        {canRetry && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onRetry}
            disabled={retrying}
            data-testid="evidence-review-retry"
          >
            {retrying ? strings.retrying : strings.retry}
          </button>
        )}
      </header>

      <div className={styles.counts} data-warning={warning}>
        <span className={styles.count} data-testid="evidence-count-synced">
          <span className="id-code">{counts.synced}</span> {strings.countSynced}
        </span>
        <span className={styles.count} data-testid="evidence-count-pending">
          <span className="id-code">{counts.pending}</span> {strings.countPending}
        </span>
      </div>

      {/* Separate WORKSPACE-LEVEL sync warning — a failed/offline sync is a
          queue-wide condition, not a per-row verdict, so pending rows stay
          pending and this single banner reports the sync state. */}
      {warning !== "none" && (
        <div className={`${styles.warning}`} role="status" data-testid="evidence-sync-warning" data-warning={warning}>
          {warning === "offline" ? strings.syncWarningOffline : strings.syncWarningFailed}
        </div>
      )}

      {/* Mandatory-evidence gate summary — same authority as the submit gate. */}
      <div
        className={`${styles.gate} ${mandatoryOk ? styles.gateOk : styles.gateWarn}`}
        data-testid="evidence-mandatory"
        data-complete={mandatoryOk ? "true" : "false"}
      >
        <span className={styles.gateLabel}>{strings.mandatoryLabel}</span>
        <span className={styles.gateValue}>{mandatoryLine}</span>
        {mandatory.gaps.length > 0 && (
          <span className={`t-caption ${styles.gateGaps}`}>{fmt(strings.mandatoryGaps, { items: mandatory.gaps.join(", ") })}</span>
        )}
      </div>

      {rows.length === 0 ? (
        <p className={`t-caption ${styles.empty}`}>{strings.empty}</p>
      ) : (
        <ul className={styles.grid}>
          {rows.map(r => (
            <li key={r.key} className={styles.card} data-status={r.status} data-testid="evidence-review-item">
              <div className={styles.thumb}>
                {r.previewUrl || r.previewB64
                  ? <img src={r.previewUrl ?? r.previewB64} alt={strings.previewAlt} loading="lazy" />
                  : <span className={styles.glyph} aria-hidden="true">{TYPE_GLYPH[r.type] ?? "📎"}</span>}
              </div>
              <div className={styles.meta}>
                <span className={`id-code ${styles.link}`}>{r.linkLabel}</span>
                <span className="t-caption">{typeLabel[r.type] ?? r.type}</span>
                <span className={`badge ${statusBadge(r.status)} ${styles.status}`}>{statusText(r.status)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
