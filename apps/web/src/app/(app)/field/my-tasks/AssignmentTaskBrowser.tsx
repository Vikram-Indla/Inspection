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
import styles from "./my-tasks.module.css";

export type { AssignmentTask } from "./assignment-task-model";

type Copy = {
  search: string;
  all: string;
  today: string;
  active: string;
  upcoming: string;
  alerts: string;
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
  locale,
  labels,
}: {
  tasks: AssignmentTask[];
  selectedId: string | null;
  locale: "en" | "ar";
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

  const counts = useMemo(() => assignmentCounts(tasks, Date.now()), [tasks]);
  const visible = useMemo(() => filterAssignmentTasks(tasks, {
    filter, query, sort, locale, now: Date.now(),
  }), [filter, locale, query, sort, tasks]);
  const connectivity = connectivityPresentation(online, labels);

  const filterButtons: { key: AssignmentFilter; label: string }[] = [
    { key: "all", label: labels.all },
    { key: "today", label: labels.today },
    { key: "active", label: labels.active },
    { key: "upcoming", label: labels.upcoming },
    { key: "alerts", label: labels.alerts },
    { key: "returned", label: labels.returned },
    { key: "expired", label: labels.expired },
  ];

  return (
    <>
      <div className={`${styles.connectivity} ${connectivity.tone === "online" ? styles.connectivityOnline : styles.connectivityOffline}`}
        role="status" aria-live="polite">
        <span className={styles.connectivityDot} aria-hidden="true" />
        {connectivity.message}
      </div>

      {counts.alerts > 0 ? (
        <button type="button" className={styles.alertSummary} onClick={() => setFilter("alerts")} role="alert">
          <span aria-hidden="true">!</span>
          {labels.alerts}: <span className="id-code">{counts.alerts}</span>
        </button>
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
            <article key={task.id} data-alert={hasAssignmentAlert(task) ? "true" : undefined}
              className={`${styles.taskCard} ${selectedId === task.id ? styles.itemActive : ""}`}>
              <Link href={`/field/my-tasks?task=${task.id}`} prefetch={false} className={styles.taskMain}
                aria-current={selectedId === task.id ? "true" : undefined}>
                <span className={styles.taskTop}>
                  <span className="id-code">#{task.id.slice(0, 8)}</span>
                  <span className={`badge ${tone(task)}`}>{status}</span>
                </span>
                <strong><bdi>{task.factory.name}</bdi></strong>
                <span className="t-caption">
                  {new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", {
                    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh",
                  }).format(new Date(task.windowStart))}
                  {task.factory.city ? ` · ${task.factory.city}` : ""}
                </span>
                <span className={styles.taskSignals}>
                  {task.priority ? <span className="badge badge-critical">
                    {labels.priority}: {labels.priorityLabels[task.priority] ?? task.priority}
                  </span> : null}
                  <span className={`badge ${task.packageVersionId ? "badge-info" : "badge-outline"}`}>
                    {task.packageVersionId ? labels.packageLinked : labels.packageMissing}
                  </span>
                </span>
              </Link>
              <div className={styles.taskActions}>
                <Link className="btn btn-secondary" href={actionable ? `/field/${task.id}#preparation` : `/field/${task.id}`} prefetch={false}>
                  {expired ? labels.viewOnly : returned ? labels.open : actionLabel}
                </Link>
                {!expired && !returned ? (
                  <Link className="btn btn-ghost" href={`/field/${task.id}#return-assignment`} prefetch={false}>
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
