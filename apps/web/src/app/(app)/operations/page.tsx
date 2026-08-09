import Shell, { preloadShell } from "@/components/Shell";
import { loadOperationsPage } from "@/features/operations/queries";
import { readOperationsScope } from "@/features/operations/scope";
import AccessNotice from "./sections/access-notice";
import OperationsOverview from "./sections/operations-overview";

export default async function Operations({ searchParams }: {
  searchParams: Promise<{ region?: string; city?: string; view?: string; timelineVisit?: string }>;
}) {
  preloadShell("/operations");
  const scope = readOperationsScope(await searchParams);
  const page = await loadOperationsPage(scope);
  if (page.kind === "denied") return <AccessNotice />;
  return (
    <Shell current="/operations" title="">
      <OperationsOverview data={page.data} scope={scope} />
    </Shell>
  );
}
