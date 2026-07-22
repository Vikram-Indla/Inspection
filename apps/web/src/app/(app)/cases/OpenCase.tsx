"use client";
import { useActionState } from "react";
import { openCase, type CaseResult } from "./actions";

export function OpenCase({ factoryId, strings: s }: { factoryId: string | null; strings: { type: string; open: string; opening: string; opened: string; noFactory: string } }) {
  const [state, action, pending] = useActionState<CaseResult, FormData>(openCase, {});
  if (!factoryId) return <p className="t-caption">{s.noFactory}</p>;
  return (
    <form action={action} className="panel" style={{ padding: "var(--space-6)", display: "flex", gap: "var(--space-3)", alignItems: "flex-end", flexWrap: "wrap" }}>
      <input type="hidden" name="factory_id" value={factoryId} />
      <div className="ax-field"><label className="ax-field__label" htmlFor="open-case-type">{s.type}</label>
        <select className="ax-input" name="case_type" id="open-case-type"><option value="correction">correction</option><option value="reinspection">reinspection</option><option value="appeal">appeal</option></select></div>
      <button className="btn btn-primary btn-touch" disabled={pending}>{pending ? s.opening : s.open}</button>
      {state.error && <span className="t-caption" style={{ color: "var(--status-critical)" }} role="alert">{state.error}</span>}
      {state.ok && <span className="badge badge-compliant">{s.opened}</span>}
    </form>
  );
}
