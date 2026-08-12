import Shell from "@/components/Shell";
import { getLocale } from "@/lib/i18n";
import { getMessages } from "@/i18n/messages";
import { loadLiveOperations } from "@/features/operations/live/queries";
import { buildLiveOpsProps } from "@/features/operations/live/view";
import AccessNotice from "../sections/access-notice";
import OperationsLive from "@/components/operations/operations-live/operations-live";

export default async function LiveOperations({ searchParams }: {
  searchParams: Promise<{ wallboard?: string }>;
}) {
  const locale = await getLocale();
  const { live } = getMessages(locale).operations;
  const page = await loadLiveOperations();
  if (page.kind === "denied") {
    return (
      <AccessNotice
        current="/operations/live"
        title={live.title}
        heading={live.unauthorized.title}
        body={live.unauthorized.body}
        returnLabel={live.unauthorized.return}
      />
    );
  }
  const wallboard = (await searchParams).wallboard === "1";
  return (
    <Shell current="/operations/live" title={live.title}>
      <OperationsLive {...buildLiveOpsProps(page.data, wallboard)} />
    </Shell>
  );
}
