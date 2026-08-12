"use client";

import { type ReactNode } from "react";
import { useActionState } from "react";
import Button from "@/components/saqeel/button/button";
import Icon from "@/components/saqeel/icon/icon";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { generateContextualInsight, type ContextualResult } from "@/lib/ai/contextual-actions";
import { Heading, Text } from "@/components/saqeel/type";
import styles from "./advisory-strip.module.css";

const EMPTY: ContextualResult = {};

export type AdvisoryStripStrings = {
  readonly title: string;
  readonly advisory: string;
  readonly idle: string;
  readonly generate: string;
  readonly generating: string;
  readonly unavailable?: string;
};

function errorText(error: string, unavailable?: string): string {
  return unavailable !== undefined && error.includes("unavailable") ? unavailable : error;
}

export default function AdvisoryStrip({ headingId, strings, notesShownWithAdvisory, surfaceFields }: {
  headingId: string;
  strings: AdvisoryStripStrings;
  notesShownWithAdvisory: readonly string[];
  surfaceFields: ReactNode;
}) {
  const [result, action, pending] = useActionState<ContextualResult, FormData>(generateContextualInsight, EMPTY);

  return (
    <section className={styles.root} aria-labelledby={headingId}>
      <span className={styles.headline}>
        <Icon name="ai" size="sm" />
        <Heading level={2} tone="accent" id={headingId}>{strings.title}</Heading>
      </span>

      <StatusPill tone="info">{strings.advisory}</StatusPill>

      <span className={styles.body}>
        {result.error
          ? <Text tone="danger" as="p" live="alert" dir="auto">{errorText(result.error, strings.unavailable)}</Text>
          : <Text tone={result.text ? "secondary" : "muted"} as="p" dir="auto">{result.text ?? strings.idle}</Text>}
      </span>

      <form action={action} className={styles.action}>
        {surfaceFields}
        <Button type="submit" variant="link" busy={pending} label={pending ? strings.generating : strings.generate}>
          {strings.generate}
        </Button>
      </form>

      {result.text ? (
        <div className={styles.notes}>
          {notesShownWithAdvisory.map(note => <Text tone="muted" key={note}>{note}</Text>)}
        </div>
      ) : null}
    </section>
  );
}
