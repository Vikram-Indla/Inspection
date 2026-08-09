import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DefinitionList from "@/components/saqeel/definition-list/definition-list";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { groupBreakdown } from "@/features/compliance/presentation";
import type { ApprovalsView, ComponentRow } from "@/features/compliance/types";
import { fill, type Messages } from "@/i18n/messages";
import styles from "./approvals-steps.module.css";

type ApprovalsMessages = Messages["compliance"]["approvals"];

function groupValue(components: readonly ComponentRow[], messages: ApprovalsMessages): string {
  if (!components.length) return messages.summary.none;
  const breakdown = groupBreakdown(components);
  return fill(messages.summary.breakdown, {
    approved: breakdown.approved,
    rejected: breakdown.rejected,
    pending: breakdown.pending,
  });
}

export default function ApprovalsSummary({ view, messages }: {
  view: ApprovalsView;
  messages: ApprovalsMessages;
}) {
  const summary = messages.summary;
  const byKind = (kind: string) => view.selectedComponents.filter(component => component.entity_kind === kind);
  return (
    <Card as="section">
      <CardHeader title={summary.heading} />
      <CardBody>
        <DefinitionList columns="two" items={[
          { label: summary.regulation, value: groupValue(byKind("regulation"), messages) },
          { label: summary.items, value: groupValue(byKind("inspection_item"), messages) },
          { label: summary.violations, value: groupValue(byKind("violation"), messages) },
          { label: summary.penalties, value: groupValue(byKind("penalty"), messages) },
        ]} />
        <div className={styles.summaryGroup}>
          <EmptyState
            variant="inline"
            tone={view.allDecided ? "neutral" : "warning"}
            icon={view.allDecided ? "review" : "risk"}
            title={view.allDecided ? summary.gateReady : summary.gateBlocked}
            description={summary.databaseGate}
            size="sm"
          />
        </div>
      </CardBody>
    </Card>
  );
}
