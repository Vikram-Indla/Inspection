"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import IconButton from "@/components/saqeel/icon-button/icon-button";
import Pagination from "@/components/saqeel/pagination/pagination";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import { provenanceLabel, provenanceTone, type AdminAuditMessages } from "@/features/admin-audit/strings";
import type { ReplayEvent } from "@/lib/audit-replay";
import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import { AuditCode } from "./audit-code";
import styles from "./audit.module.css";

const PAGE_SIZE = 25;

export default function AuditRecorder({ events, atStateCount, hasCorrelation, strings, locale }: {
  events: readonly ReplayEvent[];
  atStateCount: number;
  hasCorrelation: boolean;
  strings: AdminAuditMessages;
  locale: Locale;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>());
  const selected = events.find(event => event.id === selectedId) ?? null;
  const pageCount = Math.max(1, Math.ceil(events.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const shown = events.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const open = (id: string) => { setSelectedId(id); requestAnimationFrame(() => closeRef.current?.focus()); };
  const close = () => { const id = selectedId; setSelectedId(null); requestAnimationFrame(() => { if (id) triggerRefs.current.get(id)?.focus(); }); };
  const d = strings.detail;

  useEffect(() => {
    if (!selectedId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setSelectedId(null); requestAnimationFrame(() => triggerRefs.current.get(selectedId)?.focus()); }
      if (event.key === "Tab") { event.preventDefault(); closeRef.current?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedId]);

  return (
    <section id="audit-chronology" className={styles.stack}>
      <Card as="section">
        <CardHeader level="h2" title={strings.modes.recorder} />
        <CardBody>
          <ol className={styles.chronology}>
            {shown.map(event => (
              <li key={event.id} className={styles.eventRow}>
                <Text as="time" role="mono" tone="muted" dir="ltr">{formatDateTime(event.occurredAt, locale)}</Text>
                <span className={styles.eventBody}>
                  <Text as="span" role="bodyStrong" dir="ltr">{event.eventType}</Text>
                  <Text as="span" role="label" tone="muted" dir="ltr">{`${event.aggregateType} · ${event.aggregateId ?? "—"}`}</Text>
                  <span className={styles.eventPills}>
                    <StatusPill tone={provenanceTone(event)}>{provenanceLabel(event, strings)}</StatusPill>
                  </span>
                </span>
                <IconButton ref={el => { if (el) triggerRefs.current.set(event.id, el); }} icon="reveal" label={strings.recorder.detail} onClick={() => open(event.id)} />
              </li>
            ))}
          </ol>
          <Pagination page={safePage} pageCount={pageCount} pageSize={PAGE_SIZE} total={events.length} strings={strings.pagination} onPageChange={setPage} />
        </CardBody>
      </Card>

      <Card as="section">
        <CardHeader level="h3" title={strings.recorder.snapshot} />
        <CardBody>
          <Text tone="secondary">{atStateCount > 0 ? String(atStateCount) : strings.recorder.noEvent}</Text>
          <dl className={styles.factGrid}>
            <Text as="dt" role="label" tone="muted">{strings.recorder.governing}</Text><Text as="dd">{d.missing}</Text>
            <Text as="dt" role="label" tone="muted">{strings.recorder.correlation}</Text><Text as="dd">{hasCorrelation ? strings.terms.partial : d.missing}</Text>
            <Text as="dt" role="label" tone="muted">{strings.recorder.legal}</Text><Text as="dd"><StatusPill tone="warning">{strings.tags.policyHeld}</StatusPill></Text>
          </dl>
        </CardBody>
      </Card>

      {selected ? (
        <div className={styles.dialogBackdrop}>
          <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="audit-event-title">
            <Card as="section">
              <div className={styles.dialogClose}>
                <IconButton ref={closeRef} icon="dismiss" label={strings.recorder.close} onClick={close} />
              </div>
              <CardHeader level="h2" titleId="audit-event-title" title={<span dir="ltr">{selected.eventType}</span>} />
              <CardBody>
                <dl className={styles.factGrid}>
                  <Text as="dt" role="label" tone="muted">{d.source}</Text><Text as="dd">{selected.provenance}</Text>
                  <Text as="dt" role="label" tone="muted">{d.integrity}</Text><Text as="dd">{selected.integrityStatus}</Text>
                  <Text as="dt" role="label" tone="muted">{d.chain}</Text><Text as="dd">{selected.chainStatus}</Text>
                  <Text as="dt" role="label" tone="muted">{d.correlation}</Text><Text as="dd" dir="ltr">{selected.correlationId ?? d.missing}</Text>
                </dl>
                <div className={styles.diffGrid}>
                  <div className={styles.rowStack}><Text role="label" tone="muted">{d.before}</Text><AuditCode value={selected.beforeState} /></div>
                  <div className={styles.rowStack}><Text role="label" tone="muted">{d.after}</Text><AuditCode value={selected.afterState} /></div>
                </div>
                <div className={styles.rowStack}><Text role="label" tone="muted">{d.payload}</Text><AuditCode value={selected.payload} /></div>
              </CardBody>
            </Card>
          </div>
        </div>
      ) : null}
    </section>
  );
}
