import type { ReactNode } from "react";
import Icon from "@/components/saqeel/icon/icon";
import { Text } from "@/components/saqeel/type";
import styles from "./packages-disclosure.module.css";

export default function PackagesDisclosure({ summary, hint, tone = "neutral", children }: {
  summary: string;
  hint?: string;
  tone?: "neutral" | "danger";
  children: ReactNode;
}) {
  return (
    <details className={styles.disclosure} data-tone={tone}>
      <summary className={styles.summary}>
        <Icon name="disclosure" size="sm" />
        <Text as="span" role="bodyStrong" tone={tone === "danger" ? "danger" : "accent"}>{summary}</Text>
      </summary>
      <div className={styles.body}>
        {hint ? <Text role="label" tone="muted">{hint}</Text> : null}
        {children}
      </div>
    </details>
  );
}
