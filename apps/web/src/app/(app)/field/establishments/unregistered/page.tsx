import { redirect } from "next/navigation";
import UnregisteredScreen from "@/components/sections/field-unregistered/unregistered-screen";
import { loadUnregistered } from "@/features/field-unregistered/queries";
import { getLocale } from "@/lib/i18n";

export default async function FieldUnregisteredEstablishmentPage() {
  const [locale, data] = await Promise.all([getLocale(), loadUnregistered()]);
  if (!data) redirect("/login");

  return <UnregisteredScreen data={data} locale={locale} />;
}
