"use client";
// TASK-EXECUTION-MODULE-001 · Phase 3B — Pre-Execution panel (Preparation).
// SAQEEL-EXE-CANONICAL-PLAN v1.0 §7/§10: no package download and no journey
// start before the readiness contract is complete. This panel walks the
// assigned inspector through Execution Date selection (window-constrained,
// daily-cap availability per day), Visit Mode confirmation (engine-governed
// eligibility; self-assessment is never offered), package resolution
// (read-only when Planning selected one; a governed selector of published
// versions otherwise), fail-closed Form/Action Form configuration (D-007),
// the factory-notification choice, Save (no state change) and Confirm Ready
// (freezes the immutable package snapshot). After Ready it shows the summary
// plus the reopen path back to New. All writes go through the readiness RPCs
// via preparation-actions.ts — the server re-validates everything.
import { useState } from "react";
import { useRouter } from "next/navigation";

import { confirmReady, reopenPreparation, savePreparation } from "./preparation-actions";

export type PreExecutionStrings = {
  heading: string;
  contextHeading: string;
  lblFactory: string; lblVisitType: string; lblWindow: string; lblPriority: string;
  dateHeading: string; dateCaption: string;
  dayLeft: string;            // "{n} left"
  dayFull: string;            // "Fully booked"
  availabilityUnknown: string;
  truncatedNote: string;
  modeHeading: string;
  plannedChip: string;        // "planned by Planning"
  physical: string; virtual: string;
  modeOffConfig: string;      // shown inside reason text from the server
  packageHeading: string;
  packageByPlanning: string;
  packageChoose: string;
  packageNoSections: string;
  sectionsCount: string;      // "{n} sections"
  formsHeading: string;
  removeLabel: string;
  optionalChip: string;
  noRemovableCopy: string;
  addedFormsLabel: string;
  noTemplatesCopy: string;
  notifyFactory: string;
  save: string; saved: string;
  confirm: string;
  readyTitle: string;
  readySnapshot: string;      // "Package snapshot v{n} · checksum {checksum}"
  reopen: string; reopenCaption: string;
  working: string;
  genericError: string;
  errors: Record<string, string>;
};

export type PreparationDay = { date: string; label: string; remaining: number | null; past: boolean };
export type PreparationSection = { key: string; title: string; removable: boolean };
export type PreparationPackage = {
  id: string; code: string; title: string; versionLabel: string;
  sections: PreparationSection[];
  hasOptionalityMetadata: boolean;
  actionFormTemplateIds: string[];
  hasSections: boolean;
};
export type ActionFormTemplate = { id: string; title: string; versionLabel: string };
export type ModeRule = { enabled: boolean; reason: string | null };
export type PreparationDraft = {
  executionDate: string | null;
  confirmedMode: "physical" | "virtual" | null;
  packageVersionId: string | null;
  removedSectionKeys: string[];
  addedTemplateIds: string[];
  notifyFactory: boolean;
};

const fmt = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k) => String(vars[k] ?? m));

