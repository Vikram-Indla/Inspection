"use client";
// TASK-EXECUTION-MODULE-001 · Phase 2A — cancellation & location-override
// reason lists. Reasons carry stable keys (ids) with bilingual labels; the
// field runtime validates against these keys (request_visit_cancellation,
// request_geo_override). Existing keys keep their ids; protected keys whose
// semantics are enforced in the database ('other', 'safety_security') cannot
// be removed — the server action refuses as well.
import { useActionState, useState } from "react";
import { saveReasons } from "./actions";

export type ReasonRow = { key: string; en: string; ar: string };

export type ReasonsLabels = {
  cancellationTitle: string;
  cancellationHint: string;
  geoTitle: string;
  geoHint: string;
  colKey: string;
  colEn: string;
  colAr: string;
  colActions: string;
  add: string;
  remove: string;
  moveUp: string;
  moveDown: string;
  protectedReason: string;
  newKeyPlaceholder: string;
  save: string;
  saving: string;
  saved: string;
};

type SaveState = { ok?: boolean; error?: string };

function ReasonListEditor({
  name,
  title,
  hint,
  rows,
  onChange,
  protectedKeys,
  labels,
}: {
  name: string;
  title: string;
  hint: string;
  rows: ReasonRow[];
  onChange: (rows: ReasonRow[]) => void;
  protectedKeys: readonly string[];
  labels: ReasonsLabels;
}) {
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  const update = (index: number, field: keyof ReasonRow, value: string) => {
    const next = [...rows];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  return (
    <fieldset style={{ border: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      <legend style={{ fontWeight: 600 }}>{title}</legend>
      <p className="ax-caption" style={{ margin: 0 }}>{hint}</p>
      <input type="hidden" name={name} value={JSON.stringify(rows)} readOnly />
      <div className="ax-tablewrap">
        <table className="ax-table">
          <thead>
            <tr>
              <th scope="col">{labels.colKey}</th>
              <th scope="col">{labels.colEn}</th>
              <th scope="col">{labels.colAr}</th>
              <th scope="col">{labels.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const isProtected = protectedKeys.includes(row.key);
              return (
                <tr key={`${row.key}-${index}`}>
                  <td>
                    <input
                      className="ax-input" value={row.key} aria-label={`${labels.colKey} ${index + 1}`}
                      placeholder={labels.newKeyPlaceholder}
                      onChange={e => update(index, "key", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="ax-input" value={row.en} aria-label={`${labels.colEn} ${index + 1}`}
                      onChange={e => update(index, "en", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="ax-input" dir="rtl" value={row.ar} aria-label={`${labels.colAr} ${index + 1}`}
                      onChange={e => update(index, "ar", e.target.value)}
                    />
                  </td>
                  <td>
                    <span className="ax-row" style={{ gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap" }}>
                      <button type="button" className="ax-btn" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`${labels.moveUp} ${row.key}`}>↑</button>
                      <button type="button" className="ax-btn" onClick={() => move(index, 1)} disabled={index === rows.length - 1} aria-label={`${labels.moveDown} ${row.key}`}>↓</button>
                      {isProtected ? (
                        <span className="ax-lozenge ax-lozenge--info">{labels.protectedReason}</span>
                      ) : (
                        <button type="button" className="ax-btn" onClick={() => onChange(rows.filter((_, i) => i !== index))}>
                          {labels.remove}
                        </button>
                      )}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div>
        <button type="button" className="ax-btn" onClick={() => onChange([...rows, { key: "", en: "", ar: "" }])}>
          {labels.add}
        </button>
      </div>
    </fieldset>
  );
}

export default function ReasonsManager({
  cancellationReasons,
  geoOverrideReasons,
  labels,
}: {
  cancellationReasons: ReasonRow[];
  geoOverrideReasons: ReasonRow[];
  labels: ReasonsLabels;
}) {
  const [cancellation, setCancellation] = useState<ReasonRow[]>(cancellationReasons);
  const [geoOverride, setGeoOverride] = useState<ReasonRow[]>(geoOverrideReasons);
  const [state, formAction, pending] = useActionState<SaveState, FormData>(
    async (_prev, fd) => await saveReasons(fd),
    {},
  );

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <ReasonListEditor
        name="cancellation_reasons"
        title={labels.cancellationTitle}
        hint={labels.cancellationHint}
        rows={cancellation}
        onChange={setCancellation}
        protectedKeys={["other"]}
        labels={labels}
      />
      <ReasonListEditor
        name="geo_override_reasons"
        title={labels.geoTitle}
        hint={labels.geoHint}
        rows={geoOverride}
        onChange={setGeoOverride}
        protectedKeys={["safety_security"]}
        labels={labels}
      />
      <div className="ax-row" style={{ gap: "var(--space-3)", alignItems: "center" }}>
        <button className="ax-btn ax-btn--prominent" disabled={pending}>
          {pending ? labels.saving : labels.save}
        </button>
        {state.ok && !pending && <span className="ax-lozenge ax-lozenge--success">{labels.saved}</span>}
      </div>
      {state.error && <p className="ax-caption" role="alert" style={{ color: "var(--status-critical-text)", margin: 0 }}>{state.error}</p>}
    </form>
  );
}
