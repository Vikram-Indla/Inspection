import AuditSkeleton from "@/components/sections/admin-audit/audit-skeleton";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function LoadingAudit() {
  const locale = await getLocale();
  return <AuditSkeleton label={getMessages(locale).adminAudit.loading} />;
}
