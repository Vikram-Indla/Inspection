import { type ReactNode } from "react";
import Button from "@/components/saqeel/button/button";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import type { ExecutionMessages } from "@/features/execution/strings";
import { fill } from "@/i18n/messages";

export default function ExecutionEmptyState({ filtered, total, strings, clearAction }: {
  filtered: boolean;
  total: string;
  strings: ExecutionMessages["empty"];
  clearAction?: ReactNode;
}) {
  if (!filtered) {
    return (
      <EmptyState
        icon="calendar"
        title={strings.scopeTitle}
        description={strings.scopeBody}
        action={
          <Button variant="secondary" size="sm" href="/planning" label={strings.scopeAction}>
            {strings.scopeAction}
          </Button>
        }
      />
    );
  }

  return (
    <EmptyState
      icon="search"
      title={strings.filteredTitle}
      description={fill(strings.filteredBody, { total })}
      action={clearAction}
    />
  );
}
