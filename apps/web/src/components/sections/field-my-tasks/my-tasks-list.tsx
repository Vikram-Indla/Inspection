"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PrepareAssignmentAction from "./prepare-assignment-action";
import {
  assignmentCounts,
  connectivityPresentation,
  filterAssignmentTasks,
  hasAssignmentAlert,
  type AssignmentFilter,
  type AssignmentSort,
  type AssignmentTask,
} from "@/app/(app)/field/my-tasks/assignment-task-model";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody } from "@/components/saqeel/card/card";
import TextInput from "@/components/saqeel/text-input/text-input";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Heading, Mono, Text } from "@/components/saqeel/type";
import { statusLabel, visitTone, type MyTasksCopy } from "@/features/field-my-tasks/labels";
import styles from "./my-tasks.module.css";

const ACTIVE_STATES = ["prepared", "on_the_way", "arrived", "executing"];

export default function MyTasksList({ tasks, selectedId, alertSourceAvailable, locale, renderNow, windowStartLabels, copy }: {
  tasks: readonly AssignmentTask[];
  selectedId: string | null;
  alertSourceAvailable: boolean;
  locale: "en" | "ar";
  renderNow: number;
  windowStartLabels: Readonly<Record<string, string>>;
  copy: MyTasksCopy;
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

  const editable = [...tasks];
  const counts = useMemo(() => assignmentCounts(editable, renderNow), [editable, renderNow]);
  const visible = useMemo(
    () => filterAssignmentTasks(editable, { filter, query, sort, locale, now: renderNow }),
    [editable, filter, locale, query, renderNow, sort],
  );

  const connectivity = connectivityPresentation(online, {
    online: copy.list.online,
    offline: copy.list.offline,
  });

  const filters: readonly { key: AssignmentFilter; label: string }[] = [
    { key: "all", label: copy.list.all },
    { key: "today", label: copy.list.today },
    { key: "active", label: copy.list.active },
    { key: "upcoming", label: copy.list.upcoming },
    ...(alertSourceAvailable ? [{ key: "alerts" as const, label: copy.list.alerts }] : []),
    { key: "returned", label: copy.list.returned },
    { key: "expired", label: copy.list.expired },
  ];

  return (
    <section aria-labelledby="my-tasks-list-heading" className={styles.list}>
      <Heading level={2} visual="label" id="my-tasks-list-heading">{copy.list.heading}</Heading>

      {connectivity.tone === "offline" ? (
        <Text tone="warning" live="status" role="label">{connectivity.message}</Text>
      ) : null}
      {alertSourceAvailable ? null : (
        <Text tone="muted" live="status" role="label">{copy.list.alertsUnavailable}</Text>
      )}

      <div className={styles.tools}>
        <TextInput
          type="search"
          label={copy.list.search}
          placeholder={copy.list.search}
          value={query}
          onChange={setQuery}
        />
        <div className={styles.filters} role="group" aria-label={copy.list.filterLabel}>
          {filters.map(({ key, label }) => (
            <Button
              key={key}
              variant={filter === key ? "primary" : "secondary"}
              size="sm"
              onClick={() => setFilter(key)}
            >
              {`${label} ${counts[key]}`}
            </Button>
          ))}
        </div>
        <div className={styles.filters} role="group" aria-label={copy.list.sortLabel}>
          <Button variant={sort === "asc" ? "primary" : "secondary"} size="sm" onClick={() => setSort("asc")}>
            {copy.list.earliest}
          </Button>
          <Button variant={sort === "desc" ? "primary" : "secondary"} size="sm" onClick={() => setSort("desc")}>
            {copy.list.latest}
          </Button>
        </div>
      </div>

      {visible.length === 0 ? (
        <Text tone="muted" live="status">
          {tasks.length === 0 ? copy.list.empty : copy.list.emptyFiltered}
        </Text>
      ) : (
        <ul className={styles.results}>
          {visible.map(task => {
            const expired = task.planningStatus === "expired";
            const returned = task.assignmentStatus === "returned";
            const active = ACTIVE_STATES.includes(task.operationalState);
            const actionable = !expired && !returned;
            const actionLabel = active ? copy.list.continue : copy.list.prepare;
            const label = expired
              ? copy.list.expired
              : returned ? copy.list.returned : statusLabel(copy, task.operationalState);

            return (
              <li key={task.id} className={selectedId === task.id ? styles.selected : undefined}>
                <Card as="article">
                  <CardBody gap="tight">
                    <Link
                      href={`/field/my-tasks?task=${task.id}`}
                      prefetch={false}
                      className={styles.itemLink}
                      aria-current={selectedId === task.id ? "true" : undefined}
                    >
                      <span className={styles.itemBody}>
                        <Mono as="span">{`#${task.id.slice(0, 8)}`}</Mono>
                        <Text role="bodyStrong" as="span" dir="auto" clamp={2}>{task.factory.name}</Text>
                        <Text role="label" tone="secondary" as="span">
                          {windowStartLabels[task.id] ?? copy.noValue}
                        </Text>
                      </span>
                      <span className={styles.itemBadges}>
                        <StatusPill
                          tone={visitTone(task.planningStatus, task.operationalState)}
                          ping={hasAssignmentAlert(task)}
                        >
                          {label}
                        </StatusPill>
                        {task.priority ? (
                          <StatusPill tone="danger" ping={false}>
                            {`${copy.list.priority}: ${copy.priority[task.priority as keyof typeof copy.priority] ?? task.priority}`}
                          </StatusPill>
                        ) : null}
                        <StatusPill tone={task.packageVersionId ? "info" : "neutral"} ping={false}>
                          {task.packageVersionId ? copy.list.packageLinked : copy.list.packageMissing}
                        </StatusPill>
                      </span>
                    </Link>

                    <div className={styles.itemActions}>
                      {actionable && task.assignmentStatus === "assigned" ? (
                        <PrepareAssignmentAction visitId={task.id} label={actionLabel} working={copy.list.preparing} />
                      ) : (
                        <Button href={`/field/${task.id}`} prefetch={false} variant="secondary" size="sm">
                          {expired ? copy.list.viewOnly : returned ? copy.list.open : actionLabel}
                        </Button>
                      )}
                      {actionable ? (
                        <Button href={`/field/${task.id}#return-assignment`} prefetch={false} variant="tertiary" size="sm">
                          {copy.list.return}
                        </Button>
                      ) : null}
                    </div>
                  </CardBody>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
