import TemplatesScreen from "@/components/sections/admin-templates/templates-screen";
import { loadTemplates } from "@/features/admin-templates/queries";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const [locale, data] = await Promise.all([getLocale(), loadTemplates()]);

  return <TemplatesScreen data={data} locale={locale} />;
}
