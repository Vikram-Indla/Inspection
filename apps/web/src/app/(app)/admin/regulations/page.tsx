import AdminShell from "@/app/(app)/admin/_components/AdminShell";
import RegulationRecord from "@/components/sections/regulations/record/regulation-record/regulation-record";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export default async function RegulationRecordPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, locale] = await Promise.all([searchParams, getLocale()]);
  const { regulations } = getMessages(locale);

  return (
    <AdminShell current="/admin/regulations" title={regulations.detailTitle}>
      <RegulationRecord locale={locale} entityId={first(params.id).trim()} />
    </AdminShell>
  );
}
