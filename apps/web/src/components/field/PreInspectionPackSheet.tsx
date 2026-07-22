"use client";
// Pre-Inspection Pack sheet (CODEX 03). A REAL data-driven view, not static
// design text. Every section renders governed server-provided data or an honest
// unavailable/not-configured state (never a fabricated value). The sheet does
// NOT bypass the /field/[visitId] startup gates and does NOT duplicate the
// checklist designer — "Check in" routes to the governed startup, which holds
// the authoritative gate. The "Factory 360 snapshot" line is a user
// acknowledgement, NOT a read of the separate Factory 360 cache (owned by
// another task). Package-cached-for-offline is read from the inspection package
// cache (lib/offline.ts) — display only, no mutation, no queue changes.

import { useEffect, useMemo, useState } from "react";
import { localForUser } from "@/lib/offline";

export type PackSection = {
  /** governed value present */ value: string | null;
  /** honest blocked note when value is null (e.g. "Not available — DEC-DASH-002"). */
  unavailable: string | null;
};

export type PackData = {
  visitId: string;
  inspectionId: string | null;
  visitRef: string;
  factoryName: string;
  packPolicyVersion: string | null;
  packageLabel: string | null;
  packageStatus: string | null;
  crNumber: string | null;
  officialLocation: string | null;
  licence: PackSection;
  riskBand: string | null;
  riskScore: number | null;
  riskDrivers: string[] | null;
  health: PackSection;      // STR-KPI-002 — no governed Health Score source yet
  previousApproved: string | null;
  returnedContext: string | null;
  compliance: { rate: number | null; compliant: number; eligible: number } | null;
  repeatFindings: PackSection; // STR-KPI-011 — no governed violation lineage yet
  freshnessMinutes: number | null;
};

export type PackStrings = {
  openPack: string;
  title: string;
  close: string;
  cached: string;
  freshness: string;         // "freshness {n} min"
  reviewBlocker: string;     // "Review — {n} blocker(s)"
  ready: string;             // "Ready"
  sectionFactory: string;
  sectionPackage: string;
  sectionPrevious: string;
  sectionRepeat: string;
  sectionHealthRisk: string;
  sectionDocuments: string;
  crNumber: string;
  licence: string;
  officialLocation: string;
  provenance: string;
  provenanceValue: string;
  distinctConcepts: string;  // "Distinct governed concepts — Health and Risk are not the same"
  documentsNote: string;
  healthScore: string;
  riskScore: string;
  compliance: string;        // "{rate}% compliant · {c}/{e} eligible"
  noPrevious: string;
  startReadiness: string;
  ackPackageCached: string;
  ackFactory360: string;
  ackRepeatReviewed: string;
  required: string;
  downloadOffline: string;
  checkIn: string;           // "Check in — startup"
  checkInBlocked: string;    // "Check in — review required"
  startupNote: string;       // "Opens the governed startup; check-in gates are enforced there."
};

function Section({ title, open, children }: { title: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details open={open} style={{ borderBlockEnd: "1px solid var(--ax-color-border)" }}>
      <summary style={{ padding: "var(--ax-space-200) var(--ax-space-300)", cursor: "pointer", font: "var(--ax-text-body-strong)" }}>{title}</summary>
      <div style={{ padding: "0 var(--ax-space-300) var(--ax-space-250)", font: "var(--ax-text-caption)", color: "var(--ax-color-text-secondary)" }}>{children}</div>
    </details>
  );
}

