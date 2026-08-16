import PackagesSkeleton from "@/components/sections/admin-packages/packages-skeleton/packages-skeleton";
import { adminPackagesMessages } from "@/features/admin-packages/strings";
import { getLocale } from "@/lib/i18n";

export default async function PackagesLoading() {
  const locale = await getLocale();
  return <PackagesSkeleton label={adminPackagesMessages(locale).loading} />;
}
