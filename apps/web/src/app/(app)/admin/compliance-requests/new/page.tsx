import RequestCreate from "@/components/sections/admin-compliance-requests/request-create";
import { getLocale } from "@/lib/i18n";

export default async function NewComplianceRequestPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [locale, sp] = await Promise.all([getLocale(), searchParams]);

  return (
    <RequestCreate
      locale={locale}
      defaults={{
        requestType: sp.request_type === "modify" ? "modify" : "create",
        title: typeof sp.title === "string" ? sp.title.slice(0, 180) : "",
        description: typeof sp.description === "string" ? sp.description.slice(0, 2000) : "",
      }}
    />
  );
}
