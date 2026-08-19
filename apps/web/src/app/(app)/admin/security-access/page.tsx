import SecurityScreen from "@/components/sections/admin-security-access/security-screen";
import { loadSecurityAccess } from "@/features/admin-security-access/queries";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function SecurityAccessPage() {
  const [locale, data] = await Promise.all([getLocale(), loadSecurityAccess()]);
  return <SecurityScreen data={data} locale={locale} />;
}
