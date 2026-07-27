"use client";
// M9 / PLN-CON-012 — planning lookups editor. Kind tabs, per-row inline edit
// (labels EN/AR, sort order, guided metadata flags + raw-JSON escape hatch),
// activate/deactivate (never delete), add-new form. Every change gets its own
// honest ok/error — never a blanket success. Read-only when canConfigure is
// false (the page explains why; the server actions re-check).
import { useState, useTransition } from "react";
import { saveLookup, setLookupActive, type LookupResult } from "./actions";
import { KNOWN_METADATA_FLAGS } from "./constants";

export type LookupRow = {
  id: string; kind: string; key: string; label_en: string; label_ar: string | null;
  is_active: boolean; sort_order: number; metadata: Record<string, unknown>;
};

export type LookupsLabels = {
  addTitle: string; kind: string; key: string; labelEn: string; labelAr: string;
  sortOrder: string; flagsTitle: string; rawJson: string; rawJsonHint: string;
  save: string; add: string; edit: string; closeEdit: string;
  deactivate: string; activate: string; working: string;
  colKey: string; colLabels: string; colFlags: string; colStatus: string; colActions: string;
  active: string; inactive: string; readOnlyWhy: string; deleteNote: string;
};

function flagSummary(metadata: Record<string, unknown>): string {
  const flags = Object.entries(metadata).filter(([, v]) => v !== false && v != null).map(([k, v]) => v === true ? k : `${k}=${JSON.stringify(v)}`);
  return flags.length ? flags.join(" · ") : "—";
}

