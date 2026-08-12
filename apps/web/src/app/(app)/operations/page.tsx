import Shell, { preloadShell } from "@/components/Shell";
import { useT } from "@/lib/i18n";
import { loadOperationsPage } from "@/features/operations/queries";
import { readOperationsScope } from "@/features/operations/scope";
import AccessNotice from "./sections/access-notice";
import OperationsOverview from "./sections/operations-overview";

export default async function Operations({ searchParams }: {
  searchParams: Promise<{ region?: string; city?: string; view?: string; timelineVisit?: string }>;
}) {
  preloadShell("/operations");
  const { t } = await useT();
  const scope = readOperationsScope(await searchParams);
  const page = await loadOperationsPage(scope);
  if (page.kind === "denied") {
    return (
      <AccessNotice
        current="/operations"
        title={t("ops.title", "Operations Center")}
        heading={t("ops.unauthorized.title", "Operations access required")}
        body={t("ops.unauthorized.body", "This page is not turned on for your account, so no data has loaded.")}
        returnLabel={t("ops.unauthorized.return", "Return to my area")}
      />
    );
  }
  return (
    <Shell current="/operations" title="">
      <OperationsOverview data={page.data} scope={scope} />
    </Shell>
  );
}
