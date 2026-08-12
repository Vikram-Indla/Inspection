import OperationsBoardSkeleton from "@/components/operations/operations-board/operations-board-skeleton";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function Loading() {
  const { board } = getMessages(await getLocale()).operations;
  return <OperationsBoardSkeleton label={board.loading.label} />;
}