export default function PreInspectionPackSheet({ data, strings, moduleClasses, userId }: {
  data: PackData;
  strings: PackStrings;
  moduleClasses: { packChipRow: string; packReadiness: string; packFooter: string; packBlocked: string };
  userId: string;
}) {
  const local = useMemo(() => localForUser(userId), [userId]);
  const [open, setOpen] = useState(false);
  const [packageCached, setPackageCached] = useState(false);
  const [factory360Ack, setFactory360Ack] = useState(false);
  const [repeatReviewed, setRepeatReviewed] = useState(false);

  // Read the REAL offline package cache presence (display only).
  useEffect(() => {
    if (!open || !data.inspectionId) return;
    let alive = true;
    void local.getPackage(data.inspectionId).then((def) => { if (alive) setPackageCached(!!def); }).catch(() => {});
    return () => { alive = false; };
  }, [open, data.inspectionId, local]);

  // Readiness blocker: the repeat-findings review acknowledgement. This is a
  // local readiness nudge, not an invented governance policy — the authoritative
  // check-in gate lives at /field/[visitId].
  const blocked = !repeatReviewed;
  const startupHref = `/field/${data.visitId}`;

  return (
    <>
      <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setOpen(true)}>
        {strings.openPack}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} aria-hidden className="ax-modal-backdrop" />
          <aside className="ax-drawer" role="dialog" aria-modal="true" aria-label={strings.title} style={{ inlineSize: "min(560px, 94vw)" }}>
            <div className="ax-row" style={{ justifyContent: "space-between", alignItems: "flex-start", padding: "var(--ax-space-250) var(--ax-space-300)", borderBlockEnd: "1px solid var(--ax-color-border)" }}>
              <div>
                <div style={{ font: "var(--ax-text-heading)" }}>{strings.title}</div>
                <div className="ax-caption">
                  {data.factoryName} · <span className="ax-numeric">{data.visitRef}</span>
                  {data.packPolicyVersion && <> · pack policy <span className="ax-numeric">{data.packPolicyVersion.slice(0, 8)}</span></>}
                  {data.packageLabel && <> · package <span className="ax-numeric">{data.packageLabel}</span></>}
                </div>
              </div>
              <button type="button" className="ax-btn ax-btn--icon" onClick={() => setOpen(false)} aria-label={strings.close}>✕</button>
            </div>

            <div className={moduleClasses.packChipRow}>
              <span className={`ax-lozenge ax-lozenge--${blocked ? "warning" : "success"}`}>
                {blocked ? strings.reviewBlocker.replace("{n}", "1") : strings.ready}
              </span>
              <span className="ax-sync ax-sync--synced">{strings.cached}</span>
              {data.freshnessMinutes != null && (
                <span className="ax-freshness ax-numeric">{strings.freshness.replace("{n}", String(data.freshnessMinutes))}</span>
              )}
            </div>

            <div className="ax-drawer__body" style={{ flex: 1, overflowY: "auto" }}>
              <Section title={strings.sectionFactory} open>
                <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "var(--ax-space-100) var(--ax-space-200)", margin: 0 }}>
                  <dt>{strings.crNumber}</dt><dd style={{ margin: 0 }} className="ax-numeric">{data.crNumber ?? "—"}</dd>
                  <dt>{strings.licence}</dt><dd style={{ margin: 0 }}>{data.licence.value ?? <em>{data.licence.unavailable}</em>}</dd>
                  <dt>{strings.officialLocation}</dt><dd style={{ margin: 0 }} className="ax-numeric">{data.officialLocation ?? "—"}</dd>
                  <dt>{strings.provenance}</dt><dd style={{ margin: 0 }}>{strings.provenanceValue}</dd>
                </dl>
              </Section>

              <Section title={strings.sectionPackage}>
                {data.packageLabel
                  ? <>{data.packageLabel}{data.packageStatus ? ` · ${data.packageStatus}` : ""}</>
                  : <em>—</em>}
              </Section>

              <Section title={strings.sectionPrevious}>
                {data.previousApproved ?? strings.noPrevious}
                {data.returnedContext && <div style={{ marginBlockStart: "var(--ax-space-100)" }}>{data.returnedContext}</div>}
              </Section>

              <Section title={strings.sectionRepeat} open>
                {data.repeatFindings.value ?? <em>{data.repeatFindings.unavailable}</em>}
              </Section>

              <Section title={strings.sectionHealthRisk}>
                <div className="ax-row" style={{ gap: "var(--ax-space-300)" }}>
                  <div>
                    <div className="ax-caption">{strings.healthScore}</div>
                    <div style={{ font: "var(--ax-text-body-strong)" }}>{data.health.value ?? <em>{data.health.unavailable}</em>}</div>
                  </div>
                  <div>
                    <div className="ax-caption">{strings.riskScore}</div>
                    <div style={{ font: "var(--ax-text-body-strong)", color: "var(--ax-color-critical-strong)" }}>
                      {data.riskBand ?? "—"}{data.riskScore != null ? ` · ${data.riskScore}` : ""}
                    </div>
                  </div>
                </div>
                <div style={{ marginBlockStart: "var(--ax-space-100)" }}>{strings.distinctConcepts}</div>
                {data.riskDrivers && data.riskDrivers.length > 0 && (
                  <ul style={{ margin: "var(--ax-space-100) 0 0", paddingInlineStart: "var(--ax-space-300)" }}>
                    {data.riskDrivers.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                )}
              </Section>

              <Section title={strings.sectionDocuments}>{strings.documentsNote}</Section>

              {data.compliance && (
                <Section title={strings.compliance.split(" ")[0]} open>
                  {data.compliance.rate != null
                    ? strings.compliance.replace("{rate}", String(data.compliance.rate)).replace("{c}", String(data.compliance.compliant)).replace("{e}", String(data.compliance.eligible))
                    : "—"}
                </Section>
              )}

              <div className={moduleClasses.packReadiness}>
                <div className="ax-overline" style={{ marginBlockEnd: "var(--ax-space-150)" }}>{strings.startReadiness}</div>
                <label className="ax-check">
                  <input type="checkbox" checked={packageCached} readOnly disabled />
                  {strings.ackPackageCached}
                </label>
                <label className="ax-check">
                  <input type="checkbox" checked={factory360Ack} onChange={(e) => setFactory360Ack(e.target.checked)} />
                  {strings.ackFactory360}
                </label>
                <label className="ax-check">
                  <input type="checkbox" checked={repeatReviewed} onChange={(e) => setRepeatReviewed(e.target.checked)} />
                  {strings.ackRepeatReviewed} <span className={moduleClasses.packBlocked}>{strings.required}</span>
                </label>
              </div>
            </div>

            <div className={moduleClasses.packFooter}>
              <button type="button" className="ax-btn ax-btn--secondary" style={{ flex: 1 }}>{strings.downloadOffline}</button>
              <a
                href={blocked ? undefined : startupHref}
                aria-disabled={blocked}
                className="ax-btn ax-btn--prominent"
                style={{ flex: 1, textAlign: "center", ...(blocked ? { opacity: 0.5, pointerEvents: "none" } : {}) }}
                title={strings.startupNote}
              >
                {blocked ? strings.checkInBlocked : strings.checkIn}
              </a>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
