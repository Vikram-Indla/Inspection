"use client";
import { useMemo, useRef, useState } from "react";
import { normalizeWorkflowPayload } from "@/lib/workflow/normalize";
import { validateWorkflowPayload } from "@/lib/workflow/validate";

// M2-02 Workflow Flight Deck — graph + outline, transition inspector, and the
// live validation ledger (VAL-01..06). Design-dependent (approved R2 package).
// Colour is owned entirely by ax-* classes; no bare colours. The graph is a
// keyboard-accessible ordered stepper that wraps at narrow widths (never a
// clipped canvas); status uses glyph + text, never colour alone.

export type WfDeckStrings = {
  ledgerTitle: string;
  graphTitle: string;
  inspectorTitle: string;
  passed: string;
  failed: string;
  initial: string;
  terminal: string;
  actor: string;
  guards: string;
  sideEffects: string;
  idempotent: string;
  noIdempotencyKey: string;
  selectHint: string;
  none: string;
};

type Props = { payload: unknown; strings: WfDeckStrings };

export function WfDeck({ payload, strings }: Props) {
  const def = useMemo(() => normalizeWorkflowPayload(payload as never), [payload]);
  const validation = useMemo(() => validateWorkflowPayload(def), [def]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const stateRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const shown = selectedState
    ? def.transitions.map((t, i) => ({ t, i })).filter(({ t }) => t.from === selectedState)
    : def.transitions.map((t, i) => ({ t, i }));

  function onStateKey(e: React.KeyboardEvent, idx: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = e.key === "ArrowRight" ? Math.min(idx + 1, def.states.length - 1) : Math.max(idx - 1, 0);
    stateRefs.current[next]?.focus();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ax-space-250)" }}>
      {/* Validation ledger — the graph check that previously did not exist */}
      <section aria-label={strings.ledgerTitle} className="ax-surface" style={{ padding: "var(--ax-space-250)", display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
        <div className="ax-row" style={{ justifyContent: "space-between" }}>
          <h4 style={{ margin: 0 }}>{strings.ledgerTitle}</h4>
          <span className={`ax-lozenge ${validation.ok ? "ax-lozenge--success" : "ax-lozenge--critical"}`}>
            {validation.ok ? `✓ ${strings.passed}` : `⛔ ${strings.failed}`}
          </span>
        </div>
        <ul style={{ margin: 0, paddingInlineStart: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-100)" }}>
          {validation.checks.map((c) => (
            <li key={c.id} className="ax-caption">
              <span className={`ax-lozenge ${c.ok ? "ax-lozenge--success" : "ax-lozenge--critical"}`}>
                {c.ok ? "✓" : "✕"} {c.id}
              </span>{" "}
              {c.why}
            </li>
          ))}
        </ul>
      </section>

      {/* Graph + outline — keyboard-accessible ordered stepper (wraps, never clipped) */}
      <section aria-label={strings.graphTitle} className="ax-surface" style={{ padding: "var(--ax-space-250)", display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
        <h4 style={{ margin: 0 }}>{strings.graphTitle}</h4>
        <ol role="list" style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexWrap: "wrap", gap: "var(--ax-space-150)", alignItems: "center" }}>
          {def.states.map((s, idx) => (
            <li key={s.key} style={{ display: "flex", alignItems: "center", gap: "var(--ax-space-100)" }}>
              <button
                type="button"
                ref={(el) => { stateRefs.current[idx] = el; }}
                aria-pressed={selectedState === s.key}
                onClick={() => setSelectedState(selectedState === s.key ? null : s.key)}
                onKeyDown={(e) => onStateKey(e, idx)}
                tabIndex={idx === 0 ? 0 : -1}
                className={`ax-lozenge ${selectedState === s.key ? "ax-lozenge--info" : ""}`}
                style={{ cursor: "pointer" }}
              >
                {s.initial ? "▶ " : ""}{s.key}{s.terminal ? " ⛔" : ""}
              </button>
              {idx < def.states.length - 1 && <span aria-hidden="true">→</span>}
            </li>
          ))}
        </ol>
        <p className="ax-caption">
          {def.states.filter((s) => s.initial).map((s) => `▶ ${s.key} ${strings.initial}`).join(" · ")}
          {" · "}
          {def.states.filter((s) => s.terminal).map((s) => `⛔ ${s.key} ${strings.terminal}`).join(" · ")}
        </p>
      </section>

      {/* Transition inspector */}
      <section aria-label={strings.inspectorTitle} className="ax-surface" style={{ padding: "var(--ax-space-250)", display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
        <h4 style={{ margin: 0 }}>{strings.inspectorTitle}</h4>
        <p className="ax-caption">{strings.selectHint}</p>
        <div className="ax-tablewrap"><table className="ax-table">
          <thead><tr>
            <th scope="col">{strings.graphTitle}</th><th scope="col">{strings.actor}</th><th scope="col">{strings.guards}</th><th scope="col">{strings.sideEffects}</th>
          </tr></thead>
          <tbody>
            {shown.map(({ t, i }) => (
              <tr key={i} aria-selected={selectedIdx === i} onClick={() => setSelectedIdx(i)} style={{ cursor: "pointer" }}>
                <td>{t.from} <span aria-hidden="true">→</span> {t.to} <span className="ax-caption">({t.trigger})</span></td>
                <td>{t.actor ? t.actor : <span className="ax-lozenge ax-lozenge--critical">✕ {strings.actor}</span>}</td>
                <td className="ax-caption">{(t.guards ?? []).join(", ") || strings.none}</td>
                <td className="ax-caption">
                  {(t.fx ?? []).length === 0 ? strings.none : (t.fx ?? []).map((f, k) => (
                    <span key={k} className={`ax-lozenge ${f.idempotencyKey ? "ax-lozenge--success" : "ax-lozenge--warning"}`} style={{ marginInlineEnd: 4 }}>
                      {f.idempotencyKey ? `✓ ${f.kind} ${strings.idempotent}` : `⚠ ${f.kind} ${strings.noIdempotencyKey}`}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </section>
    </div>
  );
}
