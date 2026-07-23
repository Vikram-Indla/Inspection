"use client";

import { useActionState, useEffect, useState } from "react";
import { generateContextualInsight, type ContextualResult, type ContextualSurface } from "@/lib/ai/contextual-actions";

type Props = { surface: ContextualSurface; title: string; description: string; context: string; evidenceRefs: string[]; targetRef?: string; itemId?: string; locale?: "en" | "ar"; generateLabel: string; unavailableLabel: string; evidenceLabel: string; advisoryLabel: string; reviewLabel?: string };

export default function ContextualAiPanel({ surface, title, description, context, evidenceRefs, targetRef, itemId, locale, generateLabel, unavailableLabel, evidenceLabel, advisoryLabel, reviewLabel }: Props) {
  const [state, action, pending] = useActionState<ContextualResult, FormData>(generateContextualInsight, {});
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update(); window.addEventListener("online", update); window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  return (
    <section className="panel" aria-labelledby={`${surface}-heading`} data-testid={`${surface}-panel`} style={{ padding: "var(--space-6)" }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h3 id={`${surface}-heading`}>{title}</h3>
          <p className="t-caption">{description}</p>
        </div>
        <span className="badge badge-info">{advisoryLabel}</span>
      </div>
      <form action={offline ? undefined : action} style={{ marginBlockStart: "var(--space-4)" }}>
        <input type="hidden" name="surface" value={surface} />
        <input type="hidden" name="context" value={context} />
        <input type="hidden" name="evidence_refs" value={evidenceRefs.join(",")} />
        {targetRef && <input type="hidden" name="target_ref" value={targetRef} />}
        {itemId && <input type="hidden" name="item_id" value={itemId} />}
        {locale && <input type="hidden" name="locale" value={locale} />}
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span className="t-caption">{evidenceLabel}: {evidenceRefs.join(" · ")}</span>
          <button className="btn btn-primary btn-touch" disabled={pending || offline}>{offline ? unavailableLabel : pending ? `${generateLabel}…` : generateLabel}</button>
        </div>
      </form>
      {state.error && <p role="alert" className="t-caption" style={{ color: "var(--status-critical)", marginBlockStart: "var(--space-3)" }}>{state.error.includes("unavailable") ? unavailableLabel : state.error}</p>}
      {state.ok && state.text && <div className="sq-banner sq-banner--immutable" role="status" style={{ marginBlockStart: "var(--space-4)", whiteSpace: "pre-wrap" }}><strong>{advisoryLabel}</strong><div>{state.text}</div><div className="t-caption" style={{ marginBlockStart: "var(--space-2)" }}>{evidenceLabel}: {evidenceRefs.join(" · ")}</div>{state.insightId && reviewLabel && <a className="sq-link" href={`/ai/suggestions#ai-suggestion-${state.insightId}`}>{reviewLabel} →</a>}</div>}
    </section>
  );
}
