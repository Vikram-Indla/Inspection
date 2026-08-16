import AccessSkeleton from "@/components/sections/admin-access/access-skeleton/access-skeleton";
import { adminAccessMessages } from "@/features/admin-access/strings";
import { getLocale } from "@/lib/i18n";

export default async function AccessLoading() {
  const locale = await getLocale();
  return <AccessSkeleton label={adminAccessMessages(locale).loading} />;
}
