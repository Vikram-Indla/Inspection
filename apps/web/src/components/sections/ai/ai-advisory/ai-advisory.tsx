"use client";

import { useActionState, useEffect, useState } from "react";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Icon from "@/components/saqeel/icon/icon";
import { Mono, Text } from "@/components/saqeel/type";
import {
  generateContextualInsight,
  type ContextualResult,
  type ContextualSurface,
} from "@/lib/ai/contextual-actions";
import styles from "./ai-advisory.module.css";

const EMPTY: ContextualResult = {};

export type AiAdvisoryStrings = {
  readonly title: string;
  readonly description: string;
  readonly evidence: string;
  readonly generate: string;
  readonly generating: string;
  readonly unavailable: string;
  readonly review?: string;
};

export default function AiAdvisory({
  surface, context, evidenceRefs, targetRef, itemId, locale, providerState, strings,
}: {
  surface: ContextualSurface;
  context: string;
  evidenceRefs: readonly string[];
  targetRef?: string;
  itemId?: string;
  locale?: "ar" | "en";
  providerState?: "configured" | "unavailable";
  strings: AiAdvisoryStrings;
}) {
  const [result, action, pending] = useActionState<ContextualResult, FormData>(generateContextualInsight, EMPTY);
  const [offline, setOffline] = useState(false);
  const headingId = `${surface}-heading`;
  const statusId = `${surface}-status`;
  const blocked = offline || providerState === "unavailable";

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <Card as="section" accent="ai" labelledBy={headingId}>
      <CardHeader
        level="h2"
        titleId={headingId}
        title={<span className={styles.heading}><Icon name="ai" size="sm" />{strings.title}</span>}
        description={strings.description}
      />
      <CardBody gap="tight">
        {result.text ? (
          <div className={styles.text}>
            <Text dir="auto" tone="secondary">{result.text}</Text>
          </div>
        ) : null}

        <div id={statusId} aria-live="polite">
          {blocked ? <Text tone="danger" live="status">{strings.unavailable}</Text> : null}
          {result.error ? (
            <Text tone="danger" live="alert">
              {result.error.includes("unavailable") ? strings.unavailable : result.error}
            </Text>
          ) : null}
        </div>

        <div className={styles.evidence}>
          <Text as="span" tone="muted">{strings.evidence}</Text>
          {evidenceRefs.map(reference => <Mono key={reference}>{reference}</Mono>)}
        </div>

        <form action={blocked ? undefined : action}>
          <input type="hidden" name="surface" value={surface} />
          <input type="hidden" name="context" value={context} />
          <input type="hidden" name="evidence_refs" value={evidenceRefs.join(",")} />
          {targetRef ? <input type="hidden" name="target_ref" value={targetRef} /> : null}
          {itemId ? <input type="hidden" name="item_id" value={itemId} /> : null}
          {locale ? <input type="hidden" name="locale" value={locale} /> : null}
          <Button
            type="submit"
            variant="ai"
            size="sm"
            icon="ai"
            busy={pending}
            disabled={blocked}
            controls={statusId}
            label={pending ? strings.generating : strings.generate}
          >
            {strings.generate}
          </Button>
        </form>

        {result.ok && result.insightId && strings.review ? (
          <Button variant="link" size="sm" href={`/ai/suggestions#ai-suggestion-${result.insightId}`} label={strings.review}>
            {strings.review}
          </Button>
        ) : null}
      </CardBody>
    </Card>
  );
}
