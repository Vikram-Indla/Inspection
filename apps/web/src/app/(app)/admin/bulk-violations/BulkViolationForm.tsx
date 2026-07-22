"use client";
import { useActionState, useEffect, useState } from "react";
import { issueBulkViolation, type BulkResult } from "./actions";

export type BulkViolationStrings = {
  searchFactoryLabel: string; searchFactoryPlaceholder: string; selectedCount: string;
  violationLabel: string; violationPlaceholder: string;
  notesLabel: string; notesPlaceholder: string;
  previewTitle: string; previewBody: string;
  acknowledgeLabel: string; submit: string; submitting: string;
  resultsTitle: string; resultSuccess: string; resultFailed: string;
  partialWarning: string; allSucceeded: string;
};

type Factory = { id: string; name: string; factory_code: string | null; cr_number: string | null; region: string | null; city: string | null };
type ViolationOption = { code: string; title: string; level: string; penalty_ref: string | null };

const fmt = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k) => String(vars[k] ?? m));

export default function BulkViolationForm({ factories, violations, strings }: { factories: Factory[]; violations: ViolationOption[]; strings: BulkViolationStrings }) {
  const [state, formAction, pending] = useActionState<BulkResult, FormData>(issueBulkViolation, {});
  const [requestId, setRequestId] = useState("");
  useEffect(() => { setRequestId(crypto.randomUUID()); }, []);

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [violationCode, setViolationCode] = useState("");
  const [notes, setNotes] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);

  const ql = query.trim().toLowerCase();
  const shown = ql.length >= 2
    ? factories.filter(f => f.name.toLowerCase().includes(ql) || (f.cr_number ?? "").toLowerCase().includes(ql) || (f.factory_code ?? "").toLowerCase().includes(ql))
    : factories.slice(0, 50);

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const chosenViolation = violations.find(v => v.code === violationCode) ?? null;
  const canSubmit = selected.size > 0 && !!chosenViolation && acknowledged && !pending;

  const results = state.results ?? [];
  const successCount = results.filter(r => r.status === "success").length;
  const failedCount = results.filter(r => r.status === "failed").length;

  return (
    <form action={formAction} className="stack" style={{ gap: "var(--space-6)" }}>
      <input type="hidden" name="request_id" value={requestId} />

      <section className="panel stack" style={{ padding: "var(--space-6)" }}>
        <label className="sq-field" style={{ maxInlineSize: "none" }}>
          <span className="sq-field__label">{strings.searchFactoryLabel}</span>
          <input className="sq-input" value={query} onChange={e => setQuery(e.target.value)} placeholder={strings.searchFactoryPlaceholder} />
        </label>
        <p className="t-caption numeric">{fmt(strings.selectedCount, { n: selected.size })}</p>
        <div className="stack" style={{ gap: "var(--space-1)", maxBlockSize: 320, overflow: "auto" }}>
          {shown.map(f => (
            <label key={f.id} className="sq-choice" style={{ display: "flex", alignItems: "center" }}>
              <input type="checkbox" name="factory_id" value={f.id} checked={selected.has(f.id)} onChange={() => toggle(f.id)} />
              <span>{f.name} <span className="t-caption">{f.factory_code ?? f.cr_number ?? "—"} · {f.city ?? "—"}{f.region ? `, ${f.region}` : ""}</span></span>
            </label>
          ))}
        </div>
      </section>

      <section className="panel stack" style={{ padding: "var(--space-6)" }}>
        <label className="sq-field" style={{ maxInlineSize: "none" }}>
          <span className="sq-field__label">{strings.violationLabel}</span>
          <select className="sq-select" name="violation_code" value={violationCode} onChange={e => setViolationCode(e.target.value)}>
            <option value="">{strings.violationPlaceholder}</option>
            {violations.map(v => <option key={v.code} value={v.code}>{v.code} · {v.title} ({v.level})</option>)}
          </select>
        </label>
        <label className="sq-field" style={{ maxInlineSize: "none" }}>
          <span className="sq-field__label">{strings.notesLabel}</span>
          <textarea className="sq-textarea" name="notes" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder={strings.notesPlaceholder} />
        </label>
      </section>

      {selected.size > 0 && chosenViolation && (
        <section className="panel stack" style={{ padding: "var(--space-6)" }}>
          <h4>{strings.previewTitle}</h4>
          <p>{fmt(strings.previewBody, { n: selected.size, level: chosenViolation.level, code: chosenViolation.code, penalty: chosenViolation.penalty_ref ?? "—" })}</p>
          <label className="sq-choice" style={{ display: "flex" }}>
            <input type="checkbox" name="acknowledged" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} />
            <span>{strings.acknowledgeLabel}</span>
          </label>
        </section>
      )}

      {state.error && <div className="sq-banner sq-banner--critical" role="alert"><div>{state.error}</div></div>}

      {results.length > 0 && (
        <section className="panel stack" style={{ padding: "var(--space-6)" }}>
          <h4>{strings.resultsTitle}</h4>
          {failedCount > 0
            ? <div className="sq-banner sq-banner--warning" role="alert"><div>{strings.partialWarning}</div></div>
            : <div className="sq-banner sq-banner--success"><div>{fmt(strings.allSucceeded, { n: successCount })}</div></div>}
          <div className="sq-tablewrap"><table className="sq-table"><tbody>
            {results.map(r => (
              <tr key={r.factory_id}>
                <td className="t-caption numeric">{r.factory_id}</td>
                <td><span className={`sq-lozenge ${r.status === "success" ? "sq-lozenge--success" : "sq-lozenge--critical"}`}>{r.status === "success" ? strings.resultSuccess : strings.resultFailed}</span></td>
                {r.error_code && <td className="t-caption">{r.error_code}</td>}
              </tr>
            ))}
          </tbody></table></div>
        </section>
      )}

      <button type="submit" className="btn btn-primary btn-field" aria-disabled={!canSubmit} disabled={!canSubmit}>
        {pending ? strings.submitting : strings.submit}
      </button>
    </form>
  );
}
