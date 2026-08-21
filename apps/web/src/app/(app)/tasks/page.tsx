import Shell from "@/components/Shell";
import TasksScreen from "@/components/sections/tasks/tasks-screen";
import { loadTaskBoard } from "@/features/tasks/queries";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const [locale, sb] = await Promise.all([getLocale(), supabaseServer()]);
  const board = await loadTaskBoard(sb);
  const { tasks } = getMessages(locale);

  return (
    <Shell current="/tasks" title="">
      <TasksScreen tasks={board.tasks} error={board.error} strings={tasks} />
    </Shell>
  );
}
