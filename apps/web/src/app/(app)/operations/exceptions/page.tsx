import Shell from "@/components/Shell";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import OperationsBoard from "@/components/operations/operations-board/operations-board";
import { loadExceptionBoard } from "@/features/operations/exceptions/queries";
import { buildExceptionGroups } from "@/features/operations/exceptions/view";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function ExceptionBoard() {
  const locale = await getLocale();
  const { board } = getMessages(locale).operations;
  const page = await loadExceptionBoard();
  if (page.kind === "disabled") {
    return (
      <Shell current="/operations" title={board.title}>
        <EmptyState icon="restricted" tone="warning" title={board.off.title} description={board.off.body} />
      </Shell>
    );
  }
  const groups = buildExceptionGroups(page.sources, locale);
  return (
    <Shell current="/operations" title={board.title}>
      <OperationsBoard
        groups={groups}
        degraded={page.degraded}
        strings={{
          heading: board.heading,
          degraded: board.degraded,
          emptyTitle: board.empty.title,
          emptyBody: page.degraded ? board.empty.degraded : board.empty.body,
        }}
      />
    </Shell>
  );
}
