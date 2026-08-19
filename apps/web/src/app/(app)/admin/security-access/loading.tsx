import SecuritySkeleton from "@/components/sections/admin-security-access/security-skeleton";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function LoadingSecurityAccess() {
  const locale = await getLocale();
  return <SecuritySkeleton label={getMessages(locale).adminSecurityAccess.loading} />;
}
