import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { immediateMessages } from "@/features/planning-immediate/strings";
import { getLocale } from "@/lib/i18n";

export default async function ImmediateAccessState() {
  const { unauthorized } = immediateMessages(await getLocale());

  return (
    <EmptyState
      icon="restricted"
      tone="warning"
      title={unauthorized.title}
      description={unauthorized.body}
    />
  );
}
