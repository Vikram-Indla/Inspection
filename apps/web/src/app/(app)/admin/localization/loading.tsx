import LocalizationSkeleton from "@/components/sections/admin-localization/localization-skeleton/localization-skeleton";
import { adminLocalizationMessages } from "@/features/admin-localization/strings";
import { getLocale } from "@/lib/i18n";

export default async function LocalizationLoading() {
  const locale = await getLocale();
  return <LocalizationSkeleton label={adminLocalizationMessages(locale).loading} />;
}
