import Shell from "@/components/Shell";
import OperationsLiveSkeleton from "@/components/operations/operations-live-skeleton/operations-live-skeleton";
import { getLocale } from "@/lib/i18n";
import { getMessages } from "@/i18n/messages";

export default async function Loading() {
  const { live } = getMessages(await getLocale()).operations;
  return (
    <Shell current="/operations/live" title={live.title}>
      <OperationsLiveSkeleton label={live.loading.label} disclosure={live.loading.detail} />
    </Shell>
  );
}
