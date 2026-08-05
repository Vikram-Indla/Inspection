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

import { confirmReady, reopenPreparation, savePreparation } from "./preparation-actions";
import styles from "./startup.module.css";

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

  function draftPayload() {
    return {
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
    };
  }

  function onSave() {
    void run(
      () => savePreparation(draftPayload()),
      // No router.refresh() on save: the inline confirmation must stay stable
      // for the next interaction; the draft is server-persisted either way.
      () => setStatus(s.saved),
    );
  }

  function onConfirm() {
    void run(
      // Confirm must never refuse on the strength of a choice the inspector
      // can see selected on screen but has not yet saved — the server only
      // knows what was last persisted. Saving the current draft first closes
      // that gap instead of surfacing a refusal that describes a condition
      // already satisfied in the UI.
      async () => {
        const saved = await savePreparation(draftPayload());
        if (saved.error) return saved;
        return confirmReady(props.visitId);
      },
      r => {
        setConfirmed(r.snapshot ?? { preparation_version: props.snapshot?.preparation_version ?? 1, checksum: props.snapshot?.checksum ?? "" });
        setStatus(null);
        // D-027 anomaly: router.refresh() re-fetches the CORRECT fresh RSC
        // payload (verified server-side) but this page's client tree does not
        // reconcile it — the Startup gate stays as first rendered. Readiness
        // is a hard gate transition (locks/unlocks package download + journey
        // start), so take the deterministic path: full reload from server
        // truth instead of relying on in-place reconciliation.
        window.location.reload();
      },
    );
  }

  function onReopen() {
    void run(
      () => reopenPreparation(props.visitId),
      () => { setConfirmed(null); window.location.reload(); },
    );
  }

  return (
    <div className="stack" data-testid="pre-execution-panel">
      <div className={styles.sectionCard}>
      <div className="panel-header">
        <h4>{s.heading}</h4>
        {ready && <span className="badge badge-compliant" data-testid="pre-execution-ready"><span className="dot" />{s.readyTitle}</span>}
      </div>

      {/* 1 · read-only Planning + factory context */}
      <div>
        <h5>{s.contextHeading}</h5>
        <div className={styles.detailRow}>
          <span className="t-caption">{s.lblFactory}</span>
          <strong>{props.context.factoryName}{props.context.factoryCode ? ` (${props.context.factoryCode})` : ""}</strong>
        </div>
          {/* Phase 7 (§24) — unregistered immediate factory identity, existing
              temporary/unverified marker only (same copy as the visit detail). */}
          {props.context.unverifiedLabel && <span className="badge badge-warning">{props.context.unverifiedLabel}</span>}
        <div className={styles.detailRow}><span className="t-caption">{s.lblVisitType}</span><strong>{props.context.visitType}</strong></div>
        <div className={styles.detailRow}><span className="t-caption">{s.lblWindow}</span><strong className="id-code">{props.context.windowLabel}</strong></div>
        {props.context.priority && <div className={styles.detailRow}><span className="t-caption">{s.lblPriority}</span><strong>{props.context.priority}</strong></div>}
      </div>
      </div>

      {ready ? (
        <div className={styles.sectionCard}>
          <div className="row">
            <span className="tag">{s.dateHeading}: <span className="id-code">{date ?? "—"}</span></span>
            <span className="tag">{s.modeHeading}: {modeWord(mode)}</span>
            {activePackage && <span className="tag">{packageLine(activePackage)}</span>}
          </div>
          {snapshot && (
            <p className="t-caption id-code" data-testid="pre-execution-snapshot">
              {fmt(s.readySnapshot, { n: snapshot.preparation_version, checksum: snapshot.checksum.slice(0, 12) })}
            </p>
          )}
          <div className="row">
            <button className="btn btn-secondary" onClick={onReopen} disabled={busy} data-testid="prep-reopen">
              {busy ? s.working : s.reopen}
            </button>
            <span className="t-caption">{s.reopenCaption}</span>
          </div>
          {error && <div className="alert alert-critical" role="alert"><div>{error}</div></div>}
        </div>
      ) : (
        <div className="stack">
          {/* 2 · Execution Date — window-constrained, per-day availability */}
          <section aria-label={s.dateHeading} className={styles.sectionCard}>
            <h5>{s.dateHeading}</h5>
            <p className="t-caption">{s.dateCaption}</p>
            {props.capacityNote === "unavailable" && <p className="t-caption">{s.availabilityUnknown}</p>}
            {props.capacityNote === "truncated" && <p className="t-caption">{s.truncatedNote}</p>}
            <div className="row" role="group" aria-label={s.dateHeading}>
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
                    className={`btn ${selected ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setDate(d.date)}
                  >
                    <span className="id-code">{d.label}</span>
                    {full ? ` · ${s.dayFull}` : d.remaining != null ? ` · ${fmt(s.dayLeft, { n: d.remaining })}` : ""}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 3 · Visit Mode — planning-set mode + governed alternatives */}
          <section aria-label={s.modeHeading} className={styles.sectionCard}>
            <h5>{s.modeHeading}</h5>
            <div className="stack">
              {(["physical", "virtual"] as const).map(m => {
                const rule = props.modeRules[m];
                const selected = mode === m;
                return (
                  <div key={m} className="row">
                    <button
                      type="button"
                      aria-pressed={selected}
                      disabled={!rule.enabled}
                      data-testid={`prep-mode-${m}`}
                      className={`btn ${selected ? "btn-primary" : "btn-secondary"}`}
                      onClick={() => setMode(m)}
                    >
                      {modeWord(m)}
                    </button>
                    {m === props.plannedMode && <span className="badge badge-info">{s.plannedChip}</span>}
                    {!rule.enabled && rule.reason && <span className="t-caption">{rule.reason}</span>}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 4 · Package — read-only when Planning selected one, governed selector otherwise */}
          <section aria-label={s.packageHeading} className={styles.sectionCard}>
            <h5>{s.packageHeading}</h5>
            {props.plannedPackage ? (
              <div className="stack">
                <div className="row">
                  <span>{packageLine(props.plannedPackage)}</span>
                  <span className="badge badge-info">{s.packageByPlanning}</span>
                  <span className="t-caption id-code">{fmt(s.sectionsCount, { n: props.plannedPackage.sections.length })}</span>
                </div>
              </div>
            ) : (
              <div className="stack">
                <p className="t-caption">{s.packageChoose}</p>
                {props.packageOptions.map(p => {
                  const selected = packageId === p.id;
                  return (
                    <div key={p.id} className="row">
                      <button
                        type="button"
                        aria-pressed={selected}
                        disabled={!p.hasSections}
                        data-testid="prep-package-option"
                        className={`btn ${selected ? "btn-primary" : "btn-secondary"}`}
                        onClick={() => setPackageId(p.id)}
                      >
                        {packageLine(p)} · {fmt(s.sectionsCount, { n: p.sections.length })}
                      </button>
                      {!p.hasSections && <span className="t-caption">{s.packageNoSections}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 5 · Form / Action Form configuration (pre-Ready only; D-007 fail closed) */}
          {activePackage && (
            <section aria-label={s.formsHeading} className={styles.sectionCard}>
              <h5>{s.formsHeading}</h5>
              <div className="stack">
                {activePackage.hasOptionalityMetadata ? (
                  activePackage.sections.map(sec => (
                    <div key={sec.key} className="row">
                      <span>{sec.title}</span>
                      {sec.removable ? (
                        <label className="check">
                          <input
                            type="checkbox"
                            checked={removed.has(sec.key)}
                            onChange={e => {
                              const next = new Set(removed);
                              if (e.target.checked) next.add(sec.key); else next.delete(sec.key);
                              setRemoved(next);
                            }}
                          />
                          <span className="t-caption">{s.removeLabel}</span>
                        </label>
                      ) : null}
                      {sec.removable && <span className="badge badge-info">{s.optionalChip}</span>}
                    </div>
                  ))
                ) : (
                  <p className="t-caption">{s.noRemovableCopy}</p>
                )}
                {props.actionFormTemplates.length > 0 ? (
                  <div className="stack">
                    <span className="t-caption">{s.addedFormsLabel}</span>
                    {props.actionFormTemplates
                      .filter(tpl => !activePackage.actionFormTemplateIds.includes(tpl.id))
                      .map(tpl => (
                        <label key={tpl.id} className="check">
                          <input
                            type="checkbox"
                            checked={added.has(tpl.id)}
                            onChange={e => {
                              const next = new Set(added);
                              if (e.target.checked) next.add(tpl.id); else next.delete(tpl.id);
                              setAdded(next);
                            }}
                          />
                          <span>{tpl.title} · <span className="id-code">{tpl.versionLabel}</span></span>
                        </label>
                      ))}
                  </div>
                ) : (
                  <p className="t-caption">{s.noTemplatesCopy}</p>
                )}
                <label className="check">
                  <input type="checkbox" checked={notifyFactory} onChange={e => setNotifyFactory(e.target.checked)} data-testid="prep-notify-factory" />
                  <span>{s.notifyFactory}</span>
                </label>
              </div>
            </section>
          )}

          {/* 6 · actions: save (no state change) + confirm Ready */}
          <div className={styles.stickyActions}>
            <button className="btn btn-secondary" onClick={onSave} disabled={busy} data-testid="prep-save">
              {busy ? s.working : s.save}
            </button>
            <button className="btn btn-primary" onClick={onConfirm} disabled={busy} data-testid="prep-confirm">
              {busy ? s.working : s.confirm}
            </button>
          </div>
          {status && <div className="alert alert-success" role="status" data-testid="prep-status"><div>{status}</div></div>}
          {error && <div className="alert alert-critical" role="alert"><div>{error}</div></div>}
        </div>
      )}
    </div>
  );
}
