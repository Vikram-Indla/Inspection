"use client";
import { useActionState, useId } from "react";
import {
  reassignTask, setTaskStatus, setTaskActive, type TaskResult,
} from "@/app/(app)/admin/workflows/task-actions";
import { TASK_STATUSES, isTaskStatusTransitionAllowed, type TaskStatus } from "@/lib/workflow/tasks";

// TASK-MVP2-M2-02-WORKFLOW-STUDIO-002 · MVP2-REQ-0032 · /tasks workspace (CD-043).
// Client controls consume server-built strings only (SB19). Every mutation goes
// through the governed task-actions (state-contract + scope + reason + audit); the
// DB RLS is the real authorization — a non-manager sees rows but the action fails
// closed with an honest scope message.

export type TaskBoardStrings = {
  reassignTo: string; reason: string; reassign: string; reassigning: string; reassigned: string;
  changeStatus: string; apply: string; applying: string; statusChanged: string;
  deactivate: string; reactivate: string; activating: string; activeYes: string; activeNo: string;
  terminalNote: string;
};

export type TaskRowData = {
  id: string; taskType: string; taskRef: string | null; assignee: string | null;
  status: TaskStatus; branch: string | null; sector: string | null; active: boolean;
  canManage: boolean;
};

function allowedTargets(from: TaskStatus): TaskStatus[] {
  return TASK_STATUSES.filter((s) => s !== from && isTaskStatusTransitionAllowed(from, s));
}

export function TaskRow({ task, strings: s }: { task: TaskRowData; strings: TaskBoardStrings }) {
  const [reassignState, reassignAction, reassigning] = useActionState<TaskResult, FormData>(reassignTask, {});
  const [statusState, statusAction, applying] = useActionState<TaskResult, FormData>(setTaskStatus, {});
  const [activeState, activeAction, activating] = useActionState<TaskResult, FormData>(setTaskActive, {});
  const fieldId = useId();
  const targets = allowedTargets(task.status);
  const isTerminal = targets.length === 0;

  return (
    <div className="panel" style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-3)" }}>
        <h3>
          {task.taskType} <span className="sq-version">{task.taskRef ?? "—"}</span>
        </h3>
        <div className="row" style={{ gap: "var(--space-3)", flexWrap: "wrap" }}>
          <span className="badge badge-info">{task.status.replace(/_/g, " ")}</span>
          <span className={`sq-lozenge ${task.active ? "sq-lozenge--success" : "sq-lozenge--warning"}`}>
            {task.active ? s.activeYes : s.activeNo}
          </span>
        </div>
      </div>
      <p className="t-caption">
        {[task.branch, task.sector].filter(Boolean).join(" · ") || "—"} · {task.assignee ?? "—"}
      </p>

      {!task.canManage && <p className="t-caption">{/* read-only: RLS/scope */}—</p>}

      {task.canManage && (
        <div className="row" style={{ gap: "var(--space-6)", flexWrap: "wrap", alignItems: "flex-start" }}>
          {/* Reassign — reason mandatory, terminal tasks blocked (task machine) */}
          <form action={reassignAction} className="row" style={{ gap: "var(--space-3)", alignItems: "flex-end", flexWrap: "wrap" }}>
            <input type="hidden" name="task_id" value={task.id} />
            <div className="sq-field"><label className="sq-field__label" htmlFor={`${fieldId}-reassign-to`}>{s.reassignTo}</label>
              <input className="sq-input" name="to_assignee" id={`${fieldId}-reassign-to`} required disabled={isTerminal} /></div>
            <div className="sq-field"><label className="sq-field__label" htmlFor={`${fieldId}-reassign-reason`}>{s.reason}</label>
              <input className="sq-input" name="reason" id={`${fieldId}-reassign-reason`} required disabled={isTerminal} /></div>
            <button className="btn btn-primary btn-touch" disabled={reassigning || isTerminal}>{reassigning ? s.reassigning : s.reassign}</button>
            {reassignState.error && <span className="t-caption" style={{ color: "var(--status-critical)" }} role="alert">{reassignState.error}</span>}
            {reassignState.ok && <span className="badge badge-compliant">{s.reassigned}</span>}
          </form>

          {/* Status transition — only machine-legal targets are offered */}
          <form action={statusAction} className="row" style={{ gap: "var(--space-3)", alignItems: "flex-end", flexWrap: "wrap" }}>
            <input type="hidden" name="task_id" value={task.id} />
            <div className="sq-field"><label className="sq-field__label" htmlFor={`${fieldId}-status`}>{s.changeStatus}</label>
              <select className="sq-input" name="to_status" id={`${fieldId}-status`} required disabled={isTerminal}>
                {targets.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
              </select></div>
            <div className="sq-field"><label className="sq-field__label" htmlFor={`${fieldId}-status-reason`}>{s.reason}</label>
              <input className="sq-input" name="reason" id={`${fieldId}-status-reason`} /></div>
            <button className="btn btn-primary btn-touch" disabled={applying || isTerminal}>{applying ? s.applying : s.apply}</button>
            {statusState.error && <span className="t-caption" style={{ color: "var(--status-critical)" }} role="alert">{statusState.error}</span>}
            {statusState.ok && <span className="badge badge-compliant">{s.statusChanged}</span>}
          </form>

          {/* Activation — reason mandatory; reactivation of a terminal task blocked */}
          <form action={activeAction} className="row" style={{ gap: "var(--space-3)", alignItems: "flex-end", flexWrap: "wrap" }}>
            <input type="hidden" name="task_id" value={task.id} />
            <input type="hidden" name="active" value={task.active ? "false" : "true"} />
            <div className="sq-field"><label className="sq-field__label" htmlFor={`${fieldId}-active-reason`}>{s.reason}</label>
              <input className="sq-input" name="reason" id={`${fieldId}-active-reason`} required /></div>
            <button className="btn btn-primary btn-touch" disabled={activating}>{activating ? s.activating : (task.active ? s.deactivate : s.reactivate)}</button>
            {activeState.error && <span className="t-caption" style={{ color: "var(--status-critical)" }} role="alert">{activeState.error}</span>}
            {activeState.ok && <span className="badge badge-compliant">✓</span>}
          </form>
        </div>
      )}
      {isTerminal && <p className="t-caption">{s.terminalNote}</p>}
    </div>
  );
}
