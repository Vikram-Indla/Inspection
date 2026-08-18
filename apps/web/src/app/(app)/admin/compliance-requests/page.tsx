import RegisterScreen from "@/components/sections/admin-compliance-requests/register-screen";
import { loadComplianceRequests } from "@/features/admin-compliance-requests/queries";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function ComplianceRequestsPage() {
  const [locale, data] = await Promise.all([getLocale(), loadComplianceRequests()]);

  return <RegisterScreen data={data} locale={locale} />;
}
