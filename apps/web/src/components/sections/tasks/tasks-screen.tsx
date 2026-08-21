import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { Heading, Metric, Text } from "@/components/saqeel/type";
import type { TaskRowData, TasksStrings } from "@/features/tasks/types";
import TaskCard from "./task-card";
import styles from "./tasks.module.css";

const COLUMNS = [
  { key: "assigned", statuses: ["new", "assigned", "suspended"] },
  { key: "in_progress", statuses: ["in_progress"] },
  { key: "completed", statuses: ["completed", "cancelled"] },
] as const;

export default function TasksScreen({ tasks, error, strings }: {
  tasks: readonly TaskRowData[];
  error: boolean;
  strings: TasksStrings;
}) {
  const label = (key: (typeof COLUMNS)[number]["key"]) =>
    key === "assigned" ? strings.column.assigned : key === "in_progress" ? strings.column.inProgress : strings.column.completed;

  return (
    <div className={styles.root}>
      <Heading level={1}>{strings.title}</Heading>

      <EmptyState variant="inline" tone="info" icon="restricted"
        title={strings.banner.title} description={strings.banner.body} />

      {error ? (
        <EmptyState variant="inline" tone="warning" icon="risk" title={strings.error} />
      ) : tasks.length === 0 ? (
        <EmptyState icon="workflow" title={strings.empty.title} description={strings.empty.body} />
      ) : (
        <div className={styles.board} aria-label={strings.board.label}>
          {COLUMNS.map(column => {
            const columnTasks = tasks.filter(task => (column.statuses as readonly string[]).includes(task.status));
            return (
              <section key={column.key} className={styles.column} aria-labelledby={`tasks-col-${column.key}`}>
                <div className={styles.columnHead}>
                  <Text as="span" role="label" id={`tasks-col-${column.key}`}>{label(column.key)}</Text>
                  <Metric>{columnTasks.length}</Metric>
                </div>
                <div className={styles.stack}>
                  {columnTasks.map(task => <TaskCard key={task.id} task={task} strings={strings} />)}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
