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

function Node({ node }: { node: TraceNode }) {
  return (
    <div className="ax-trace__node">
      <dt className="ax-overline">{node.label ?? ""}</dt>
      <dd>
        {node.unavailable
          ? <span className="ax-lozenge ax-lozenge--warning">○ {node.value}</span>
          : node.value}
        <span className="ax-caption ax-trace__source">{node.source}</span>
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
    <section className="ax-surface ax-trace" aria-labelledby="finding-trace-heading">
      <h4 id="finding-trace-heading">{strings.heading}</h4>
      <p className="ax-caption">{strings.hint}</p>
      {traces.length === 0 ? (
        <div className="ax-banner" role="status"><div>{strings.empty}</div></div>
      ) : (
        <ol className="ax-trace__list">
          {traces.map(trace => (
            <li key={trace.key} className="ax-trace__item">
              <details open>
                <summary className="ax-trace__summary">
                  <span className="ax-numeric">{trace.key}</span>
                  <span>{trace.question.value}</span>
                </summary>
                <dl className="ax-trace__nodes">
                  <Node node={{ ...trace.question, label: strings.question }} />
                  <Node node={{ ...trace.response, label: strings.response }} />
                  <Node node={{ ...trace.evidence, label: strings.evidence, value: trace.evidence.unavailable ? strings.unavailable : trace.evidence.value }} />
                  <Node node={{ ...trace.clause, label: strings.clause }} />
                  <Node node={{ ...trace.violation, label: strings.violation }} />
                  <Node node={{ ...trace.action, label: strings.action }} />
                  <Node node={{ ...trace.decision, label: strings.decision }} />
                </dl>
              </details>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
