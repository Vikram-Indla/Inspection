"use client";
import { useActionState } from "react";
import Button from "@/components/saqeel/button/button";
import Icon from "@/components/saqeel/icon/icon";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { generateContextualInsight, type ContextualResult } from "@/lib/ai/contextual-actions";
import type { Locale } from "@/lib/i18n";
import styles from "./executive-brief.module.css";
import { Heading, Text } from "@/components/saqeel/type";

const EMPTY: ContextualResult = {};
const EVIDENCE_REFS = "MVP2-REQ-0056,MVP2-REQ-0057,SCR-WEB-010";
const HEADING_ID = "dashboard-executive-brief";

export type ExecutiveBriefStrings = {
  readonly title: string;
  readonly advisory: string;
  readonly evidence: string;
  readonly idle: string;
  readonly generate: string;
  readonly generating: string;
  readonly noCause: string;
};

export default function ExecutiveBrief({ locale, context, period, region, strings }: {
  locale: Locale;
  context: string;
  period: { readonly from: string; readonly to: string };
  region: string;
  strings: ExecutiveBriefStrings;
}) {
  const [result, action, pending] = useActionState<ContextualResult, FormData>(generateContextualInsight, EMPTY);

  return (
    <section className={styles.root} aria-labelledby={HEADING_ID}>
      <span className={styles.headline}>
        <Icon name="ai" size="sm" />
        <Heading level={2} tone="accent" id={HEADING_ID}>{strings.title}</Heading>
      </span>

      <StatusPill tone="info">{strings.advisory}</StatusPill>

      {result.text || result.error ? null : <Text tone="muted">{strings.idle}</Text>}
      {result.error ? <Text tone="danger" as="p">{result.error}</Text> : null}

      <form action={action} className={styles.action}>
        <input type="hidden" name="surface" value="executive_brief" />
        <input type="hidden" name="context" value={context} />
        <input type="hidden" name="period_from" value={period.from} />
        <input type="hidden" name="period_to" value={period.to} />
        <input type="hidden" name="region" value={region} />
        <input type="hidden" name="evidence_refs" value={EVIDENCE_REFS} />
        <input type="hidden" name="locale" value={locale} />
        <Button
          type="submit"
          variant="link"
          busy={pending}
          label={pending ? strings.generating : strings.generate}
        >
          {strings.generate}
        </Button>
      </form>

      {result.text ? (
        <div className={styles.brief}>
          <Text tone="secondary" as="p">{result.text}</Text>
          <Text tone="muted">{strings.evidence}</Text>
          <Text tone="muted">{strings.noCause}</Text>
        </div>
      ) : null}
    </section>
  );
}
