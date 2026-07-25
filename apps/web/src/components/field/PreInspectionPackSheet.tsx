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
  packageVersionId: string | null;
  packageDefinition: unknown | null;
  packageChecksum: string | null;
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
  downloadingOffline: string;
  downloadUnavailable: string;
  downloadFailed: string;
  retryDownload: string;
  integrityVerified: string;
  integrityFailed: string;
  packageOutdated: string;
  legacyUnverified: string;
  offlineUnavailable: string;
  packageVersion: string;
  packageHash: string;
  checkIn: string;           // "Check in — startup"
  checkInBlocked: string;    // "Check in — review required"
  startupNote: string;       // "Opens the governed startup; check-in gates are enforced there."
};

function Section({ title, open, children }: { title: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details open={open} style={{ border: "1px solid var(--border-subtle)", borderRadius: 14, background: "var(--surface-primary)", boxShadow: "var(--shadow-card)" }}>
      <summary style={{ padding: "12px 18px", cursor: "pointer", font: "var(--type-body-strong)" }}>{title}</summary>
      <div style={{ padding: "0 18px 16px", font: "var(--type-caption-font)", color: "var(--text-secondary)" }}>{children}</div>
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
  const [cacheState, setCacheState] = useState<"checking" | "missing" | "downloading" | "verified" | "outdated" | "corrupt" | "legacy_unverified" | "failed">("checking");
  const [online, setOnline] = useState(true);
  const [factory360Ack, setFactory360Ack] = useState(false);
  const [repeatReviewed, setRepeatReviewed] = useState(false);

  // Read the REAL offline package cache presence (display only).
  const cacheKey = data.inspectionId ? `inspection:${data.inspectionId}` : `visit:${data.visitId}`;
  const authority = useMemo(() => data.packageVersionId ? ({
    packageVersionId: data.packageVersionId,
    authorityChecksum: data.packageChecksum,
  }) : null, [data.packageChecksum, data.packageVersionId]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    if (!authority) {
      setCacheState("missing");
      setPackageCached(false);
      return;
    }
    void local.resolveVerifiedPackage({
      visitId: data.visitId,
      inspectionId: data.inspectionId,
      authority,
    }).then((result) => {
      if (!alive) return;
      setCacheState(result.state);
      setPackageCached(result.state === "verified");
    }).catch(() => {
      if (alive) {
        setCacheState("failed");
        setPackageCached(false);
      }
    });
    return () => { alive = false; };
  }, [authority, data.inspectionId, data.visitId, open, local]);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  async function downloadOfflinePackage() {
    if (!online || !data.packageVersionId || data.packageDefinition == null) return;
    setCacheState("downloading");
    try {
      await local.cacheVerifiedPackage(cacheKey, {
        packageVersionId: data.packageVersionId,
        packageVersionLabel: data.packageLabel ?? data.packageVersionId,
        authorityChecksum: data.packageChecksum,
        definition: data.packageDefinition,
      });
      const verified = await local.verifyCachedPackage(cacheKey, {
        packageVersionId: data.packageVersionId,
        authorityChecksum: data.packageChecksum,
      });
      setCacheState(verified.state);
      setPackageCached(verified.state === "verified");
    } catch {
      setCacheState("failed");
      setPackageCached(false);
    }
  }

  // This drawer's Continue control requires the downloaded package to pass its
  // local integrity + authority check and the two review acknowledgements.
  // The server-side startup/readiness gate remains independently authoritative.
  const blockerCount = Number(!packageCached) + Number(!factory360Ack) + Number(!repeatReviewed);
  const blocked = blockerCount > 0;

  function continueToReadiness() {
    if (blocked) return;
    setOpen(false);
    requestAnimationFrame(() => {
      document.querySelector('[data-testid="pre-execution-panel"]')?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <>
      <button type="button" className="sq-btn sq-btn--secondary" onClick={() => setOpen(true)}>
        {strings.openPack}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} aria-hidden className="sq-modal-backdrop" />
          <aside className="sq-drawer" role="dialog" aria-modal="true" aria-label={strings.title} style={{ inlineSize: "min(560px, 94vw)", background: "var(--surface-canvas)" }}>
            <div className="sq-row" style={{ justifyContent: "space-between", alignItems: "flex-start", padding: "14px 18px", borderBlockEnd: "1px solid var(--border-subtle)", background: "var(--surface-primary)" }}>
              <div>
                <div style={{ font: "var(--type-heading-lg)" }}>{strings.title}</div>
                <div className="sq-caption">
                  {data.factoryName} · <span className="sq-numeric">{data.visitRef}</span>
                  {data.packPolicyVersion && <> · pack policy <span className="sq-numeric">{data.packPolicyVersion.slice(0, 8)}</span></>}
                  {data.packageLabel && <> · package <span className="sq-numeric">{data.packageLabel}</span></>}
                </div>
              </div>
              <button type="button" className="sq-btn sq-btn--icon" onClick={() => setOpen(false)} aria-label={strings.close}>✕</button>
            </div>

            <div className={moduleClasses.packChipRow}>
              <span className={`sq-lozenge sq-lozenge--${blocked ? "warning" : "success"}`}>
                {blocked ? strings.reviewBlocker.replace("{n}", String(blockerCount)) : strings.ready}
              </span>
              <span className={`sq-sync ${packageCached ? "sq-sync--synced" : ""}`} role="status" data-testid="pack-cache-status">
                {cacheState === "verified" ? strings.integrityVerified
                  : cacheState === "outdated" ? strings.packageOutdated
                  : cacheState === "corrupt" ? strings.integrityFailed
                    : cacheState === "legacy_unverified" ? strings.legacyUnverified
                      : cacheState === "failed" ? strings.downloadFailed
                        : strings.downloadUnavailable}
              </span>
              {data.freshnessMinutes != null && (
                <span className="sq-freshness sq-numeric">{strings.freshness.replace("{n}", String(data.freshnessMinutes))}</span>
              )}
            </div>

            <div className="sq-drawer__body" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, padding: "14px 18px 100px" }}>
              <Section title={strings.sectionFactory} open>
                <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "var(--space-2) var(--space-4)", margin: 0 }}>
                  {data.crNumber && <><dt>{strings.crNumber}</dt><dd style={{ margin: 0 }} className="sq-numeric">{data.crNumber}</dd></>}
                  {(data.licence.value || data.licence.unavailable) && <><dt>{strings.licence}</dt><dd style={{ margin: 0 }}>{data.licence.value ?? <em>{data.licence.unavailable}</em>}</dd></>}
                  {data.officialLocation && <><dt>{strings.officialLocation}</dt><dd style={{ margin: 0 }} className="sq-numeric">{data.officialLocation}</dd></>}
                  <dt>{strings.provenance}</dt><dd style={{ margin: 0 }}>{strings.provenanceValue}</dd>
                </dl>
              </Section>

              {/* Keeps the authority-integrity readout (version + checksum) while
                  following the zero-assumption rule: the section is omitted when
                  there is no package, and the hash line is omitted when there is
                  no checksum, rather than rendering a "—" that reads as a value. */}
              {data.packageLabel && <Section title={strings.sectionPackage}>
                <div>{strings.packageVersion}: <span className="sq-numeric">{data.packageLabel}</span>{data.packageStatus ? ` · ${data.packageStatus}` : ""}</div>
                {data.packageChecksum && <div>{strings.packageHash}: <span className="sq-numeric">{data.packageChecksum.slice(0, 16)}</span></div>}
              </Section>}

              {(data.previousApproved || data.returnedContext) && <Section title={strings.sectionPrevious}>
                {data.previousApproved}
                {data.returnedContext && <div style={{ marginBlockStart: "var(--space-2)" }}>{data.returnedContext}</div>}
              </Section>}

              <Section title={strings.sectionRepeat} open>
                {data.repeatFindings.value ?? <em>{data.repeatFindings.unavailable}</em>}
              </Section>

              {(data.health.value || data.health.unavailable || data.riskBand || data.riskScore != null || (data.riskDrivers && data.riskDrivers.length > 0)) && <Section title={strings.sectionHealthRisk}>
                <div className="sq-row" style={{ gap: "var(--space-6)" }}>
                  <div>
                    <div className="sq-caption">{strings.healthScore}</div>
                    <div style={{ font: "var(--type-body-strong)" }}>{data.health.value ?? <em>{data.health.unavailable}</em>}</div>
                  </div>
                  <div>
                    <div className="sq-caption">{strings.riskScore}</div>
                    {(data.riskBand || data.riskScore != null) && <div style={{ font: "var(--type-body-strong)", color: "var(--status-critical-text)" }}>
                      {data.riskBand}{data.riskScore != null ? `${data.riskBand ? " · " : ""}${data.riskScore}` : ""}
                    </div>}
                  </div>
                </div>
                <div style={{ marginBlockStart: "var(--space-2)" }}>{strings.distinctConcepts}</div>
                {data.riskDrivers && data.riskDrivers.length > 0 && (
                  <ul style={{ margin: "var(--space-2) 0 0", paddingInlineStart: "var(--space-6)" }}>
                    {data.riskDrivers.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                )}
              </Section>}

              <Section title={strings.sectionDocuments}>{strings.documentsNote}</Section>

              {data.compliance?.rate != null && (
                <Section title={strings.compliance.split(" ")[0]} open>
                  {strings.compliance.replace("{rate}", String(data.compliance.rate)).replace("{c}", String(data.compliance.compliant)).replace("{e}", String(data.compliance.eligible))}
                </Section>
              )}

              <div className={moduleClasses.packReadiness}>
                <div className="sq-overline" style={{ marginBlockEnd: "var(--space-3)" }}>{strings.startReadiness}</div>
                <label className="sq-check">
                  <input type="checkbox" checked={packageCached} readOnly disabled />
                  {strings.ackPackageCached} <span className={moduleClasses.packBlocked}>{strings.required}</span>
                </label>
                <label className="sq-check">
                  <input type="checkbox" checked={factory360Ack} onChange={(e) => setFactory360Ack(e.target.checked)} />
                  {strings.ackFactory360} <span className={moduleClasses.packBlocked}>{strings.required}</span>
                </label>
                <label className="sq-check">
                  <input type="checkbox" checked={repeatReviewed} onChange={(e) => setRepeatReviewed(e.target.checked)} />
                  {strings.ackRepeatReviewed} <span className={moduleClasses.packBlocked}>{strings.required}</span>
                </label>
              </div>
            </div>

            <div className={moduleClasses.packFooter}>
              <button
                type="button"
                className="sq-btn sq-btn--secondary"
                style={{ flex: 1 }}
                onClick={() => void downloadOfflinePackage()}
                disabled={!online || !data.packageVersionId || data.packageDefinition == null || cacheState === "downloading"}
                data-testid="pack-download-offline"
              >
                {cacheState === "downloading" ? strings.downloadingOffline
                  : !online ? strings.offlineUnavailable
                    : cacheState === "failed" || cacheState === "corrupt" || cacheState === "outdated" || cacheState === "legacy_unverified"
                      ? strings.retryDownload
                      : strings.downloadOffline}
              </button>
              <button
                type="button"
                onClick={continueToReadiness}
                disabled={blocked}
                aria-disabled={blocked}
                className="sq-btn sq-btn--prominent"
                style={{ flex: 1, textAlign: "center", ...(blocked ? { opacity: 0.5, pointerEvents: "none" } : {}) }}
                title={strings.startupNote}
              >
                {blocked ? strings.checkInBlocked : strings.checkIn}
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
