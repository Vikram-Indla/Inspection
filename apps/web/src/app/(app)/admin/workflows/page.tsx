import WorkflowsScreen from "@/components/sections/admin-workflows/workflows-screen";
import { loadWorkflows } from "@/features/admin-workflows/queries";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function WorkflowsPage() {
  const [locale, data] = await Promise.all([getLocale(), loadWorkflows()]);
  return <WorkflowsScreen data={data} locale={locale} />;
}
