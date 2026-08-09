import AdminShell from "@/app/(app)/admin/_components/AdminShell";
import CatalogueScreen from "@/components/sections/enforcement/catalogue/catalogue-screen/catalogue-screen";
import { CATALOGUE_MODES, type CatalogueMode } from "@/features/enforcement/catalogue";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";
const isMode = (value: string): value is CatalogueMode => (CATALOGUE_MODES as readonly string[]).includes(value);

export default async function ViolationCataloguePage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, locale] = await Promise.all([searchParams, getLocale()]);
  const { enforcement } = getMessages(locale);
  const raw = first(params.mode);
  const mode: CatalogueMode = isMode(raw) ? raw : "catalogue";
  const title = mode === "penalty" ? enforcement.catalogue.penaltyTab : enforcement.catalogue.catalogueTab;

  return (
    <AdminShell current="/admin/violations" title={title}>
      <CatalogueScreen locale={locale} mode={mode} nowMs={Date.now()} />
    </AdminShell>
  );
}
