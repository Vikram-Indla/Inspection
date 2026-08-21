import { Overline, Text } from "@/components/saqeel/type";
import type { ReactNode } from "react";

export type TraceNode = {
  label?: string;
  value: ReactNode;
  source: string;
  unavailable?: boolean;
};

export type FindingTrace = {
  key: string;
  question: TraceNode;
  response: TraceNode;
  evidence: TraceNode;
  clause: TraceNode;
  violation: TraceNode;
  action: TraceNode;
  decision: TraceNode;
};

// An absent link is one state, so it reads the same on every row. Only the
// evidence node used to be swapped for the canonical word, which left the
// chain showing "Unavailable" on one row and "Clause link unavailable" on the
// next for the identical condition. The <dt> already names which link is gone.
function Node({ node, unavailableLabel }: { node: TraceNode; unavailableLabel: string }) {
  return (
    <div className="sq-trace__node">
      <Overline as="dt">{node.label ?? ""}</Overline>
      <dd>
        {node.unavailable
          ? <span className="badge badge-warning">○ {unavailableLabel}</span>
          : node.value}
        <span className="sq-trace__source"><Text as="span" tone="muted">{node.source}</Text></span>
      </dd>
    </div>
  );
}

/**
 * M06-020..027 — list-equivalent, keyboard-native Finding Trace Chain.
 * Native details/summary gives keyboard disclosure without a decorative graph.
 * Every node carries its source/version label and unavailable links stay explicit.
 */
export default function FindingTraceChain({ traces, strings }: {
  traces: FindingTrace[];
  strings: { heading: string; hint: string; empty: string; question: string; response: string; evidence: string; clause: string; violation: string; action: string; decision: string; unavailable: string };
}) {
  return (
    <section className="panel sq-trace" aria-labelledby="finding-trace-heading">
      <div className="panel-body">
        <h2 id="finding-trace-heading">{strings.heading}</h2>
        {/* The hint explains how to read the seven-link chain. With no chain on
            screen it explained nothing and left the empty state as a caption, a
            long spec sentence and a bare banner stacked in a full-height panel. */}
        {traces.length > 0 && <Text tone="muted">{strings.hint}</Text>}
        {traces.length === 0 ? (
          <div className="sq-banner" role="status"><div>{strings.empty}</div></div>
        ) : (
          <ol className="sq-trace__list">
            {traces.map(trace => (
              <li key={trace.key} className="sq-trace__item">
                <details open>
                  <summary className="sq-trace__summary">
                    <span className="numeric">{trace.key}</span>
                    <span>{trace.question.value}</span>
                  </summary>
                  <dl className="sq-trace__nodes">
                    <Node unavailableLabel={strings.unavailable} node={{ ...trace.question, label: strings.question }} />
                    <Node unavailableLabel={strings.unavailable} node={{ ...trace.response, label: strings.response }} />
                    <Node unavailableLabel={strings.unavailable} node={{ ...trace.evidence, label: strings.evidence }} />
                    <Node unavailableLabel={strings.unavailable} node={{ ...trace.clause, label: strings.clause }} />
                    <Node unavailableLabel={strings.unavailable} node={{ ...trace.violation, label: strings.violation }} />
                    <Node unavailableLabel={strings.unavailable} node={{ ...trace.action, label: strings.action }} />
                    <Node unavailableLabel={strings.unavailable} node={{ ...trace.decision, label: strings.decision }} />
                  </dl>
                </details>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
