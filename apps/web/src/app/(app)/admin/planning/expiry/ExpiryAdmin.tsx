"use client";
// M9 / PLN-CON-013 — planning expiry rules editor. One section per governed
// rule type; each lists its versions (single enabled invariant), with
// enable/disable, inline edit, and a new-version form (created disabled).
// Scope is a guided exact-match picker — never free JSON. Every change gets
// its own honest ok/error. Read-only when canConfigure is false (the page
// explains why; the server actions re-check).
import { useState, useTransition, type FormEvent } from "react";
import { createRuleVersion, setRuleEnabled, updateRule, type ExpiryResult } from "./actions";
import { RULE_TYPES, type ExpiryRuleRow, type ExpiryScope } from "./types";

export type ExpiryLabels = {
  readOnlyWhy: string;
  ruleTypes: Record<string, string>;
  colVersion: string; colStatus: string; colOffset: string; colReason: string;
  colNotify: string; colScope: string; colEffective: string; colActions: string;
  enabled: string; disabled: string;
  enable: string; disable: string; edit: string; closeEdit: string;
  save: string; newVersion: string; createVersion: string; working: string;
  offsetLabel: string; reasonLabel: string;
  notifyPlanCreator: string; notifyInspector: string;
  scopeVisitType: string; scopeExecutionMode: string; scopePriority: string;
  any: string; allVisits: string; minutes: string;
  effectiveFrom: string; ongoing: string;
  noVersions: string;
  schedulerNote: string;
  scopeOptions: {
    visit_type: Record<string, string>;
    execution_mode: Record<string, string>;
    priority: Record<string, string>;
  };
};

const VISIT_TYPES = ["periodic", "follow_up", "complaint"] as const;
const EXECUTION_MODES = ["physical", "virtual", "administrative"] as const;
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

function scopeSummary(scope: ExpiryScope | null, labels: ExpiryLabels): string {
  if (!scope || Object.keys(scope).length === 0) return labels.allVisits;
  const parts: string[] = [];
  if (scope.visit_type) parts.push(labels.scopeOptions.visit_type[scope.visit_type] ?? scope.visit_type);
  if (scope.execution_mode) parts.push(labels.scopeOptions.execution_mode[scope.execution_mode] ?? scope.execution_mode);
  if (scope.priority) parts.push(labels.scopeOptions.priority[scope.priority] ?? scope.priority);
  return parts.length ? parts.join(" · ") : labels.allVisits;
}

