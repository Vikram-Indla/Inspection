import LocalizationDenied from "@/components/sections/admin-localization/localization-denied/localization-denied";
import LocalizationScreen from "@/components/sections/admin-localization/localization-screen/localization-screen";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { loadLocalization } from "@/features/admin-localization/queries";
import { adminLocalizationMessages } from "@/features/admin-localization/strings";
import { parseLocalizationQuery } from "@/features/admin-localization/view";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function LocalizationPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [locale, params] = await Promise.all([getLocale(), searchParams]);
  const query = parseLocalizationQuery(params);
  const result = await loadLocalization(query);
  const strings = adminLocalizationMessages(locale);

  if (result.kind === "unauthorized") return <LocalizationDenied locale={locale} />;
  if (result.kind === "error") {
    return (
      <EmptyState
        description={strings.error.dictionaryBody}
        icon="risk"
        title={strings.error.dictionaryTitle}
        tone="danger"
      />
    );
  }

  return <LocalizationScreen data={result.data} locale={locale} query={query} />;
}
