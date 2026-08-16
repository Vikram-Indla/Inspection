import PackagesDenied from "@/components/sections/admin-packages/packages-denied/packages-denied";
import PackagesScreen from "@/components/sections/admin-packages/packages-screen/packages-screen";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { loadEditorStrings } from "@/features/admin-packages/editor-strings";
import { loadImpactMap } from "@/features/admin-packages/impact";
import { loadPackages } from "@/features/admin-packages/queries";
import { adminPackagesMessages } from "@/features/admin-packages/strings";
import { parsePackagesQuery } from "@/features/admin-packages/view";
import { getLocale } from "@/lib/i18n";
import PackagesEditors from "./PackagesEditors";

export const dynamic = "force-dynamic";

export default async function PackagesPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [locale, params] = await Promise.all([getLocale(), searchParams]);
  const query = parsePackagesQuery(params);
  const result = await loadPackages(query);
  const strings = adminPackagesMessages(locale);

  if (result.kind === "unauthorized") return <PackagesDenied locale={locale} />;
  if (result.kind === "error") {
    return (
      <EmptyState
        description={strings.error.libraryBody}
        icon="risk"
        title={strings.error.libraryTitle}
        tone="danger"
      />
    );
  }

  const [bags, impact] = await Promise.all([
    loadEditorStrings(result.data.items, result.data.packages),
    loadImpactMap(result.data.packages, result.data.today),
  ]);

  return <PackagesEditors bags={bags} data={result.data} impact={impact} locale={locale} query={query} />;
}
