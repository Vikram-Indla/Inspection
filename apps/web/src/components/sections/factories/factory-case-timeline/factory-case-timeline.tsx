import { type ReactNode } from "react";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import Stack from "@/components/saqeel/stack/stack";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import Timeline, { type TimelineEvent } from "@/components/saqeel/timeline/timeline";
import styles from "./factory-case-timeline.module.css";

export type CaseVisit = {
  readonly id: string;
  readonly day: string;
  readonly dayIso: string;
  readonly kindLabel: string;
  readonly visitShort: string;
  readonly visitHref: string;
  readonly planningLabel: string;
  readonly operationalLabel: string;
  readonly inspection: {
    readonly statusLabel: string;
    readonly versions: readonly number[];
    readonly reportHref: string | null;
  } | null;
  readonly findings: readonly { readonly key: string; readonly code: string }[];
  readonly actions: string | null;
  readonly reviews: readonly { readonly key: string; readonly label: string; readonly tone: StatusTone }[];
};

export type CaseLogItem = {
  readonly id: string;
  readonly day: string;
  readonly dayIso: string;
  readonly title: string;
  readonly detail: string;
};

export type CaseTimelineStrings = {
  readonly title: string;
  readonly description: string;
  readonly emptyTitle: string;
  readonly emptyDescription: string;
  readonly visit: string;
  readonly planning: string;
  readonly operational: string;
  readonly inspection: string;
  readonly report: string;
  readonly findings: string;
  readonly actions: string;
  readonly review: string;
  readonly logLabel: string;
};

function visitDetail(visit: CaseVisit, strings: CaseTimelineStrings): ReactNode {
  const ins = visit.inspection;
  return (
    <Stack gap="tight">
      <p className={styles.line}>{strings.visit} <Link className={styles.link} href={visit.visitHref} prefetch={false}><bdi>{visit.visitShort}</bdi></Link></p>
      {ins ? (
        <p className={styles.line}>
          {strings.inspection} {ins.statusLabel}
          {ins.versions.map(n => <span key={n} className={styles.version}>v{n}</span>)}
          {ins.reportHref ? <><span aria-hidden="true">·</span> <Link className={styles.link} href={ins.reportHref} prefetch={false}>{strings.report}</Link></> : null}
        </p>
      ) : null}
      {visit.findings.length ? (
        <p className={styles.line}>{strings.findings} {visit.findings.map(f => <StatusPill key={f.key} tone="danger">{f.code}</StatusPill>)}</p>
      ) : null}
      {visit.actions ? <p className={styles.line}>{strings.actions} {visit.actions}</p> : null}
      {visit.reviews.length ? (
        <p className={styles.line}>{strings.review} {visit.reviews.map(r => <StatusPill key={r.key} tone={r.tone}>{r.label}</StatusPill>)}</p>
      ) : null}
    </Stack>
  );
}

export default function FactoryCaseTimeline({ visits, log, strings }: {
  visits: readonly CaseVisit[];
  log: readonly CaseLogItem[];
  strings: CaseTimelineStrings;
}) {
  const visitEvents: TimelineEvent[] = visits.map(v => ({
    id: v.id,
    dateTime: v.dayIso,
    time: v.day,
    title: v.kindLabel,
    meta: `${strings.planning} ${v.planningLabel} · ${strings.operational} ${v.operationalLabel}`,
    detail: visitDetail(v, strings),
  }));
  const logEvents: TimelineEvent[] = log.map(item => ({
    id: item.id,
    dateTime: item.dayIso,
    time: item.day,
    title: item.title,
    detail: item.detail,
  }));
  return (
    <Card as="section" labelledBy="timeline">
      <CardHeader level="h2" titleId="timeline" title={strings.title} description={strings.description} />
      <CardBody>
        <Stack gap="loose">
          {visits.length === 0
            ? <EmptyState icon="visits" title={strings.emptyTitle} description={strings.emptyDescription} />
            : <Timeline events={visitEvents} labelledBy="timeline" />}
          {log.length ? <Timeline events={logEvents} label={strings.logLabel} /> : null}
        </Stack>
      </CardBody>
    </Card>
  );
}
