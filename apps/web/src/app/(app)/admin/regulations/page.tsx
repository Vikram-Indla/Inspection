import AdminShell from "@/app/(app)/admin/_components/AdminShell";
import RegulationDossier from "@/components/sections/regulations/regulation-dossier/regulation-dossier";
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
      <RegulationDossier detailId={first(params.id).trim()} />
    </AdminShell>
  );
}
