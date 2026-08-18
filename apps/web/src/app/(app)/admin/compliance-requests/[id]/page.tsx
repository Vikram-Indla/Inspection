import RequestUnavailable from "@/components/sections/admin-compliance-requests/request-unavailable";
import RequestWorkspace from "@/components/sections/admin-compliance-requests/request-workspace";
import { loadComplianceRequest } from "@/features/admin-compliance-requests/queries";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function ComplianceRequestPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [locale, { id }, sp] = await Promise.all([getLocale(), params, searchParams]);
  const fromQueue = sp.from === "approval-queue";
  const result = await loadComplianceRequest(id);

  if (result.status !== "ok") {
    return <RequestUnavailable kind={result.status} locale={locale} fromQueue={fromQueue} />;
  }

  return <RequestWorkspace detail={result.detail} locale={locale} fromQueue={fromQueue} />;
}
