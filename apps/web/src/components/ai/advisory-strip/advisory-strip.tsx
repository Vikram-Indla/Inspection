"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import Button from "@/components/saqeel/button/button";
import Icon from "@/components/saqeel/icon/icon";
import { Heading, Text } from "@/components/saqeel/type";
import styles from "./advisory-strip.module.css";

const STREAM_ROUTE = "/api/ai/advisory-stream";

export type AdvisoryStripStrings = {
  readonly title: string;
  readonly generate: string;
  readonly generating: string;
  readonly unavailable?: string;
};

export default function AdvisoryStrip({ headingId, strings, surfaceFields }: {
  headingId: string;
  strings: AdvisoryStripStrings;
  surfaceFields: ReactNode;
}) {
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [errored, setErrored] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const body = new FormData(event.currentTarget);
    setPending(true);
    setErrored(false);
    setText("");
    try {
      const response = await fetch(STREAM_ROUTE, { method: "POST", body });
      if (!response.ok || !response.body) throw new Error("stream_unavailable");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const token = decoder.decode(value, { stream: true });
        setText(previous => previous + token);
      }
    } catch {
      setErrored(true);
    } finally {
      setPending(false);
    }
  }

  const showBody = Boolean(text) || (errored && Boolean(strings.unavailable));

  return (
    <section className={styles.root} aria-labelledby={headingId}>
      <span className={styles.headline}>
        <Icon name="ai" size="sm" />
        <Heading level={2} tone="accent" id={headingId}>{strings.title}</Heading>
      </span>

      {showBody ? (
        <span className={styles.body}>
          {errored && strings.unavailable
            ? <Text tone="danger" as="p" live="alert" dir="auto">{strings.unavailable}</Text>
            : <Text tone="secondary" as="p" live="status" dir="auto">{text}</Text>}
        </span>
      ) : null}

      <form onSubmit={onSubmit} className={styles.action}>
        {surfaceFields}
        <Button type="submit" variant="link" busy={pending} label={pending ? strings.generating : strings.generate}>
          {strings.generate}
        </Button>
      </form>
    </section>
  );
}
