"use client";
import { useMemo, useRef, useState } from "react";
import { normalizeWorkflowPayload } from "@/lib/workflow/normalize";
import { validateWorkflowPayload } from "@/lib/workflow/validate";
import styles from "./workflow-builder.module.css";

// M2-02 Workflow Flight Deck, rebuilt against the canonical builder canvas
// (designs/admin/admin/SAQEEL Admin Workflow Builder.dc.html): lifecycle lane +
// branch strip, transition inspector, states rail and validation rail.
//
// Every value on screen comes from the governed config_versions payload and the
// pure VAL-01..06 validator — no lane order, guard, actor or state is invented.
// The lane order is derived deterministically (breadth-first distance from the
// initial state, then declaration order), so identical payloads always render an
// identical canvas. Colour is owned by design-system classes/tokens only.

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
  statesTitle: string;
  branchesTitle: string;
  transitionTitle: string;
  allowedRole: string;
  requires: string;
  trigger: string;
  notGoverned: string;
  authoredElsewhere: string;
  selectTransition: string;
};

type Props = { payload: unknown; strings: WfDeckStrings };

const Chevron = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 20, height: 20 }} aria-hidden="true">
    <path d="m9 6 6 6-6 6" />
  </svg>
);

/** Badge family for a state, derived only from its declared role in the payload. */
function stateBadge(initial?: boolean, terminal?: boolean) {
  if (terminal) return "badge-completed";
  if (initial) return "badge-draft";
  return "badge-info";
}

