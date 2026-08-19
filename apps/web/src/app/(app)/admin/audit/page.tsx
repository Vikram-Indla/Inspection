import AuditScreen from "@/components/sections/admin-audit/audit-screen";
import { loadAudit } from "@/features/admin-audit/queries";
import { AUDIT_MODES, type AuditMode, type AuditParams } from "@/features/admin-audit/types";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

function resolveMode(raw: string): AuditMode {
  return (AUDIT_MODES as readonly string[]).includes(raw) ? raw as AuditMode : "recorder";
}

export default async function AuditReplayPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (key: string) => typeof sp[key] === "string" ? sp[key] as string : "";
  const params: AuditParams = {
    caseRef: one("case").trim(),
    query: one("q"),
    mode: resolveMode(one("view")),
    at: one("at") || null,
    vs: one("vs") || null,
  };
  const [locale, data] = await Promise.all([getLocale(), loadAudit(params)]);
  return <AuditScreen data={data} params={params} locale={locale} />;
}
