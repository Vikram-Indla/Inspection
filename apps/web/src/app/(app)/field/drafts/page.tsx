import { redirect } from "next/navigation";
import DraftsScreen from "@/components/sections/field-drafts/drafts-screen";
import { loadFieldDrafts } from "@/features/field-drafts/queries";
import { getLocale } from "@/lib/i18n";

export default async function FieldDraftsPage() {
  const [locale, data] = await Promise.all([getLocale(), loadFieldDrafts()]);
  if (!data) redirect("/login");

  return <DraftsScreen data={data} locale={locale} />;
}
