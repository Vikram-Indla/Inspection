"use client";
import { useMemo, useRef, useState } from "react";
import { normalizeWorkflowPayload } from "@/lib/workflow/normalize";
import { validateWorkflowPayload } from "@/lib/workflow/validate";

// M2-02 Workflow Flight Deck — graph + outline, transition inspector, and the
// live validation ledger (VAL-01..06). Design-dependent (approved R2 package).
// Colour is owned entirely by sq-* classes; no bare colours. The graph is a
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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      {/* Validation ledger — the graph check that previously did not exist */}
      <section aria-label={strings.ledgerTitle} className="panel" style={{ padding: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h4 style={{ margin: 0 }}>{strings.ledgerTitle}</h4>
          <span className={`sq-lozenge ${validation.ok ? "sq-lozenge--success" : "sq-lozenge--critical"}`}>
            {validation.ok ? `✓ ${strings.passed}` : strings.failed}
          </span>
        </div>
        <ul style={{ margin: 0, paddingInlineStart: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {validation.checks.map((c) => (
            <li key={c.id} className="t-caption">
              <span className={`sq-lozenge ${c.ok ? "sq-lozenge--success" : "sq-lozenge--critical"}`}>
                {c.ok ? "✓" : "✕"} {c.id}
              </span>{" "}
              {c.why}
            </li>
          ))}
        </ul>
      </section>

      {/* Graph + outline — visual state canvas matching the design authority. */}
      <section aria-label={strings.graphTitle} className="panel" style={{ padding: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <h4 style={{ margin: 0 }}>{strings.graphTitle}</h4>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            minWidth: "max-content",
            overflowX: "auto",
            padding: "var(--space-3)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            background: "var(--surface-canvas)",
          }}
        >
          {def.states.map((s, idx) => {
            const isTerminal = !!s.terminal;
            const isInitial = !!s.initial;
            const isSelected = selectedState === s.key;
            return (
              <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 0, flex: "none" }}>
                <button
                  type="button"
                  ref={(el) => { stateRefs.current[idx] = el; }}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedState(isSelected ? null : s.key)}
                  onKeyDown={(e) => onStateKey(e, idx)}
                  tabIndex={idx === 0 ? 0 : -1}
                  style={{
                    flex: "none",
                    width: 132,
                    padding: "12px 10px",
                    borderRadius: 10,
                    textAlign: "center",
                    border: `1.5px solid ${isTerminal ? "var(--status-compliant)" : isSelected ? "var(--action-primary)" : "var(--border-subtle)"}`,
                    background: isSelected ? "var(--accent-soft)" : "var(--surface-primary)",
                    boxShadow: "var(--shadow-card)",
                    cursor: "pointer",
                    font: "inherit",
                    color: "var(--text-primary)",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                    {isInitial ? "▶ " : ""}{s.key}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {isTerminal ? strings.terminal : isInitial ? strings.initial : ""}
                  </div>
                </button>
                {idx < def.states.length - 1 && (
                  <span
                    style={{
                      flex: "none",
                      width: 44,
                      display: "grid",
                      placeItems: "center",
                      color: "var(--text-disabled)",
                    }}
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: 20, height: 20 }}>
                      <path d="m9 6 6 6-6 6" />
                    </svg>
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <p className="t-caption">
          {def.states.filter((s) => s.initial).map((s) => `▶ ${s.key} ${strings.initial}`).join(" · ")}
          {" · "}
          {def.states.filter((s) => s.terminal).map((s) => `${s.key} ${strings.terminal}`).join(" · ")}
        </p>
      </section>

      {/* Transition inspector */}
      <section aria-label={strings.inspectorTitle} className="panel" style={{ padding: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <h4 style={{ margin: 0 }}>{strings.inspectorTitle}</h4>
        <p className="t-caption">{strings.selectHint}</p>
        <div className="sq-tablewrap"><table className="sq-table">
          <thead><tr>
            <th scope="col">{strings.graphTitle}</th><th scope="col">{strings.actor}</th><th scope="col">{strings.guards}</th><th scope="col">{strings.sideEffects}</th>
          </tr></thead>
          <tbody>
            {shown.map(({ t, i }) => (
              <tr key={i} aria-selected={selectedIdx === i} onClick={() => setSelectedIdx(i)} style={{ cursor: "pointer" }}>
                <td>{t.from} <span aria-hidden="true">→</span> {t.to} <span className="t-caption">({t.trigger})</span></td>
                <td>{t.actor ? t.actor : <span className="badge badge-critical">✕ {strings.actor}</span>}</td>
                <td className="t-caption">{(t.guards ?? []).join(", ") || strings.none}</td>
                <td className="t-caption">
                  {(t.fx ?? []).length === 0 ? strings.none : (t.fx ?? []).map((f, k) => (
                    <span key={k} className={`sq-lozenge ${f.idempotencyKey ? "sq-lozenge--success" : "sq-lozenge--warning"}`} style={{ marginInlineEnd: 4 }}>
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
