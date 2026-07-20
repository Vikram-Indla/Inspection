"use client";
import { useActionState } from "react";
import { openCase, type CaseResult } from "./actions";

export function OpenCase({ factoryId, strings: s }: { factoryId: string | null; strings: { type: string; open: string; opening: string; opened: string; noFactory: string } }) {
  const [state, action, pending] = useActionState<CaseResult, FormData>(openCase, {});
  if (!factoryId) return <p className="t-caption">{s.noFactory}</p>;
  return (
    <form action={action} className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", gap: "var(--ax-space-150)", alignItems: "flex-end", flexWrap: "wrap" }}>
      <input type="hidden" name="factory_id" value={factoryId} />
      <div className="ax-field"><label className="ax-field__label" htmlFor="open-case-type">{s.type}</label>
        <select className="ax-input" name="case_type" id="open-case-type"><option value="correction">correction</option><option value="reinspection">reinspection</option><option value="appeal">appeal</option></select></div>
      <button className="ax-btn" disabled={pending}>{pending ? s.opening : s.open}</button>
      {state.error && <span className="t-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">{state.error}</span>}
      {state.ok && <span className="ax-lozenge ax-lozenge--success">{s.opened}</span>}
    </form>
  );
}
