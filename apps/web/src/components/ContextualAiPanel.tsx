/* @retiring 2026-08-10 · replaced-by components/sections/ai/ai-advisory/ai-advisory · pending /factories/[id],/factories/cr/[id],/field/factory-360/[id],/field/inspection/[id],/field/[visitId],visit-ai-summary · delete-when 0-imports */
"use client";

import { useActionState, useEffect, useState } from "react";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { generateContextualInsight, type ContextualResult, type ContextualSurface } from "@/lib/ai/contextual-actions";

type Props = {
  surface: ContextualSurface;
  title: string;
  description: string;
  context: string;
  evidenceRefs: string[];
  targetRef?: string;
  itemId?: string;
  locale?: "en" | "ar";
  generateLabel: string;
  unavailableLabel: string;
  evidenceLabel: string;
  advisoryLabel: string;
  reviewLabel?: string;
  providerState?: "configured" | "unavailable";
};

export default function ContextualAiPanel({ surface, title, description, context, evidenceRefs, targetRef, itemId, locale, generateLabel, unavailableLabel, evidenceLabel, advisoryLabel, reviewLabel, providerState }: Props) {
  const [state, action, pending] = useActionState<ContextualResult, FormData>(generateContextualInsight, {});
  const [offline, setOffline] = useState(false);
  const providerUnavailable = providerState === "unavailable";
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update(); window.addEventListener("online", update); window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  return (
    <section className="panel" aria-labelledby={`${surface}-heading`} data-testid={`${surface}-panel`}>
      <div className="panel-header row">
        <div className="grow">
          <h3 id={`${surface}-heading`}>{title}</h3>
          <p className="t-caption">{description}</p>
        </div>
        <StatusPill tone="info">{advisoryLabel}</StatusPill>
      </div>
      <div className="panel-body stack">
        <p className="t-caption">{evidenceLabel}</p>
        <form action={offline || providerUnavailable ? undefined : action} className="stack">
          <input type="hidden" name="surface" value={surface} />
          <input type="hidden" name="context" value={context} />
          <input type="hidden" name="evidence_refs" value={evidenceRefs.join(",")} />
          {targetRef && <input type="hidden" name="target_ref" value={targetRef} />}
          {itemId && <input type="hidden" name="item_id" value={itemId} />}
          {locale && <input type="hidden" name="locale" value={locale} />}
          <button
            className={`btn btn-primary btn-touch btn-block${pending ? " is-loading" : ""}`}
            type="submit"
            disabled={pending || offline || providerUnavailable}
            aria-describedby={`${surface}-action-status`}
          >
            {pending ? `${generateLabel}…` : generateLabel}
          </button>
          <div id={`${surface}-action-status`} aria-live="polite">
            {offline || providerUnavailable
              ? <div className="alert alert-warning" role="status">{unavailableLabel}</div>
              : pending
                ? <p className="t-caption" role="status">{generateLabel}…</p>
                : null}
            {state.error
              ? <div className="alert alert-critical" role="alert">{state.error.includes("unavailable") ? unavailableLabel : state.error}</div>
              : null}
          </div>
        </form>
        {state.ok && state.text
          ? <div className="sq-banner sq-banner--immutable" role="status"><strong>{advisoryLabel}</strong><div>{state.text}</div><div className="t-caption">{evidenceLabel}</div>{state.insightId && reviewLabel && <a className="sq-link" href={`/ai/suggestions#ai-suggestion-${state.insightId}`}>{reviewLabel}</a>}</div>
          : null}
      </div>
    </section>
  );
}