function LookupForm({ row, kinds, labels, onDone }: {
  row?: LookupRow; kinds: string[]; labels: LookupsLabels; onDone: () => void;
}) {
  const [feedback, setFeedback] = useState<LookupResult>({});
  const [pending, startTransition] = useTransition();
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (row) fd.set("lookup_id", row.id);
    if (row) fd.set("kind", row.kind);
    if (row) fd.set("key", row.key);
    setFeedback({});
    startTransition(async () => {
      const res = await saveLookup(fd);
      setFeedback(res);
      if (res.ok) onDone();
    });
  };
  return (
    <form onSubmit={submit} className="panel" style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      <div className="row" style={{ gap: "var(--space-3)", flexWrap: "wrap", alignItems: "flex-end" }}>
        {!row && (
          <div className="field"><label className="sq-field__label" htmlFor="lk-kind">{labels.kind}</label>
            <select className="select" id="lk-kind" name="kind" required>
              {kinds.map(k => <option key={k} value={k}>{k}</option>)}
            </select></div>
        )}
        {!row && (
          <div className="field"><label className="sq-field__label" htmlFor="lk-key">{labels.key}</label>
            <input className="input" id="lk-key" name="key" required pattern="[a-z0-9_]+" placeholder="snake_case" /></div>
        )}
        {row && <div className="field"><span className="sq-field__label">{labels.kind} / {labels.key}</span>
          <strong>{row.kind}.{row.key}</strong></div>}
        <div className="field" style={{ minInlineSize: 200 }}><label className="sq-field__label" htmlFor={row ? `lk-en-${row.id}` : "lk-en"}>{labels.labelEn}</label>
          <input className="input" id={row ? `lk-en-${row.id}` : "lk-en"} name="label_en" required defaultValue={row?.label_en ?? ""} /></div>
        <div className="field" style={{ minInlineSize: 200 }}><label className="sq-field__label" htmlFor={row ? `lk-ar-${row.id}` : "lk-ar"}>{labels.labelAr}</label>
          <input className="input" id={row ? `lk-ar-${row.id}` : "lk-ar"} name="label_ar" dir="auto" defaultValue={row?.label_ar ?? ""} /></div>
        <div className="field" style={{ maxInlineSize: 110 }}><label className="sq-field__label" htmlFor={row ? `lk-sort-${row.id}` : "lk-sort"}>{labels.sortOrder}</label>
          <input className="input numeric" id={row ? `lk-sort-${row.id}` : "lk-sort"} name="sort_order" type="number" defaultValue={row?.sort_order ?? 0} /></div>
      </div>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="sq-field__label">{labels.flagsTitle}</legend>
        <div className="row" style={{ gap: "var(--space-4)", flexWrap: "wrap" }}>
          {KNOWN_METADATA_FLAGS.map(flag => (
            <label key={flag} className="t-caption" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              <input type="checkbox" name={`flag_${flag}`} value="1" defaultChecked={row?.metadata?.[flag] === true} /> {flag}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="field"><label className="sq-field__label" htmlFor={row ? `lk-json-${row.id}` : "lk-json"}>{labels.rawJson}</label>
        <input className="input numeric" id={row ? `lk-json-${row.id}` : "lk-json"} name="metadata_json" placeholder='{"custom_flag": true}' />
        <span className="t-caption">{labels.rawJsonHint}</span></div>
      <div className="row" style={{ gap: "var(--space-3)", alignItems: "center" }}>
        <button className="sq-btn sq-btn--prominent" disabled={pending}>{pending ? labels.working : row ? labels.save : labels.add}</button>
        {row && <button type="button" className="btn btn-primary" onClick={onDone}>{labels.closeEdit}</button>}
        {feedback.ok && !pending && <span className="sq-lozenge sq-lozenge--success" role="status">{feedback.ok}</span>}
        {feedback.error && <span role="alert" className="t-caption" style={{ color: "var(--status-critical-text)" }}>{feedback.error}</span>}
      </div>
    </form>
  );
}

export default function LookupsAdmin({ rows, kinds, canConfigure, labels }: {
  rows: LookupRow[]; kinds: string[]; canConfigure: boolean; labels: LookupsLabels;
}) {
  const [kind, setKind] = useState<string>(kinds[0] ?? "");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toggleFeedback, setToggleFeedback] = useState<LookupResult>({});
  const [pending, startTransition] = useTransition();
  const visible = rows.filter(r => r.kind === kind);

  const toggle = (r: LookupRow) => {
    const fd = new FormData();
    fd.set("lookup_id", r.id);
    fd.set("active", r.is_active ? "0" : "1");
    setToggleFeedback({});
    startTransition(async () => setToggleFeedback(await setLookupActive(fd)));
  };

  return (
    <section className="panel" style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      {!canConfigure && <div className="sq-banner sq-banner--warning" role="status"><div>{labels.readOnlyWhy}</div></div>}
      <div className="sq-kpi-row" role="group" aria-label="lookup kinds">
        {kinds.map(k => (
          <button key={k} type="button" className={`sq-btn ${k === kind ? "sq-btn--prominent" : "sq-btn--subtle"}`}
            aria-current={k === kind ? "page" : undefined} onClick={() => { setKind(k); setEditingId(null); }}>{k}</button>
        ))}
      </div>

      {canConfigure && editingId === null && (
        <LookupForm kinds={[kind, ...kinds.filter(k => k !== kind)]} labels={labels} onDone={() => {}} />
      )}

      {toggleFeedback.ok && <div className="sq-banner sq-banner--success" role="status"><div>{toggleFeedback.ok}</div></div>}
      {toggleFeedback.error && <div className="sq-banner sq-banner--critical" role="alert"><div>{toggleFeedback.error}</div></div>}

      <div className="sq-tablewrap"><table className="sq-table">
        <thead><tr>
          <th scope="col">{labels.colKey}</th><th scope="col">{labels.colLabels}</th>
          <th scope="col">{labels.colFlags}</th><th scope="col">{labels.colStatus}</th>
          {canConfigure && <th scope="col">{labels.colActions}</th>}
        </tr></thead>
        <tbody>
          {visible.map(r => (
            <tr key={r.id}>
              <td><strong>{r.key}</strong><br /><span className="t-caption sq-numeric">#{r.sort_order}</span></td>
              <td>{r.label_en}{r.label_ar ? <><br /><span className="t-caption" dir="auto">{r.label_ar}</span></> : null}</td>
              <td className="t-caption">{flagSummary(r.metadata)}</td>
              <td><span className={`sq-lozenge ${r.is_active ? "sq-lozenge--success" : "sq-lozenge--critical"}`}>{r.is_active ? labels.active : labels.inactive}</span></td>
              {canConfigure && (
                <td>
                  <div className="row" style={{ gap: "var(--space-2)" }}>
                    <button type="button" className="sq-btn sq-btn--subtle" disabled={pending}
                      onClick={() => setEditingId(editingId === r.id ? null : r.id)}>{labels.edit}</button>
                    <button type="button" className={`sq-btn ${r.is_active ? "" : "sq-btn--prominent"}`} disabled={pending}
                      onClick={() => toggle(r)}>{r.is_active ? labels.deactivate : labels.activate}</button>
                  </div>
                  {editingId === r.id && <div style={{ marginBlockStart: "var(--space-3)" }}>
                    <LookupForm row={r} kinds={kinds} labels={labels} onDone={() => setEditingId(null)} />
                  </div>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table></div>
      <p className="t-caption" style={{ margin: 0 }}>{labels.deleteNote}</p>
    </section>
  );
}
