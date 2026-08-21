"use client";

import { useActionState } from "react";
import Button from "@/components/saqeel/button/button";
import Select from "@/components/saqeel/select/select";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import TextInput from "@/components/saqeel/text-input/text-input";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import { Mono, Text } from "@/components/saqeel/type";
import {
  reassignTask, setTaskStatus, setTaskActive, type TaskResult,
} from "@/app/(app)/admin/workflows/task-actions";
import { TASK_STATUSES, isTaskStatusTransitionAllowed, type TaskStatus } from "@/lib/workflow/tasks";
import type { TaskRowData, TasksStrings } from "@/features/tasks/types";
import styles from "./tasks.module.css";

const STATUS_TONE: Record<TaskStatus, StatusTone> = {
  new: "info",
  assigned: "info",
  in_progress: "info",
  suspended: "warning",
  completed: "success",
  cancelled: "neutral",
};

function allowedTargets(from: TaskStatus): TaskStatus[] {
  return TASK_STATUSES.filter(status => status !== from && isTaskStatusTransitionAllowed(from, status));
}

export default function TaskCard({ task, strings }: { task: TaskRowData; strings: TasksStrings }) {
  const [reassignState, reassignAction, reassigning] = useActionState<TaskResult, FormData>(reassignTask, {});
  const [statusState, statusAction, applying] = useActionState<TaskResult, FormData>(setTaskStatus, {});
  const [activeState, activeAction, activating] = useActionState<TaskResult, FormData>(setTaskActive, {});

  const targets = allowedTargets(task.status);
  const isTerminal = targets.length === 0;
  const place = [task.branch, task.sector].filter(Boolean).join(" · ") || strings.unassigned;
  const scope = `${place} · ${task.assignee ?? strings.unassigned}`;
  const activeToggle = task.active ? strings.deactivate : strings.reactivate;

  return (
    <Card as="section">
      <CardHeader
        title={<span className={styles.cardTitle}>{task.taskType.replace(/_/g, " ")}{task.taskRef ? <Mono>{task.taskRef}</Mono> : null}</span>}
        trailing={
          <span className={styles.pills}>
            <StatusPill tone={STATUS_TONE[task.status]}>{strings.status[task.status]}</StatusPill>
            <StatusPill tone={task.active ? "success" : "warning"}>{task.active ? strings.activeYes : strings.activeNo}</StatusPill>
          </span>
        }
      />
      <CardBody gap="default">
        <Text tone="muted">{scope}</Text>

        {!task.canManage ? <Text tone="muted">{strings.readOnly}</Text> : null}

        {task.canManage ? (
          <div className={styles.forms}>
            <form action={reassignAction} className={styles.form}>
              <input type="hidden" name="task_id" value={task.id} />
              <TextInput label={strings.reassignTo} name="to_assignee" required disabled={isTerminal} />
              <TextInput label={strings.reason} name="reason" required disabled={isTerminal} />
              <Button type="submit" variant="primary" size="sm" disabled={reassigning || isTerminal}
                label={reassigning ? strings.reassigning : strings.reassign}>
                {reassigning ? strings.reassigning : strings.reassign}
              </Button>
              {reassignState.error ? <StatusPill tone="danger">{reassignState.error}</StatusPill> : null}
              {reassignState.ok ? <StatusPill tone="success">{strings.reassigned}</StatusPill> : null}
            </form>

            <form action={statusAction} className={styles.form}>
              <input type="hidden" name="task_id" value={task.id} />
              <Select label={strings.changeStatus} name="to_status" required disabled={isTerminal}
                options={targets.map(status => ({ value: status, label: strings.status[status] }))} />
              <TextInput label={strings.reason} name="reason" />
              <Button type="submit" variant="primary" size="sm" disabled={applying || isTerminal}
                label={applying ? strings.applying : strings.apply}>
                {applying ? strings.applying : strings.apply}
              </Button>
              {statusState.error ? <StatusPill tone="danger">{statusState.error}</StatusPill> : null}
              {statusState.ok ? <StatusPill tone="success">{strings.statusChanged}</StatusPill> : null}
            </form>

            <form action={activeAction} className={styles.form}>
              <input type="hidden" name="task_id" value={task.id} />
              <input type="hidden" name="active" value={task.active ? "false" : "true"} />
              <TextInput label={strings.reason} name="reason" required />
              <Button type="submit" variant="secondary" size="sm" disabled={activating}
                label={activating ? strings.activating : activeToggle}>
                {activating ? strings.activating : activeToggle}
              </Button>
              {activeState.error ? <StatusPill tone="danger">{activeState.error}</StatusPill> : null}
              {activeState.ok ? <StatusPill tone="success">{strings.done}</StatusPill> : null}
            </form>
          </div>
        ) : null}

        {isTerminal ? <Text tone="muted">{strings.terminal}</Text> : null}
      </CardBody>
    </Card>
  );
}