function formatInstant(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function RuleForm({ row, ruleType, labels, onDone }: {
  row?: ExpiryRuleRow; ruleType: string; labels: ExpiryLabels; onDone: () => void;
}) {
  const [feedback, setFeedback] = useState<ExpiryResult>({});
  const [pending, startTransition] = useTransition();
  const scope = row?.scope ?? {};
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("rule_type", ruleType);
    if (row) fd.set("rule_id", row.id);
    setFeedback({});
    startTransition(async () => {
      const res = row ? await updateRule(fd) : await createRuleVersion(fd);
      setFeedback(res);
      if (res.ok) onDone();
    });
  };
  return (
    <form onSubmit={submit} className="sq-surface" style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      <div className="row" style={{ gap: "var(--space-3)", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div className="sq-field" style={{ maxInlineSize: 150 }}>
          <label className="sq-field__label" htmlFor={row ? `ex-off-${row.id}` : `ex-off-new-${ruleType}`}>{labels.offsetLabel}</label>
          <input className="sq-input numeric" id={row ? `ex-off-${row.id}` : `ex-off-new-${ruleType}`}
            name="offset_minutes" type="number" min={0} max={525600} step={1} required
            defaultValue={row?.offset_minutes ?? 0} />
        </div>
        <div className="sq-field">
          <label className="sq-field__label" htmlFor={row ? `ex-vt-${row.id}` : `ex-vt-new-${ruleType}`}>{labels.scopeVisitType}</label>
          <select className="sq-select" id={row ? `ex-vt-${row.id}` : `ex-vt-new-${ruleType}`} name="scope_visit_type" defaultValue={scope.visit_type ?? "any"}>
            <option value="any">{labels.any}</option>
            {VISIT_TYPES.map(v => <option key={v} value={v}>{labels.scopeOptions.visit_type[v] ?? v}</option>)}
          </select>
        </div>
        <div className="sq-field">
          <label className="sq-field__label" htmlFor={row ? `ex-em-${row.id}` : `ex-em-new-${ruleType}`}>{labels.scopeExecutionMode}</label>
          <select className="sq-select" id={row ? `ex-em-${row.id}` : `ex-em-new-${ruleType}`} name="scope_execution_mode" defaultValue={scope.execution_mode ?? "any"}>
            <option value="any">{labels.any}</option>
            {EXECUTION_MODES.map(v => <option key={v} value={v}>{labels.scopeOptions.execution_mode[v] ?? v}</option>)}
          </select>
        </div>
        <div className="sq-field">
          <label className="sq-field__label" htmlFor={row ? `ex-pr-${row.id}` : `ex-pr-new-${ruleType}`}>{labels.scopePriority}</label>
          <select className="sq-select" id={row ? `ex-pr-${row.id}` : `ex-pr-new-${ruleType}`} name="scope_priority" defaultValue={scope.priority ?? "any"}>
            <option value="any">{labels.any}</option>
            {PRIORITIES.map(v => <option key={v} value={v}>{labels.scopeOptions.priority[v] ?? v}</option>)}
          </select>
        </div>
      </div>
      <div className="sq-field">
        <label className="sq-field__label" htmlFor={row ? `ex-rs-${row.id}` : `ex-rs-new-${ruleType}`}>{labels.reasonLabel}</label>
        <input className="sq-input" id={row ? `ex-rs-${row.id}` : `ex-rs-new-${ruleType}`} name="reason" required maxLength={500} defaultValue={row?.reason ?? ""} />
      </div>
      <div className="row" style={{ gap: "var(--space-4)", flexWrap: "wrap" }}>
        <label className="sq-caption" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" name="notify_plan_creator" value="1" defaultChecked={row?.notify_plan_creator ?? true} /> {labels.notifyPlanCreator}
        </label>
        <label className="sq-caption" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" name="notify_inspector" value="1" defaultChecked={row?.notify_inspector ?? false} /> {labels.notifyInspector}
        </label>
      </div>
      <div className="row" style={{ gap: "var(--space-3)", alignItems: "center" }}>
        <button className="sq-btn sq-btn--prominent" disabled={pending}>{pending ? labels.working : row ? labels.save : labels.createVersion}</button>
        <button type="button" className="sq-btn" onClick={onDone}>{labels.closeEdit}</button>
        {feedback.ok && !pending && <span className="sq-lozenge sq-lozenge--success" role="status">{feedback.ok}</span>}
        {feedback.error && <span role="alert" className="sq-caption" style={{ color: "var(--status-critical-text)" }}>{feedback.error}</span>}
      </div>
    </form>
  );
}

export default function ExpiryAdmin({ rows, canConfigure, labels }: {
  rows: ExpiryRuleRow[]; canConfigure: boolean; labels: ExpiryLabels;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creatingType, setCreatingType] = useState<string | null>(null);
  const [toggleFeedback, setToggleFeedback] = useState<ExpiryResult>({});
  const [pending, startTransition] = useTransition();

  const toggle = (row: ExpiryRuleRow) => {
    const fd = new FormData();
    fd.set("rule_id", row.id);
    fd.set("rule_type", row.rule_type);
    fd.set("enable", row.enabled ? "0" : "1");
    setToggleFeedback({});
    startTransition(async () => setToggleFeedback(await setRuleEnabled(fd)));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {!canConfigure && <div className="sq-banner sq-banner--warning" role="status"><div>{labels.readOnlyWhy}</div></div>}
      {toggleFeedback.ok && <div className="sq-banner sq-banner--success" role="status"><div>{toggleFeedback.ok}</div></div>}
      {toggleFeedback.error && <div className="sq-banner sq-banner--critical" role="alert"><div>{toggleFeedback.error}</div></div>}

      {RULE_TYPES.map(ruleType => {
        const versions = rows
          .filter(r => r.rule_type === ruleType)
          .sort((a, b) => b.version - a.version);
        return (
          <section key={ruleType} className="sq-surface" style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: "var(--space-3)" }}>
              <h2 style={{ margin: 0 }}>{labels.ruleTypes[ruleType] ?? ruleType}</h2>
              {canConfigure && (
                <button type="button" className="sq-btn sq-btn--subtle" disabled={pending}
                  onClick={() => { setEditingId(null); setCreatingType(creatingType === ruleType ? null : ruleType); }}>
                  {labels.newVersion}
                </button>
              )}
            </div>

            {creatingType === ruleType && (
              <RuleForm ruleType={ruleType} labels={labels} onDone={() => setCreatingType(null)} />
            )}

            {versions.length === 0 ? (
              <p className="sq-caption" style={{ margin: 0 }}>{labels.noVersions}</p>
            ) : (
              <div className="sq-tablewrap"><table className="sq-table">
                <thead><tr>
                  <th scope="col">{labels.colVersion}</th>
                  <th scope="col">{labels.colStatus}</th>
                  <th scope="col">{labels.colOffset}</th>
                  <th scope="col">{labels.colReason}</th>
                  <th scope="col">{labels.colNotify}</th>
                  <th scope="col">{labels.colScope}</th>
                  <th scope="col">{labels.colEffective}</th>
                  {canConfigure && <th scope="col">{labels.colActions}</th>}
                </tr></thead>
                <tbody>
                  {versions.map(row => {
                    const notify: string[] = [];
                    if (row.notify_plan_creator) notify.push(labels.notifyPlanCreator);
                    if (row.notify_inspector) notify.push(labels.notifyInspector);
                    return (
                      <tr key={row.id}>
                        <td><strong className="sq-numeric">v{row.version}</strong></td>
                        <td><span className={`sq-lozenge ${row.enabled ? "sq-lozenge--success" : "sq-lozenge--critical"}`}>{row.enabled ? labels.enabled : labels.disabled}</span></td>
                        <td className="sq-numeric">{row.offset_minutes} {labels.minutes}</td>
                        <td>{row.reason}</td>
                        <td className="sq-caption">{notify.length ? notify.join(" · ") : "—"}</td>
                        <td className="sq-caption">{scopeSummary(row.scope, labels)}</td>
                        <td className="sq-caption">{labels.effectiveFrom} {formatInstant(row.effective_from)}{row.effective_to ? "" : ` · ${labels.ongoing}`}</td>
                        {canConfigure && (
                          <td>
                            <div className="row" style={{ gap: "var(--space-2)" }}>
                              <button type="button" className={`sq-btn ${row.enabled ? "" : "sq-btn--prominent"}`} disabled={pending}
                                onClick={() => toggle(row)}>{row.enabled ? labels.disable : labels.enable}</button>
                              <button type="button" className="sq-btn sq-btn--subtle" disabled={pending}
                                onClick={() => { setCreatingType(null); setEditingId(editingId === row.id ? null : row.id); }}>
                                {editingId === row.id ? labels.closeEdit : labels.edit}
                              </button>
                            </div>
                            {editingId === row.id && <div style={{ marginBlockStart: "var(--space-3)" }}>
                              <RuleForm row={row} ruleType={ruleType} labels={labels} onDone={() => setEditingId(null)} />
                            </div>}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table></div>
            )}
          </section>
        );
      })}

      <p className="sq-caption" style={{ margin: 0 }}>{labels.schedulerNote}</p>
    </div>
  );
}