export default function PreExecution(props: {
  visitId: string;
  ready: boolean;
  snapshot: { preparation_version: number; checksum: string } | null;
  context: { factoryName: string; factoryCode: string | null; visitType: string; priority: string | null; windowLabel: string; unverifiedLabel?: string | null };
  days: PreparationDay[];
  capacityNote: "ok" | "unavailable" | "truncated";
  plannedMode: "physical" | "virtual";
  modeRules: { physical: ModeRule; virtual: ModeRule };
  plannedPackage: PreparationPackage | null;
  packageOptions: PreparationPackage[];
  actionFormTemplates: ActionFormTemplate[];
  draft: PreparationDraft | null;
  strings: PreExecutionStrings;
}) {
  const { strings: s } = props;
  const router = useRouter();
  const [date, setDate] = useState(props.draft?.executionDate ?? null as string | null);
  const [mode, setMode] = useState(props.draft?.confirmedMode ?? props.plannedMode);
  const [packageId, setPackageId] = useState(props.draft?.packageVersionId ?? null as string | null);
  const [removed, setRemoved] = useState(() => new Set(props.draft?.removedSectionKeys ?? []));
  const [added, setAdded] = useState(() => new Set(props.draft?.addedTemplateIds ?? []));
  const [notifyFactory, setNotifyFactory] = useState(props.draft?.notifyFactory ?? false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null as string | null);
  const [error, setError] = useState(null as string | null);
  const [confirmed, setConfirmed] = useState(null as { preparation_version: number; checksum: string } | null);

  const errorText = (code: string) => s.errors[code] ?? s.genericError;
  const ready = props.ready || confirmed != null;
  const snapshot = confirmed ?? props.snapshot;
  const activePackage: PreparationPackage | null =
    props.plannedPackage ?? props.packageOptions.find(p => p.id === packageId) ?? null;
  const modeWord = (m: "physical" | "virtual") => (m === "virtual" ? s.virtual : s.physical);
  const packageLine = (p: PreparationPackage) => `${p.code} · ${p.title} · ${p.versionLabel}`;

  async function run(action: () => Promise<{ ok?: boolean; error?: string; snapshot?: { preparation_version: number; checksum: string } }>, onOk: (r: { snapshot?: { preparation_version: number; checksum: string } }) => void) {
    setBusy(true); setError(null); setStatus(null);
    try {
      const r = await action();
      if (r.error) { setError(errorText(r.error)); return; }
      onOk(r);
    } finally { setBusy(false); }
  }

  function onSave() {
    void run(
      () => savePreparation({
        visitId: props.visitId,
        executionDate: date,
        confirmedMode: mode,
        // A Planning-set package stays planner-owned: the draft references no
        // override and the RPC resolves the visit's own package_version_id.
        packageVersionId: props.plannedPackage ? null : packageId,
        formConfig: {
          removed_optional_section_keys: [...removed],
          added_action_form_template_ids: [...added],
          notify_factory: notifyFactory,
        },
      }),
      // No router.refresh() on save: the inline confirmation must stay stable
      // for the next interaction; the draft is server-persisted either way.
      () => setStatus(s.saved),
    );
  }

  function onConfirm() {
    void run(
      () => confirmReady(props.visitId),
      r => {
        setConfirmed(r.snapshot ?? { preparation_version: props.snapshot?.preparation_version ?? 1, checksum: props.snapshot?.checksum ?? "" });
        setStatus(null);
        router.refresh();
      },
    );
  }

  function onReopen() {
    void run(
      () => reopenPreparation(props.visitId),
      () => { setConfirmed(null); router.refresh(); },
    );
  }

  return (
    <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }} data-testid="pre-execution-panel">
      <div className="ax-row" style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", marginBlockEnd: "var(--ax-space-150)" }}>
        <h4>{s.heading}</h4>
        {ready && <span className="ax-lozenge ax-lozenge--success" data-testid="pre-execution-ready">{s.readyTitle}</span>}
      </div>

      {/* 1 · read-only Planning + factory context */}
      <div className="ax-stack" style={{ gap: 4, marginBlockEnd: "var(--ax-space-200)" }}>
        <h5 style={{ marginBlockEnd: 4 }}>{s.contextHeading}</h5>
        <div className="ax-row" style={{ gap: 8, flexWrap: "wrap" }}>
          <span className="ax-badge">{s.lblFactory}: {props.context.factoryName}{props.context.factoryCode ? ` (${props.context.factoryCode})` : ""}</span>
          {/* Phase 7 (§24) — unregistered immediate factory identity, existing
              temporary/unverified marker only (same copy as the visit detail). */}
          {props.context.unverifiedLabel && <span className="ax-lozenge ax-lozenge--warning">{props.context.unverifiedLabel}</span>}
          <span className="ax-badge">{s.lblVisitType}: {props.context.visitType}</span>
          <span className="ax-badge">{s.lblWindow}: {props.context.windowLabel}</span>
          <span className="ax-badge">{s.lblPriority}: {props.context.priority ?? "—"}</span>
        </div>
      </div>

      {ready ? (
        <div className="ax-stack" style={{ gap: "var(--ax-space-150)" }}>
          <div className="ax-row" style={{ gap: 8, flexWrap: "wrap" }}>
            <span className="ax-badge">{s.dateHeading}: <span className="ax-numeric">{date ?? "—"}</span></span>
            <span className="ax-badge">{s.modeHeading}: {modeWord(mode)}</span>
            {activePackage && <span className="ax-badge">{packageLine(activePackage)}</span>}
          </div>
          {snapshot && (
            <p className="ax-caption ax-numeric" data-testid="pre-execution-snapshot">
              {fmt(s.readySnapshot, { n: snapshot.preparation_version, checksum: snapshot.checksum.slice(0, 12) })}
            </p>
          )}
          <div className="ax-row" style={{ gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button className="ax-btn ax-btn--subtle" onClick={onReopen} disabled={busy} data-testid="prep-reopen">
              {busy ? s.working : s.reopen}
            </button>
            <span className="ax-caption">{s.reopenCaption}</span>
          </div>
          {error && <div className="ax-banner ax-banner--critical" role="alert"><div>{error}</div></div>}
        </div>
      ) : (
        <div className="ax-stack" style={{ gap: "var(--ax-space-250)" }}>
          {/* 2 · Execution Date — window-constrained, per-day availability */}
          <section aria-label={s.dateHeading}>
            <h5 style={{ marginBlockEnd: 4 }}>{s.dateHeading}</h5>
            <p className="ax-caption" style={{ marginBlockEnd: "var(--ax-space-100)" }}>{s.dateCaption}</p>
            {props.capacityNote === "unavailable" && <p className="ax-caption">{s.availabilityUnknown}</p>}
            {props.capacityNote === "truncated" && <p className="ax-caption">{s.truncatedNote}</p>}
            <div className="ax-row" style={{ gap: 8, flexWrap: "wrap" }} role="group" aria-label={s.dateHeading}>
              {props.days.map(d => {
                const full = d.remaining != null && d.remaining <= 0;
                const disabled = d.past || full;
                const selected = date === d.date;
                return (
                  <button
                    key={d.date}
                    type="button"
                    aria-pressed={selected}
                    disabled={disabled}
                    data-testid={disabled ? "prep-day-disabled" : "prep-day-available"}
                    className={`ax-btn ${selected ? "ax-btn--prominent" : "ax-btn--subtle"}`}
                    onClick={() => setDate(d.date)}
                  >
                    <span className="ax-numeric">{d.label}</span>
                    {full ? ` · ${s.dayFull}` : d.remaining != null ? ` · ${fmt(s.dayLeft, { n: d.remaining })}` : ""}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 3 · Visit Mode — planning-set mode + governed alternatives */}
          <section aria-label={s.modeHeading}>
            <h5 style={{ marginBlockEnd: 4 }}>{s.modeHeading}</h5>
            <div className="ax-stack" style={{ gap: 8 }}>
              {(["physical", "virtual"] as const).map(m => {
                const rule = props.modeRules[m];
                const selected = mode === m;
                return (
                  <div key={m} className="ax-row" style={{ gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      disabled={!rule.enabled}
                      data-testid={`prep-mode-${m}`}
                      className={`ax-btn ${selected ? "ax-btn--prominent" : "ax-btn--subtle"}`}
                      onClick={() => setMode(m)}
                    >
                      {modeWord(m)}
                    </button>
                    {m === props.plannedMode && <span className="ax-lozenge ax-lozenge--info">{s.plannedChip}</span>}
                    {!rule.enabled && rule.reason && <span className="ax-caption">{rule.reason}</span>}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 4 · Package — read-only when Planning selected one, governed selector otherwise */}
          <section aria-label={s.packageHeading}>
            <h5 style={{ marginBlockEnd: 4 }}>{s.packageHeading}</h5>
            {props.plannedPackage ? (
              <div className="ax-stack" style={{ gap: 4 }}>
                <div className="ax-row" style={{ gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span>{packageLine(props.plannedPackage)}</span>
                  <span className="ax-lozenge ax-lozenge--info">{s.packageByPlanning}</span>
                  <span className="ax-caption ax-numeric">{fmt(s.sectionsCount, { n: props.plannedPackage.sections.length })}</span>
                </div>
              </div>
            ) : (
              <div className="ax-stack" style={{ gap: 8 }}>
                <p className="ax-caption">{s.packageChoose}</p>
                {props.packageOptions.map(p => {
                  const selected = packageId === p.id;
                  return (
                    <div key={p.id} className="ax-row" style={{ gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        aria-pressed={selected}
                        disabled={!p.hasSections}
                        data-testid="prep-package-option"
                        className={`ax-btn ${selected ? "ax-btn--prominent" : "ax-btn--subtle"}`}
                        onClick={() => setPackageId(p.id)}
                      >
                        {packageLine(p)} · {fmt(s.sectionsCount, { n: p.sections.length })}
                      </button>
                      {!p.hasSections && <span className="ax-caption">{s.packageNoSections}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 5 · Form / Action Form configuration (pre-Ready only; D-007 fail closed) */}
          {activePackage && (
            <section aria-label={s.formsHeading}>
              <h5 style={{ marginBlockEnd: 4 }}>{s.formsHeading}</h5>
              <div className="ax-stack" style={{ gap: 8 }}>
                {activePackage.hasOptionalityMetadata ? (
                  activePackage.sections.map(sec => (
                    <div key={sec.key} className="ax-row" style={{ gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span>{sec.title}</span>
                      {sec.removable ? (
                        <label className="ax-row" style={{ gap: 6, alignItems: "center" }}>
                          <input
                            type="checkbox"
                            checked={removed.has(sec.key)}
                            onChange={e => {
                              const next = new Set(removed);
                              if (e.target.checked) next.add(sec.key); else next.delete(sec.key);
                              setRemoved(next);
                            }}
                          />
                          <span className="ax-caption">{s.removeLabel}</span>
                        </label>
                      ) : null}
                      {sec.removable && <span className="ax-lozenge ax-lozenge--info">{s.optionalChip}</span>}
                    </div>
                  ))
                ) : (
                  <p className="ax-caption">{s.noRemovableCopy}</p>
                )}
                {props.actionFormTemplates.length > 0 ? (
                  <div className="ax-stack" style={{ gap: 6 }}>
                    <span className="ax-caption">{s.addedFormsLabel}</span>
                    {props.actionFormTemplates
                      .filter(tpl => !activePackage.actionFormTemplateIds.includes(tpl.id))
                      .map(tpl => (
                        <label key={tpl.id} className="ax-row" style={{ gap: 6, alignItems: "center" }}>
                          <input
                            type="checkbox"
                            checked={added.has(tpl.id)}
                            onChange={e => {
                              const next = new Set(added);
                              if (e.target.checked) next.add(tpl.id); else next.delete(tpl.id);
                              setAdded(next);
                            }}
                          />
                          <span>{tpl.title} · <span className="ax-numeric">{tpl.versionLabel}</span></span>
                        </label>
                      ))}
                  </div>
                ) : (
                  <p className="ax-caption">{s.noTemplatesCopy}</p>
                )}
                <label className="ax-row" style={{ gap: 6, alignItems: "center" }}>
                  <input type="checkbox" checked={notifyFactory} onChange={e => setNotifyFactory(e.target.checked)} data-testid="prep-notify-factory" />
                  <span>{s.notifyFactory}</span>
                </label>
              </div>
            </section>
          )}

          {/* 6 · actions: save (no state change) + confirm Ready */}
          <div className="ax-row" style={{ gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button className="ax-btn" onClick={onSave} disabled={busy} data-testid="prep-save">
              {busy ? s.working : s.save}
            </button>
            <button className="ax-btn ax-btn--prominent" onClick={onConfirm} disabled={busy} data-testid="prep-confirm">
              {busy ? s.working : s.confirm}
            </button>
          </div>
          {status && <div className="ax-banner ax-banner--success" role="status" data-testid="prep-status"><div>{status}</div></div>}
          {error && <div className="ax-banner ax-banner--critical" role="alert"><div>{error}</div></div>}
        </div>
      )}
    </div>
  );
}
