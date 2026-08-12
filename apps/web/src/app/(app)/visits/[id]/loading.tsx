import Shell from "@/components/Shell";
import VisitDetailSkeleton from "@/components/visits/visit-detail-skeleton/visit-detail-skeleton";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function Loading() {
  const V = getMessages(await getLocale()).visits;
  return (
    <Shell current="/visits" title={V.detail.loadingTitle}>
      <VisitDetailSkeleton label={V.detail.loading} />
    </Shell>
  );
}
