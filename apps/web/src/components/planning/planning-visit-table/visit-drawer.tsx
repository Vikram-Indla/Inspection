"use client";

import IconButton from "@/components/saqeel/icon-button/icon-button";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Heading, Text } from "@/components/saqeel/type";
import type { PlanningVisitView } from "@/features/planning/view";
import styles from "./visit-drawer.module.css";

export type VisitDrawerStrings = {
  close: string;
  openVisit: string;
  groups: { factory: string; planning: string; inspector: string; timeline: string; ai: string };
  fields: Record<string, string>;
  notConfigured: string;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.fieldRow}>
      <Text as="dt" tone="muted">{label}</Text>
      <dd className={styles.fieldValue}><Text as="span">{value}</Text></dd>
    </div>
  );
}

export default function VisitDrawer({ visit, strings, onClose }: {
  visit: PlanningVisitView;
  strings: VisitDrawerStrings;
  onClose: () => void;
}) {
  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <aside
        className={styles.root}
        role="dialog"
        aria-modal="true"
        aria-label={visit.factory}
        onKeyDown={event => { if (event.key === "Escape") onClose(); }}
      >
        <header className={styles.head}>
          <div className={styles.headText}>
            <Heading level={2}>{visit.factory}</Heading>
            <p className={styles.subtitle}>
              <Text as="span" tone="muted" numeric>{visit.reference}</Text>
              <StatusPill tone={visit.statusTone}>{visit.statusLabel}</StatusPill>
            </p>
          </div>
          <IconButton icon="dismiss" label={strings.close} onClick={onClose} autoFocus />
        </header>
        <div className={styles.body}>
          <section className={styles.group}>
            <Heading level={3} visual="subheading" tone="muted">{strings.groups.factory}</Heading>
            <dl className={styles.fields}>
              <Row label={strings.fields.cr} value={visit.cr} />
              <Row label={strings.fields.license} value={visit.license} />
              <Row label={strings.fields.authority} value={visit.authority} />
              <Row label={strings.fields.risk} value={visit.risk} />
            </dl>
          </section>
          <section className={styles.group}>
            <Heading level={3} visual="subheading" tone="muted">{strings.groups.planning}</Heading>
            <dl className={styles.fields}>
              <Row label={strings.fields.visitType} value={visit.visitType} />
              <Row label={strings.fields.window} value={visit.window} />
              <Row label={strings.fields.status} value={visit.statusLabel} />
              <Row label={strings.fields.lastUpdated} value={visit.lastUpdated} />
            </dl>
          </section>
          <section className={styles.group}>
            <Heading level={3} visual="subheading" tone="muted">{strings.groups.inspector}</Heading>
            <dl className={styles.fields}>
              <Row label={strings.fields.inspector} value={visit.inspector} />
            </dl>
          </section>
          <section className={styles.group}>
            <Heading level={3} visual="subheading" tone="muted">{strings.groups.timeline}</Heading>
            <dl className={styles.fields}>
              <Row label={strings.fields.created} value={visit.created} />
              <Row label={strings.fields.statusChanged} value={visit.lastUpdated} />
            </dl>
          </section>
          <section className={styles.group}>
            <Heading level={3} visual="subheading" tone="muted">{strings.groups.ai}</Heading>
            <Text tone="muted">{strings.notConfigured}</Text>
          </section>
        </div>
        <footer className={styles.foot}>
          <a className={styles.openLink} href={visit.visitHref}><Text as="span" role="label" tone="inherit">{strings.openVisit}</Text></a>
        </footer>
      </aside>
    </>
  );
}
