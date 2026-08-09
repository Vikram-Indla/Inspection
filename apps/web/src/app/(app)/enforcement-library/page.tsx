import { Suspense } from "react";
import Shell from "@/components/Shell";
import EnforcementScreen from "@/components/sections/enforcement/library/enforcement-screen/enforcement-screen";
import EnforcementSkeleton from "@/components/sections/enforcement/library/enforcement-skeleton/enforcement-skeleton";
import { readEnforcementScope, type EnforcementScopeInput } from "@/features/enforcement/params";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function EnforcementLibraryPage({ searchParams }: {
  searchParams: Promise<EnforcementScopeInput>;
}) {
  const [params, locale] = await Promise.all([searchParams, getLocale()]);
  const { enforcement } = getMessages(locale);
  const scope = readEnforcementScope(params);

  return (
    <Shell current={scope.routeBase} title={enforcement.title}>
      <Suspense fallback={<EnforcementSkeleton label={enforcement.loading} />}>
        <EnforcementScreen locale={locale} scope={scope} nowMs={Date.now()} />
      </Suspense>
    </Shell>
  );
}
