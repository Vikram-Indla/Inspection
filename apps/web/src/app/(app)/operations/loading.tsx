import Shell from "@/components/Shell";
import OperationsSkeleton from "@/components/operations/operations-skeleton/operations-skeleton";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

// SCR-WEB-500 — loading state. Replaces the hand-written `.panel.skeleton`
// blocks, which described a layout the page no longer has.
export default async function OperationsLoading() {
  const locale = await getLocale();
  const { operations } = getMessages(locale);
  return (
    <Shell current="/operations" title={operations.title}>
      <OperationsSkeleton label={operations.loading.detail} />
    </Shell>
  );
}
