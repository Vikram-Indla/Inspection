import Button from "@/components/saqeel/button/button";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import type { ExecutionMessages } from "@/features/execution/strings";
import styles from "./execution-access-state.module.css";

export type ExecutionAccessKind = "denied" | "unavailable" | "unverified";

export default function ExecutionAccessState({ kind, denied, error }: {
  kind: ExecutionAccessKind;
  denied: ExecutionMessages["denied"];
  error: ExecutionMessages["error"];
}) {
  if (kind === "denied") {
    return (
      <EmptyState
        icon="restricted"
        tone="warning"
        title={denied.title}
        description={denied.body}
        action={
          <span className={styles.actions}>
            <Button variant="primary" size="sm" href="/profile" label={denied.request}>
              {denied.request}
            </Button>
            <Button variant="secondary" size="sm" href="/dashboard" label={denied.back}>
              {denied.back}
            </Button>
          </span>
        }
      />
    );
  }

  return (
    <EmptyState
      icon="risk"
      tone="danger"
      title={error.title}
      description={kind === "unverified" ? error.unverified : error.body}
      action={
        <Button variant="secondary" size="sm" href="/dashboard" label={error.back}>
          {error.back}
        </Button>
      }
    />
  );
}
