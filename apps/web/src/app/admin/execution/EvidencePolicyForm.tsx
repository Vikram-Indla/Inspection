"use client";
// TASK-EXECUTION-MODULE-001 · Phase 2A — evidence policy editor.
// Values are business-seeded (0001_foundation.sql). A type absent from the
// governed row is shown as not configured (absent = not permitted) and is
// never invented by this form. The sha256-at-sync integrity rule is a
// governed invariant displayed read-only on the page, not editable here.
import { useActionState } from "react";
import { saveEvidencePolicy } from "./actions";

export type EvidenceTypeRule = {
  name: string;
  present: boolean;
  formats: string[];
  maxMb: number | null;
  maxMinutes: number | null; // null = no duration bound configured for this type
};

export type EvidenceLabels = {
  colType: string;
  colFormats: string;
  colMaxSize: string;
  colMaxDuration: string;
  notConfigured: string;
  notConfiguredHint: string;
  formatsHint: string;
  retentionLabel: string;
  retentionHint: string;
  save: string;
  saving: string;
  saved: string;
};

type SaveState = { ok?: boolean; error?: string };

export default function EvidencePolicyForm({
  types,
  retentionYears,
  labels,
}: {
  types: EvidenceTypeRule[];
  retentionYears: number | null;
  labels: EvidenceLabels;
}) {
  const [state, formAction, pending] = useActionState<SaveState, FormData>(
    async (_prev, fd) => await saveEvidencePolicy(fd),
    {},
  );

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div className="ax-tablewrap">
        <table className="ax-table">
          <thead>
            <tr>
              <th scope="col">{labels.colType}</th>
              <th scope="col">{labels.colFormats}</th>
              <th scope="col">{labels.colMaxSize}</th>
              <th scope="col">{labels.colMaxDuration}</th>
            </tr>
          </thead>
          <tbody>
            {types.map(rule => (
              <tr key={rule.name}>
                <td><b>{rule.name}</b></td>
                {rule.present ? (
                  <>
                    <td>
                      <input
                        className="ax-input" name={`${rule.name}_formats`} defaultValue={rule.formats.join(", ")}
                        aria-label={`${rule.name} ${labels.colFormats}`}
                      />
                      <p className="ax-caption" style={{ margin: 0 }}>{labels.formatsHint}</p>
                    </td>
                    <td>
                      <input
                        className="ax-input ax-numeric" name={`${rule.name}_max_mb`} type="number" min={1} required
                        defaultValue={rule.maxMb ?? ""} style={{ maxInlineSize: 110 }}
                        aria-label={`${rule.name} ${labels.colMaxSize}`}
                      />
                    </td>
                    <td>
                      {rule.maxMinutes != null ? (
                        <input
                          className="ax-input ax-numeric" name={`${rule.name}_max_minutes`} type="number" min={1} required
                          defaultValue={rule.maxMinutes} style={{ maxInlineSize: 110 }}
                          aria-label={`${rule.name} ${labels.colMaxDuration}`}
                        />
                      ) : (
                        <span className="ax-caption">{labels.notConfigured}</span>
                      )}
                    </td>
                  </>
                ) : (
                  <td colSpan={3}>
                    <span className="ax-lozenge ax-lozenge--warning">{labels.notConfigured}</span>{" "}
                    <span className="ax-caption">{labels.notConfiguredHint}</span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {retentionYears != null && (
        <div className="ax-field" style={{ maxInlineSize: 260 }}>
          <label className="ax-field__label" htmlFor="retention_years">{labels.retentionLabel}</label>
          <input
            className="ax-input ax-numeric" id="retention_years" name="retention_years"
            type="number" min={1} step={1} required defaultValue={retentionYears}
          />
          <p className="ax-caption" style={{ margin: 0 }}>{labels.retentionHint}</p>
        </div>
      )}

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
