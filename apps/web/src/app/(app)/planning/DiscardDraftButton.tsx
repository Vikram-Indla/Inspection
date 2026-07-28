"use client";
// M8 / PLN-CON-018 — Discard draft button. Semantically distinct from
// cancelling a published visit: the governed RPC irreversibly archives a
// never-published plan aggregate while preserving each child's Planning state
// and provenance. Used on the draft list and resumed bulk-review workspace.
import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { discardDraftPlan, type DiscardResult } from "./draft-actions";

export default function DiscardDraftButton({ planId, expectedVersion, label, discardAria }: {
  planId: string;
  expectedVersion: number;
  label: string;
  discardAria: string;
}) {
  const router = useRouter();
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [correlationId] = useState(() => crypto.randomUUID());
  const [state, act] = useActionState<DiscardResult, FormData>(async (prev, fd) => {
    const res = await discardDraftPlan(prev, fd);
    if (res.ok) router.push("/planning");
    return res;
  }, {});
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }}>
      <form action={act}>
        <input type="hidden" name="plan_id" value={planId} />
        <input type="hidden" name="expected_version" value={expectedVersion} />
        <input type="hidden" name="idempotency_key" value={idempotencyKey} />
        <input type="hidden" name="correlation_id" value={correlationId} />
        <button className="sq-btn sq-btn--subtle" aria-label={discardAria}
          aria-describedby={`discard-result-${planId}`}>{label}</button>
      </form>
      {state.error && <span id={`discard-result-${planId}`} className="sq-caption" role="alert">{state.error}</span>}
      {state.ok && <span id={`discard-result-${planId}`} className="badge badge-draft" role="status">{state.ok}</span>}
    </span>
  );
}
