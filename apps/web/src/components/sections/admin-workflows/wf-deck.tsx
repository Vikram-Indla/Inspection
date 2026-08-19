"use client";

import { type KeyboardEvent, useMemo, useRef, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Icon from "@/components/saqeel/icon/icon";
import { Text } from "@/components/saqeel/type";
import { normalizeWorkflowPayload } from "@/lib/workflow/normalize";
import { validateWorkflowPayload, type WfPayload, type WfState } from "@/lib/workflow/validate";
import type { AdminWorkflowsMessages } from "@/features/admin-workflows/strings";
import type { Locale } from "@/lib/i18n";
import WfInspector, { type ShownTransition } from "./wf-inspector";
import WfRail from "./wf-rail";
import styles from "./workflows.module.css";

function buildLane(def: WfPayload): WfState[] {
  const byKey = new Map(def.states.map(state => [state.key, state]));
  const start = def.states.find(state => state.initial)?.key ?? def.states[0]?.key ?? null;

  const walk = (current: string | null, visited: ReadonlySet<string>): WfState[] => {
    if (current === null || visited.has(current)) return [];
    const node = byKey.get(current);
    if (!node) return [];
    const seen = new Set(visited).add(current);
    const outgoing = def.transitions.filter(t => t.from === current && !seen.has(t.to) && byKey.has(t.to));
    const next = outgoing.find(t => byKey.get(t.to)?.terminal !== true) ?? outgoing[0];
    return [node, ...walk(next ? next.to : null, seen)];
  };

  const spine = walk(start, new Set());
  const onSpine = new Set(spine.map(state => state.key));
  return [...spine, ...def.states.filter(state => !onSpine.has(state.key))];
}

export default function WfDeck({ payload, strings, locale }: {
  payload: unknown;
  strings: AdminWorkflowsMessages;
  locale: Locale;
}) {
  const def = useMemo(() => normalizeWorkflowPayload(payload as never), [payload]);
  const validation = useMemo(() => validateWorkflowPayload(def), [def]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const stateRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const d = strings.deck;

  const lane = useMemo(() => buildLane(def), [def]);
  const laneIndex = useMemo(() => new Map(lane.map((s, i) => [s.key, i])), [lane]);
  const isSuccessor = (from: string, to: string) => (laneIndex.get(to) ?? -1) === (laneIndex.get(from) ?? -99) + 1;
  const connectsAfter = (idx: number) => def.transitions.some(t => t.from === lane[idx]?.key && t.to === lane[idx + 1]?.key);
  const branches = def.transitions.map((t, i) => ({ t, i })).filter(({ t }) => !isSuccessor(t.from, t.to));
  const shown: ShownTransition[] = (selectedState
    ? def.transitions.map((t, i) => ({ t, i })).filter(({ t }) => t.from === selectedState)
    : def.transitions.map((t, i) => ({ t, i })));
  const inspected = selectedIdx == null ? null : def.transitions[selectedIdx] ?? null;

  function onStateKey(event: KeyboardEvent, idx: number) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = event.key === "ArrowRight" ? Math.min(idx + 1, lane.length - 1) : Math.max(idx - 1, 0);
    stateRefs.current[next]?.focus();
  }

  return (
    <div className={styles.deckGrid}>
      <div className={styles.deckMain}>
        <Card as="section">
          <CardHeader level="h3" title={d.graph} />
          <CardBody>
            <div className={styles.canvas}>
              <div className={styles.lane}>
                {lane.map((s, idx) => (
                  <div key={s.key} className={styles.laneItem}>
                    <button
                      type="button"
                      ref={el => { stateRefs.current[idx] = el; }}
                      aria-pressed={selectedState === s.key}
                      onClick={() => setSelectedState(selectedState === s.key ? null : s.key)}
                      onKeyDown={e => onStateKey(e, idx)}
                      tabIndex={idx === 0 ? 0 : -1}
                      className={`${styles.state} ${selectedState === s.key ? styles.stateSelected : ""}`}
                    >
                      <Text as="span" role="mono">{s.key}</Text>
                      <Text as="span" role="label" tone={s.initial ? "accent" : s.terminal ? "success" : "muted"}>{s.initial ? d.initial : s.terminal ? d.terminal : " "}</Text>
                    </button>
                    {connectsAfter(idx) ? (
                      <span className={styles.arrow}><Icon name="nextPage" size="sm" mirrored={locale === "ar"} /></span>
                    ) : null}
                  </div>
                ))}
              </div>
              {branches.length > 0 ? (
                <div className={styles.branches} aria-label={d.branches}>
                  {branches.map(({ t, i }) => (
                    <button key={`${t.from}-${t.to}-${i}`} type="button" className={styles.chip} onClick={() => setSelectedIdx(i)}>
                      <Text as="span" role="mono" dir="ltr">{`${t.from} → ${t.to}${t.trigger ? ` (${t.trigger})` : ""}`}</Text>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </CardBody>
        </Card>

        <WfInspector shown={shown} selectedIdx={selectedIdx} onSelect={setSelectedIdx} inspected={inspected} strings={strings} />
      </div>

      <WfRail states={def.states} validation={validation} strings={strings} />
    </div>
  );
}
