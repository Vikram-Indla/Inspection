"use client";
// M8 / PLN-CON-018 — Discard draft button. Semantically distinct from
// cancelling a published visit: it archives a never-published draft plan
// (visit_plans.archived_at) and cancels any linked draft child visit with a
// 'discard_draft' lifecycle event. Used on the /planning drafts list and the
// bulk review workspace (resumed draft).
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { discardDraftPlan, type DiscardResult } from "./draft-actions";

export default function DiscardDraftButton({ planId, label, discardAria }: {
  planId: string;
  label: string;
  discardAria: string;
}) {
  const router = useRouter();
  const [state, act, busy] = useActionState<DiscardResult, FormData>(async (prev, fd) => {
    const res = await discardDraftPlan(prev, fd);
    if (res.ok) router.push("/planning");
    return res;
  }, {});
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }}>
      <form action={act}>
        <input type="hidden" name="plan_id" value={planId} />
        <button className="sq-btn sq-btn--subtle" aria-label={discardAria} disabled={busy}>{label}</button>
      </form>
      {state.error && <span className="sq-caption" role="alert">{state.error}</span>}
    </span>
  );
}
