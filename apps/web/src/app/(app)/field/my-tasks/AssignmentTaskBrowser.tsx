"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  assignmentCounts,
  connectivityPresentation,
  filterAssignmentTasks,
  hasAssignmentAlert,
  type AssignmentFilter,
  type AssignmentSort,
  type AssignmentTask,
} from "./assignment-task-model";
import PrepareAssignmentAction from "./PrepareAssignmentAction";
import styles from "./my-tasks.module.css";

export type { AssignmentTask } from "./assignment-task-model";

type Copy = {
  search: string;
  all: string;
  today: string;
  active: string;
  upcoming: string;
  alerts: string;
  alertsUnavailable: string;
  returned: string;
  expired: string;
  earliest: string;
  latest: string;
  empty: string;
  emptyFiltered: string;
  offline: string;
  online: string;
  open: string;
  prepare: string;
  continueAction: string;
  preparing: string;
  returnAction: string;
  viewOnly: string;
  packageLinked: string;
  packageMissing: string;
  priority: string;
  statusLabels: Record<string, string>;
  priorityLabels: Record<string, string>;
};

function tone(task: AssignmentTask): string {
  if (task.planningStatus === "expired") return "badge-warning";
  if (task.assignmentStatus === "returned") return "badge-warning";
  if (["submitted", "approved", "completed", "closed"].includes(task.operationalState)) return "badge-compliant";
  if (["cancelled", "rejected"].includes(task.operationalState)) return "badge-critical";
  return "badge-info";
}

export default function AssignmentTaskBrowser({
  tasks,
  selectedId,
  alertSourceAvailable,
  locale,
  renderNow,
  windowStartLabels,
  labels,
}: {
  tasks: AssignmentTask[];
  selectedId: string | null;
  alertSourceAvailable: boolean;
  locale: "en" | "ar";
  renderNow: number;
  windowStartLabels: Record<string, string>;
  labels: Copy;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AssignmentFilter>("all");
  const [sort, setSort] = useState<AssignmentSort>("asc");
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // `renderNow` and each task's display label are produced by the server and
  // serialized with the component props. The server render and the first
  // browser render must use the same instant and the same formatted text;
  // calling Date.now()/Intl here caused the shipped hydration mismatch.
  const counts = useMemo(() => assignmentCounts(tasks, renderNow), [renderNow, tasks]);
  const visible = useMemo(() => filterAssignmentTasks(tasks, {
    filter, query, sort, locale, now: renderNow,
  }), [filter, locale, query, renderNow, sort, tasks]);
  const connectivity = connectivityPresentation(online, labels);

  const filterButtons: { key: AssignmentFilter; label: string }[] = [
    { key: "all", label: labels.all },
    { key: "today", label: labels.today },
    { key: "active", label: labels.active },
    { key: "upcoming", label: labels.upcoming },
    ...(alertSourceAvailable ? [{ key: "alerts" as const, label: labels.alerts }] : []),
    { key: "returned", label: labels.returned },
    { key: "expired", label: labels.expired },
  ];

  return (
    <>
      {/* The design's list pane carries no steady-state banner and no alert
          summary block — connectivity lives in the header pill and the alert
          count lives on the "Needs attention" filter. Only genuinely degraded
          states surface here, and only while they are true. */}
      {connectivity.tone === "offline" ? (
        <div className={`${styles.connectivity} ${styles.connectivityOffline}`}
          role="status" aria-live="polite">
          <span className={styles.connectivityDot} aria-hidden="true" />
          {connectivity.message}
        </div>
      ) : null}

      {!alertSourceAvailable ? (
        <div className={styles.alertUnavailable} role="status">{labels.alertsUnavailable}</div>
      ) : null}

      <div className={styles.taskTools}>
        <label className={styles.search}>
          <span className="sr-only">{labels.search}</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)}
            placeholder={labels.search} type="search" />
        </label>
        <select className={styles.sort} value={sort} onChange={(event) => setSort(event.target.value as AssignmentSort)}
          aria-label={sort === "asc" ? labels.earliest : labels.latest}>
          <option value="asc">{labels.earliest}</option>
          <option value="desc">{labels.latest}</option>
        </select>
        <div className={styles.filters} role="group" aria-label={labels.all}>
          {filterButtons.map(({ key, label }) => (
            <button key={key} type="button" onClick={() => setFilter(key)}
              className={`${styles.filter} ${filter === key ? styles.filterActive : ""}`}
              aria-pressed={filter === key}>
              {label} <span className="id-code">{counts[key]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.taskResults} aria-live="polite">
        {visible.length === 0 ? (
          <div className={styles.empty} role="status">
            <strong>{tasks.length === 0 ? labels.empty : labels.emptyFiltered}</strong>
          </div>
        ) : visible.map((task) => {
          const expired = task.planningStatus === "expired";
          const returned = task.assignmentStatus === "returned";
          const status = expired ? labels.expired : returned ? labels.returned
            : labels.statusLabels[task.operationalState] ?? task.operationalState.replaceAll("_", " ");
          const active = ["prepared", "on_the_way", "arrived", "executing"].includes(task.operationalState);
          const actionable = !expired && !returned;
          const actionLabel = active ? labels.continueAction : labels.prepare;
          return (
            // Design row anatomy (.mt-item): a flat, hairline-separated row —
            // #id / establishment / window date in the start column, status on
            // the end. No card border, no radius, no bordered action footer.
            // The governed priority and package signals stack under the status
            // badge so the row keeps the design's two-column silhouette.
            <article key={task.id} data-alert={hasAssignmentAlert(task) ? "true" : undefined}
              className={`${styles.item} ${selectedId === task.id ? styles.itemActive : ""}`}>
              <Link href={`/field/my-tasks?task=${task.id}`} prefetch={false} className={styles.itemMain}
                aria-current={selectedId === task.id ? "true" : undefined}>
                <span className={`${styles.kv} grow`}>
                  <span className={`id-code ${styles.itemId}`}>#{task.id.slice(0, 8)}</span>
                  <span className={styles.itemName}><bdi>{task.factory.name}</bdi></span>
                  <span className="k">{windowStartLabels[task.id] ?? "—"}</span>
                </span>
                <span className={styles.itemBadges}>
                  <span className={`badge ${tone(task)} ${styles.itemStatus}`}>{status}</span>
                  {task.priority ? <span className="badge badge-critical">
                    {labels.priority}: {labels.priorityLabels[task.priority] ?? task.priority}
                  </span> : null}
                  <span className={`badge ${task.packageVersionId ? "badge-info" : "badge-outline"}`}>
                    {task.packageVersionId ? labels.packageLinked : labels.packageMissing}
                  </span>
                </span>
              </Link>
              {/* CR-104 / MVP1-M03-002. The design draws no row action; the
                  contract mandates accept-prepare and return from the
                  assignment pool, so they render as flat btn-sm controls
                  inside the row rather than in card chrome. */}
              <div className={styles.itemActions}>
                {actionable && task.assignmentStatus === "assigned" ? (
                  <PrepareAssignmentAction visitId={task.id} label={actionLabel} working={labels.preparing} />
                ) : (
                  <Link className="btn btn-secondary btn-sm" href={`/field/${task.id}`} prefetch={false}>
                    {expired ? labels.viewOnly : returned ? labels.open : actionLabel}
                  </Link>
                )}
                {!expired && !returned ? (
                  <Link className="btn btn-ghost btn-sm" href={`/field/${task.id}#return-assignment`} prefetch={false}>
                    {labels.returnAction}
                  </Link>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
