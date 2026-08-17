import { redirect } from "next/navigation";
import MyTasksScreen from "@/components/sections/field-my-tasks/my-tasks-screen";
import { loadMyTasks } from "@/features/field-my-tasks/queries";
import { getLocale } from "@/lib/i18n";

type SearchParams = { task?: string; reg?: string; view?: string };

export default async function FieldMyTasksPage({ searchParams }: {
  searchParams: Promise<SearchParams>;
}) {
  const [locale, params] = await Promise.all([getLocale(), searchParams]);
  const data = await loadMyTasks(locale, params);
  if (!data) redirect("/login");

  return <MyTasksScreen data={data} locale={locale} />;
}
