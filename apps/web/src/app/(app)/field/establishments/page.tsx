import { redirect } from "next/navigation";
import EstablishmentsScreen from "@/components/sections/field-establishments/establishments-screen";
import { loadEstablishments } from "@/features/field-establishments/queries";
import type { EstablishmentSearchParams } from "@/features/field-establishments/params";
import { getLocale } from "@/lib/i18n";

export default async function FieldEstablishmentsPage({ searchParams }: {
  searchParams: Promise<EstablishmentSearchParams>;
}) {
  const [locale, params] = await Promise.all([getLocale(), searchParams]);
  const data = await loadEstablishments(params);
  if (!data) redirect("/login");

  return <EstablishmentsScreen data={data} locale={locale} />;
}
