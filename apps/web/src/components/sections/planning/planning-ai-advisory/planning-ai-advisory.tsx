"use client";
import { useActionState } from "react";
import Button from "@/components/saqeel/button/button";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { generateContextualInsight, type ContextualResult } from "@/lib/ai/contextual-actions";
import styles from "./planning-ai-advisory.module.css";

const EMPTY: ContextualResult = {};
const EVIDENCE_REFS = "PLN-REQ-005,PLN-REQ-012,PLN-REQ-013,SCR-WEB-100";

export type PlanningAiAdvisoryStrings = {
  readonly generate: string;
  readonly generating: string;
  readonly advisory: string;
  readonly evidence: string;
  readonly idle: string;
  readonly confidenceUnavailable: string;
};

export default function PlanningAiAdvisory({ locale, strings }: {
  locale: "ar" | "en";
  strings: PlanningAiAdvisoryStrings;
}) {
  const [result, action, pending] = useActionState<ContextualResult, FormData>(generateContextualInsight, EMPTY);

  return (
    <div className={styles.root}>
      <div className={styles.head}>
        <StatusPill tone="info">{strings.advisory}</StatusPill>
        <span className={styles.evidence}>{strings.evidence}</span>
      </div>

      {result.text ? <p className={styles.text}>{result.text}</p> : null}
      {result.error ? <p className={styles.error} role="alert">{result.error}</p> : null}
      {!result.text && !result.error ? <p className={styles.idle}>{strings.idle}</p> : null}

      <p className={styles.confidence}>{strings.confidenceUnavailable}</p>

      <form action={action}>
        <input type="hidden" name="surface" value="planning_summary" />
        <input type="hidden" name="context" value={JSON.stringify({ scope: "planning-visit-list" })} />
        <input type="hidden" name="evidence_refs" value={EVIDENCE_REFS} />
        <input type="hidden" name="locale" value={locale} />
        <Button type="submit" variant="link" disabled={pending}>
          {pending ? strings.generating : strings.generate}
        </Button>
      </form>
    </div>
  );
}
