import { Suspense } from "react";
import Shell from "@/components/Shell";
import RegulationWorkspace from "@/components/sections/regulations/regulation-workspace/regulation-workspace";
import RegulationsScreen from "@/components/sections/regulations/regulations-screen/regulations-screen";
import RegulationsSkeleton from "@/components/sections/regulations/regulations-skeleton/regulations-skeleton";
import { readRegulationScope, type RegulationScopeInput } from "@/features/regulations/params";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function ComplianceLibraryPage({ searchParams }: {
  searchParams: Promise<RegulationScopeInput>;
}) {
  const [params, locale] = await Promise.all([searchParams, getLocale()]);
  const { regulations } = getMessages(locale);
  const scope = readRegulationScope(params);

  return (
    <Shell current={scope.routeBase} title={regulations.title}>
      <Suspense fallback={<RegulationsSkeleton label={regulations.loading} />}>
        <RegulationsScreen locale={locale} scope={scope} />
        {scope.selectedId ? <RegulationWorkspace selectedId={scope.selectedId} /> : null}
      </Suspense>
    </Shell>
  );
}
