"use client";
import { useActionState } from "react";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Icon from "@/components/saqeel/icon/icon";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { generateContextualInsight, type ContextualResult } from "@/lib/ai/contextual-actions";
import styles from "./factory-ai-advisory.module.css";

const EMPTY: ContextualResult = {};
const EVIDENCE_REFS = "M07-014,M07-015,SCR-WEB-300";

export type FactoryAiAdvisoryStrings = {
  readonly title: string;
  readonly advisory: string;
  readonly evidence: string;
  readonly idle: string;
  readonly generate: string;
  readonly generating: string;
  readonly confidenceUnavailable: string;
  readonly predictedRisk: string;
  readonly predictedUnavailable: string;
};

export default function FactoryAiAdvisory({ factoryId, locale, strings }: {
  factoryId: string;
  locale: "ar" | "en";
  strings: FactoryAiAdvisoryStrings;
}) {
  const [result, action, pending] = useActionState<ContextualResult, FormData>(generateContextualInsight, EMPTY);

  return (
    <Card as="section" accent="ai" labelledBy="factory-ai-title">
      <CardHeader
        level="h2"
        titleId="factory-ai-title"
        title={<span className={styles.heading}><Icon name="ai" size="sm" />{strings.title}</span>}
      />
      <CardBody gap="tight">
        <StatusPill tone="info">{strings.advisory}</StatusPill>

        {result.text ? <p className={styles.text} dir="auto">{result.text}</p> : null}
        {result.error ? <p className={styles.error} role="alert">{result.error}</p> : null}
        {!result.text && !result.error ? <p className={styles.muted}>{strings.idle}</p> : null}

        <p className={styles.muted}>{strings.evidence}</p>
        <p className={styles.muted}>{strings.confidenceUnavailable}</p>

        <form action={action}>
          <input type="hidden" name="surface" value="factory_risk_explanation" />
          <input type="hidden" name="target_ref" value={factoryId} />
          <input type="hidden" name="context" value={JSON.stringify({ scope: "factory-risk" })} />
          <input type="hidden" name="evidence_refs" value={EVIDENCE_REFS} />
          <input type="hidden" name="locale" value={locale} />
          <Button type="submit" variant="tertiary" disabled={pending}>
            {pending ? strings.generating : strings.generate}
          </Button>
        </form>

        <p className={styles.predicted}>
          <span className={styles.predictedTerm}>{strings.predictedRisk}</span>
          <span className={styles.muted}>{strings.predictedUnavailable}</span>
        </p>
      </CardBody>
    </Card>
  );
}