export function WfDeck({ payload, strings }: Props) {
  const def = useMemo(() => normalizeWorkflowPayload(payload as never), [payload]);
  const validation = useMemo(() => validateWorkflowPayload(def), [def]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const stateRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Deterministic lane order: BFS distance from the initial state, ties broken by
  // declaration order. States that are unreachable keep their declared position at
  // the end — the validator (VAL-01) is what reports them, the canvas never hides them.
  const lane = useMemo(() => {
    const order = new Map<string, number>();
    const initial = def.states.find(s => s.initial)?.key ?? def.states[0]?.key;
    if (initial) {
      const queue = [initial];
      order.set(initial, 0);
      while (queue.length) {
        const cur = queue.shift()!;
        const d = order.get(cur)!;
        for (const t of def.transitions) {
          if (t.from !== cur || order.has(t.to)) continue;
          order.set(t.to, d + 1);
          queue.push(t.to);
        }
      }
    }
    return def.states
      .map((s, i) => ({ s, i, d: order.get(s.key) ?? Number.MAX_SAFE_INTEGER }))
      .sort((a, b) => (a.d - b.d) || (a.i - b.i))
      .map(x => x.s);
  }, [def]);

  // A transition is "on the lane" when it joins two adjacent lane states; every
  // other governed transition is shown in the branch strip so nothing is dropped.
  const laneIndex = useMemo(() => new Map(lane.map((s, i) => [s.key, i])), [lane]);
  const onLane = (from: string, to: string) => (laneIndex.get(to) ?? -1) - (laneIndex.get(from) ?? -99) === 1;
  const branches = def.transitions.map((t, i) => ({ t, i })).filter(({ t }) => !onLane(t.from, t.to));

  const shown = selectedState
    ? def.transitions.map((t, i) => ({ t, i })).filter(({ t }) => t.from === selectedState)
    : def.transitions.map((t, i) => ({ t, i }));
  const inspected = selectedIdx == null ? null : def.transitions[selectedIdx] ?? null;

  function onStateKey(e: React.KeyboardEvent, idx: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = e.key === "ArrowRight" ? Math.min(idx + 1, lane.length - 1) : Math.max(idx - 1, 0);
    stateRefs.current[next]?.focus();
  }

  return (
    <div className={styles.grid}>
      <div className="stack" style={{ gap: 16 }}>
        {/* Lifecycle canvas — lane + branch strip */}
        <section aria-label={strings.graphTitle} className="panel" style={{ padding: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 14px" }}>{strings.graphTitle}</h3>
          <div className={styles.canvas}>
            <div className={styles.lane}>
              {lane.map((s, idx) => (
                <div key={s.key} style={{ display: "contents" }}>
                  <button
                    type="button"
                    ref={(el) => { stateRefs.current[idx] = el; }}
                    aria-pressed={selectedState === s.key}
                    onClick={() => setSelectedState(selectedState === s.key ? null : s.key)}
                    onKeyDown={(e) => onStateKey(e, idx)}
                    tabIndex={idx === 0 ? 0 : -1}
                    className={[
                      styles.state,
                      selectedState === s.key ? styles.stateSelected : "",
                      s.terminal ? styles.stateTerminal : "",
                    ].filter(Boolean).join(" ")}
                  >
                    <div className={styles.stateKey}>{s.key}</div>
                    <div className="t-caption">
                      {s.initial ? strings.initial : s.terminal ? strings.terminal : " "}
                    </div>
                  </button>
                  {idx < lane.length - 1 && (
                    <span className={styles.arrow} aria-hidden="true"><Chevron /></span>
                  )}
                </div>
              ))}
            </div>
            {branches.length > 0 && (
              <div className={styles.branches} aria-label={strings.branchesTitle}>
                {branches.map(({ t, i }) => (
                  <button
                    key={`${t.from}-${t.to}-${i}`}
                    type="button"
                    onClick={() => setSelectedIdx(i)}
                    className={`badge ${def.states.find(s => s.key === t.to)?.terminal ? "badge-critical" : "badge-warning"}`}
                    style={{ cursor: "pointer", border: 0, font: "inherit" }}
                  >
                    {t.from} → {t.to}{t.trigger ? ` (${t.trigger})` : ""}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Transition inspector */}
        <section aria-label={strings.inspectorTitle} className="panel" style={{ padding: "18px 20px" }}>
          <div className="row" style={{ gap: 8, marginBlockEnd: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
              {inspected ? `${strings.transitionTitle} — ${inspected.from} → ${inspected.to}` : strings.inspectorTitle}
            </h3>
            <span className="grow" />
          </div>
          {inspected ? (
            <div className="stack" style={{ gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <label className={styles.fld}>
                  <span>{strings.allowedRole}</span>
                  <select className="select" disabled defaultValue="v">
                    <option value="v">{inspected.actor || strings.notGoverned}</option>
                  </select>
                </label>
                <label className={styles.fld}>
                  <span>{strings.trigger}</span>
                  <select className="select" disabled defaultValue="v">
                    <option value="v">{inspected.trigger || strings.notGoverned}</option>
                  </select>
                </label>
              </div>
              <div>
                <div className="t-label" style={{ marginBlockEnd: 8 }}>{strings.guards}</div>
                <div className="stack" style={{ gap: 8 }}>
                  {(inspected.guards ?? []).length === 0
                    ? <p className="t-caption" style={{ margin: 0 }}>{strings.none}</p>
                    : (inspected.guards ?? []).map(g => (
                      <label key={g} className="check" style={{ margin: 0 }}>
                        <input type="checkbox" checked readOnly disabled />{g}
                      </label>
                    ))}
                </div>
              </div>
              <div>
                <div className="t-label" style={{ marginBlockEnd: 8 }}>{strings.sideEffects}</div>
                <div className="row" style={{ gap: 6 }}>
                  {(inspected.fx ?? []).length === 0
                    ? <span className="t-caption">{strings.none}</span>
                    : (inspected.fx ?? []).map((f, k) => (
                      <span key={k} className={`badge ${f.idempotencyKey ? "badge-compliant" : "badge-warning"}`}>
                        {f.kind} · {f.idempotencyKey ? strings.idempotent : strings.noIdempotencyKey}
                      </span>
                    ))}
                </div>
              </div>
              <p className="t-caption" style={{ margin: 0 }}>{strings.authoredElsewhere}</p>
            </div>
          ) : (
            <p className="t-caption" style={{ margin: 0 }}>{strings.selectTransition}</p>
          )}
          <div className="table-wrap" style={{ marginBlockStart: 14 }}>
            <table className="table">
              <thead><tr>
                <th scope="col">{strings.graphTitle}</th>
                <th scope="col">{strings.actor}</th>
                <th scope="col">{strings.guards}</th>
                <th scope="col">{strings.sideEffects}</th>
              </tr></thead>
              <tbody>
                {shown.map(({ t, i }) => (
                  <tr key={i} className={selectedIdx === i ? "is-selected" : undefined}
                    aria-selected={selectedIdx === i} onClick={() => setSelectedIdx(i)} style={{ cursor: "pointer" }}>
                    <td>{t.from} <span aria-hidden="true">→</span> {t.to} <span className="t-caption">({t.trigger})</span></td>
                    <td>{t.actor ? t.actor : <span className="badge badge-critical">✕ {strings.actor}</span>}</td>
                    <td className="t-caption">{(t.guards ?? []).join(", ") || strings.none}</td>
                    <td className="t-caption">
                      {(t.fx ?? []).length === 0 ? strings.none : (t.fx ?? []).map((f, k) => (
                        <span key={k} className={`badge ${f.idempotencyKey ? "badge-compliant" : "badge-warning"}`} style={{ marginInlineEnd: 4 }}>
                          {f.idempotencyKey ? `✓ ${f.kind} ${strings.idempotent}` : `⚠ ${f.kind} ${strings.noIdempotencyKey}`}
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="t-caption" style={{ margin: "12px 0 0" }}>{strings.selectHint}</p>
        </section>
      </div>

      {/* Right rail — states + validation */}
      <aside className={`stack ${styles.rail}`} style={{ gap: 16 }}>
        <div className="panel" style={{ padding: 18 }}>
          <div className="t-label" style={{ marginBlockEnd: 10 }}>{strings.statesTitle}</div>
          <div className="stack" style={{ gap: 6 }}>
            {def.states.map(s => (
              <div key={s.key} className="row" style={{ gap: 8 }}>
                <span className={`badge ${stateBadge(s.initial, s.terminal)}`} style={{ height: 18 }}>{s.key}</span>
                <span className="grow" />
                {s.initial && <span className="t-caption">{strings.initial}</span>}
                {s.terminal && <span className="t-caption">{strings.terminal}</span>}
              </div>
            ))}
          </div>
        </div>
        <div className={`panel ${styles.validation}`} style={{ padding: "16px 18px" }}>
          <div className="row" style={{ gap: 8, marginBlockEnd: 6 }}>
            <div className="t-label">{strings.ledgerTitle}</div>
            <span className="grow" />
            <span className={`badge ${validation.ok ? "badge-compliant" : "badge-critical"}`}>
              {validation.ok ? strings.passed : strings.failed}
            </span>
          </div>
          <div className="stack" style={{ gap: 7 }}>
            {validation.checks.map(c => (
              <div key={c.id} className="row" style={{ gap: 8, alignItems: "flex-start" }}>
                <span className={`exc ${c.ok ? "exc-compliant" : "exc-critical"}`}><span className="exc-mark" /></span>
                <span style={{ flex: 1, fontSize: 12.5 }}><span className="id-code">{c.id}</span> {c.why}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
