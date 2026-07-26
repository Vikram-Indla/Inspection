"use client";
// SAQEEL Field Dashboard.dc.html — SECTION 2, the AI Daily Brief card.
//
// Rebuilt from the design's composition: a header row (sparkle + title +
// "Advisory only" badge), then the brief as ONE PROSE PARAGRAPH, then a rule,
// then the "AI Recommendation — Start Here" block (factory name + governed risk
// badge + reason) with the two pill actions on the trailing edge.
//
// The route previously rendered the brief as a five-bullet list. That was the
// wrong FORM, and the design is authority on form. The words themselves are
// unchanged: `text` is the real governed briefing from lib/ai/briefing.ts
// (getOrGenerateBriefing), reflowed into a paragraph, never re-narrated. If the
// generator produced nothing, the governed unavailable line is shown — no
// synthesised mission sentence, ever.
//
// Scope comes from the SHARED FieldScopeProvider, so the Daily/Weekly control
// that lives in the mission card above switches this text too — the design's
// `briefRange` drives `briefMissionText` in exactly the same way.
//
// CR-107 (AI Preparation Assistant): "AI recommendations are advisory only" —
// carried by the always-on `Advisory only` badge.

import Link from "next/link";
import { useFieldScope } from "./FieldScopeProvider";
import styles from "@/app/(app)/field/field-home.module.css";

export type BriefRecommendation = {
  factoryName: string;
  /** Governed risk-band badge. Omitted entirely when the backend has no band. */
  badgeText: string | null;
  badgeClass: string;
  reason: string;
  factoryHref: string;
  startHref: string;
};

export type DailyBriefingStrings = {
  title: string;
  advisory: string;
  unavailable: string;
  recoLabel: string;
  viewCard: string;
  startJourney: string;
};

const Sparkle = ({ size }: { size: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="var(--action-primary)" strokeWidth="1.7"
    style={{ width: size, height: size, flex: "none" }} aria-hidden="true">
    <path d="M12 2l1.6 5.2L19 9l-5.4 1.8L12 16l-1.6-5.2L5 9l5.4-1.8L12 2z" />
  </svg>
);

/** Reflow a generated briefing into one paragraph. Line breaks and leading
 *  list markers are formatting, not content — nothing is added or dropped. */
function toProse(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean)
    .join(" ");
}

export default function DailyBriefingCard({
  daily,
  weekly,
  reco,
  strings,
  evidenceRefs,
}: {
  daily: { text: string | null; error: string | null };
  weekly: { text: string | null; error: string | null };
  reco: BriefRecommendation | null;
  strings: DailyBriefingStrings;
  /** Internal traceability only — never rendered (sponsor direction). */
  evidenceRefs?: string[];
}) {
  const { scope } = useFieldScope();
  const active = scope === "weekly" ? weekly : daily;
  const prose = active.text ? toProse(active.text) : "";

  return (
    <section
      className={`${styles.card} ${styles.briefCard}`}
      aria-labelledby="fd-brief-title"
      data-testid="inspector-daily-briefing-panel"
      data-evidence-refs={evidenceRefs?.join(",")}
      data-scope={scope}
    >
      <div className={styles.briefHead}>
        <Sparkle size={18} />
        <span id="fd-brief-title" className={styles.briefTitle}>{strings.title}</span>
        <span className="grow" />
        <span className="badge badge-info" style={{ height: 19 }}>{strings.advisory}</span>
      </div>

      {prose ? (
        <p className={styles.briefProse}>{prose}</p>
      ) : (
        <p className={`${styles.briefProse} t-caption`} role="status">
          {active.error ?? strings.unavailable}
        </p>
      )}

      {reco && (
        <div className={styles.reco}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div className="t-label" style={{ marginBlockEnd: 6 }}>{strings.recoLabel}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBlockEnd: 6, flexWrap: "wrap" }}>
              <span className={styles.recoName}><bdi>{reco.factoryName}</bdi></span>
              {reco.badgeText && (
                <span className={`badge ${reco.badgeClass}`} style={{ height: 18 }}>{reco.badgeText}</span>
              )}
            </div>
            {reco.reason && (
              <div className={styles.recoReason}>
                <Sparkle size={14} />
                <span>{reco.reason}</span>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 9, flex: "none", flexWrap: "wrap" }}>
            <Link href={reco.factoryHref} prefetch={false} className={styles.qbtnPill}>{strings.viewCard}</Link>
            <Link href={reco.startHref} prefetch={false} className={`${styles.qbtnPill} ${styles.qbtnPrimary}`}>
              {strings.startJourney}
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
