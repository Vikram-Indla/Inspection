import Shell from "@/components/Shell";
import VisitDetailSkeleton from "@/components/visits/visit-detail-skeleton/visit-detail-skeleton";
import { useT } from "@/lib/i18n";

export default async function Loading() {
  const { t } = await useT();
  return (
    <Shell current="/visits" title={t("visit.detail.loadingTitle", "Visit")}>
      <VisitDetailSkeleton label={t("visit.detail.loading", "Loading visit")} />
    </Shell>
  );
}
