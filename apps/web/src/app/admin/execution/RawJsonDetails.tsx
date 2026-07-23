// TASK-EXECUTION-MODULE-001 · Phase 2A — collapsible raw engine row view.
// Advanced/read-only: the governed forms above are the supported editing
// path; this view exists so an administrator can inspect the exact stored
// jsonb when auditing a change. Server-rendered (no interactivity beyond the
// native <details> disclosure).
export default function RawJsonDetails({ engine, json }: { engine: string; json: unknown }) {
  return (
    <details className="sq-surface" style={{ padding: "var(--space-6)" }}>
      <summary>
        <b>{engine}</b> — Raw JSON (advanced)
      </summary>
      <pre style={{ overflow: "auto", fontSize: 12, marginBlockEnd: 0 }}>
        {JSON.stringify(json, null, 2)}
      </pre>
    </details>
  );
}
