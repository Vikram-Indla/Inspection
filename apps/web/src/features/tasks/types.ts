import type { Messages } from "@/i18n/messages";
import type { TaskStatus } from "@/lib/workflow/tasks";

export type TaskRowData = {
  id: string;
  taskType: string;
  taskRef: string | null;
  assignee: string | null;
  status: TaskStatus;
  branch: string | null;
  sector: string | null;
  active: boolean;
  canManage: boolean;
};

export type TasksStrings = Messages["tasks"];
