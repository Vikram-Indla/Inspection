import { Suspense } from "react";
import Shell from "@/components/Shell";
import EnforcementSections from "@/components/enforcement/enforcement-sections/enforcement-sections";
import EnforcementSkeleton from "@/components/enforcement/enforcement-skeleton/enforcement-skeleton";
import { readEnforcementFilters, type EnforcementSearchParams } from "@/features/enforcement/filters";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function EnforcementLibraryPage({ searchParams }: {
  searchParams: Promise<EnforcementSearchParams>;
}) {
  const [params, locale] = await Promise.all([searchParams, getLocale()]);
  const { enforcement } = getMessages(locale);
  const filters = readEnforcementFilters(params);

  return (
    <Shell current="/enforcement-library" title={enforcement.title}>
      <Suspense fallback={<EnforcementSkeleton label={enforcement.loading} />}>
        <EnforcementSections locale={locale} filters={filters} />
      </Suspense>
    </Shell>
  );
}
