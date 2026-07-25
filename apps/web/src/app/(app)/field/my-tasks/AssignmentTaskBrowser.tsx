"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./my-tasks.module.css";

export type AssignmentTask = {
  id: string;
  assignmentStatus: string | null;
  returnReason: string | null;
  planningStatus: string;
  operationalState: string;
  windowStart: string;
  windowEnd: string | null;
  visitType: string;
  executionMode: string;
  priority: string | null;
  packageVersionId: string | null;
  inspectionId: string | null;
  inspectionStatus: string | null;
  factory: {
    name: string;
    code: string | null;
    region: string | null;
    city: string | null;
  };
};

type Copy = {
  search: string;
  all: string;
  today: string;
  upcoming: string;
  returned: string;
  expired: string;
  earliest: string;
  latest: string;
  empty: string;
  emptyFiltered: string;
  offline: string;
  online: string;
  open: string;
  returnAction: string;
  viewOnly: string;
  packageLinked: string;
  packageMissing: string;
  priority: string;
};

type Filter = "all" | "today" | "upcoming" | "returned" | "expired";
type Sort = "asc" | "desc";

function riyadhDay(value: string | number | Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date(value));
}

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
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("asc");
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

  const today = riyadhDay(Date.now());
  const counts = useMemo(() => ({
    all: tasks.length,
    today: tasks.filter((task) => riyadhDay(task.windowStart) === today && task.planningStatus !== "expired").length,
    upcoming: tasks.filter((task) => riyadhDay(task.windowStart) > today && task.planningStatus !== "expired").length,
    returned: tasks.filter((task) => task.assignmentStatus === "returned").length,
    expired: tasks.filter((task) => task.planningStatus === "expired").length,
  }), [tasks, today]);

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(locale === "ar" ? "ar" : "en");
    return tasks
      .filter((task) => {
        if (filter === "today") return riyadhDay(task.windowStart) === today && task.planningStatus !== "expired";
        if (filter === "upcoming") return riyadhDay(task.windowStart) > today && task.planningStatus !== "expired";
        if (filter === "returned") return task.assignmentStatus === "returned";
        if (filter === "expired") return task.planningStatus === "expired";
        return true;
      })
      .filter((task) => {
        if (!needle) return true;
        return [
          task.id, task.factory.name, task.factory.code, task.factory.region,
          task.factory.city, task.visitType, task.executionMode,
        ].some((value) => value?.toLocaleLowerCase(locale === "ar" ? "ar" : "en").includes(needle));
      })
      .sort((a, b) => sort === "asc"
        ? a.windowStart.localeCompare(b.windowStart)
        : b.windowStart.localeCompare(a.windowStart));
  }, [filter, locale, query, sort, tasks, today]);

  const filterButtons: { key: Filter; label: string }[] = [
    { key: "all", label: labels.all },
    { key: "today", label: labels.today },
    { key: "upcoming", label: labels.upcoming },
    { key: "returned", label: labels.returned },
    { key: "expired", label: labels.expired },
  ];

  return (
    <>
      <div className={`${styles.connectivity} ${online ? styles.connectivityOnline : styles.connectivityOffline}`}
        role="status" aria-live="polite">
        <span className={styles.connectivityDot} aria-hidden="true" />
        {online ? labels.online : labels.offline}
      </div>

      <div className={styles.taskTools}>
        <label className={styles.search}>
          <span className="sr-only">{labels.search}</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)}
            placeholder={labels.search} type="search" />
        </label>
        <select className={styles.sort} value={sort} onChange={(event) => setSort(event.target.value as Sort)}
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
          const status = expired ? labels.expired : returned ? labels.returned : task.operationalState.replaceAll("_", " ");
          return (
            <article key={task.id}
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
                  {task.priority ? <span className="badge badge-critical">{labels.priority}: {task.priority}</span> : null}
                  <span className={`badge ${task.packageVersionId ? "badge-info" : "badge-outline"}`}>
                    {task.packageVersionId ? labels.packageLinked : labels.packageMissing}
                  </span>
                </span>
              </Link>
              <div className={styles.taskActions}>
                <Link className="btn btn-secondary" href={`/field/${task.id}`} prefetch={false}>
                  {expired ? labels.viewOnly : labels.open}
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
