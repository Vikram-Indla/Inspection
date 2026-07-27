"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./responsive.module.css";

export type EnforcementLibraryRow = {
  id: string;
  code: string;
  title: string;
  level: string;
  status: string;
  factoryId: string;
  factoryName: string;
  factoryCode: string;
  licenceNumber: string | null;
  region: string | null;
  city: string | null;
  inspectionId: string;
  visitId: string;
  inspectorName: string | null;
  recordedAt: string | null;
  actionForm: string | null;
  evidenceCount: number;
  custodyComplete: boolean;
  mappingVersion: string;
};

export type EnforcementLibraryStrings = {
  search: string;
  status: string;
  allStatuses: string;
  region: string;
  allRegions: string;
  export: string;
  exportUnavailable: string;
  licence: string;
  penalty: string;
  inspector: string;
  issueDate: string;
  actionForm: string;
  notConfigured: string;
  noActionForm: string;
  empty: string;
  close: string;
  factorySummary: string;
  inspectionSummary: string;
  violation: string;
  evidence: string;
  attachments: string;
  custody: string;
  custodyRecorded: string;
  custodyIncomplete: string;
  timeline: string;
  recorded: string;
  audit: string;
  mappingVersion: string;
  openFactory: string;
  requestedUnavailable: string;
};

const humanize = (value: string) => value.replaceAll("_", " ");

export default function EnforcementLibrary({
  rows,
  strings,
  locale,
  initialSelectedId,
}: {
  rows: EnforcementLibraryRow[];
  strings: EnforcementLibraryStrings;
  locale: string;
  initialSelectedId: string | null;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [region, setRegion] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    initialSelectedId && rows.some((row) => row.id === initialSelectedId)
      ? initialSelectedId
      : null,
  );
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>());

  const statuses = useMemo(() => [...new Set(rows.map((row) => row.status))].sort(), [rows]);
  const regions = useMemo(() => [...new Set(rows.map((row) => row.region).filter((value): value is string => Boolean(value)))].sort(), [rows]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(locale);
    return rows.filter((row) => {
      const matchesSearch = !needle || [
        row.title, row.code, row.factoryName, row.factoryCode, row.inspectionId, row.licenceNumber ?? "",
      ].some((value) => value.toLocaleLowerCase(locale).includes(needle));
      return matchesSearch && (!status || row.status === status) && (!region || row.region === region);
    });
  }, [locale, query, region, rows, status]);
  const selected = rows.find((row) => row.id === selectedId) ?? null;
  const requestedUnavailable = Boolean(initialSelectedId) && !rows.some((row) => row.id === initialSelectedId);

  useEffect(() => {
    if (!selected) return;
    closeButtonRef.current?.focus();
  }, [selected]);

  const closeDrawer = () => {
    const closingId = selected?.id ?? null;
    setSelectedId(null);
    requestAnimationFrame(() => {
      if (closingId) triggerRefs.current.get(closingId)?.focus();
    });
  };

  const formatDate = (value: string | null) => value
    ? new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", { dateStyle: "medium" }).format(new Date(value))
    : "—";

  return (
    <div className={styles.pageRoot}>
      <section className={styles.toolbar} aria-label={strings.search}>
        <label className={styles.searchField}>
          <span className="ax-sr-only">{strings.search}</span>
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            className="sq-input"
            placeholder={strings.search}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label className="sq-field">
          <span className="ax-sr-only">{strings.status}</span>
          <select className="sq-select" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">{strings.allStatuses}</option>
            {statuses.map((value) => <option key={value} value={value}>{humanize(value)}</option>)}
          </select>
        </label>
        <label className="sq-field">
          <span className="ax-sr-only">{strings.region}</span>
          <select className="sq-select" value={region} onChange={(event) => setRegion(event.target.value)}>
            <option value="">{strings.allRegions}</option>
            {regions.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <button className="btn btn-ghost btn-touch" type="button" disabled title={strings.exportUnavailable}>
          {strings.export}
        </button>
      </section>

      <section className={styles.records} aria-live="polite">
        {requestedUnavailable ? (
          <div className="sq-banner sq-banner--warning" role="status">
            <div>{strings.requestedUnavailable}</div>
          </div>
        ) : null}
        {filtered.map((row) => (
          <button
            key={row.id}
            type="button"
            className={styles.record}
            ref={(node) => {
              if (node) triggerRefs.current.set(row.id, node);
              else triggerRefs.current.delete(row.id);
            }}
            onClick={() => setSelectedId(row.id)}
            aria-haspopup="dialog"
          >
            <span className={styles.recordIdentity}>
              <strong>{row.title}</strong>
              <span>{row.factoryName} · <bdi dir="ltr">{row.inspectionId.slice(0, 8)}</bdi></span>
            </span>
            <span className="sq-lozenge sq-lozenge--info"><span aria-hidden="true">◆</span> {humanize(row.status)}</span>
            <span><small>{strings.licence}</small><bdi dir="ltr">{row.licenceNumber ?? "—"}</bdi></span>
            <span><small>{strings.penalty}</small>{strings.notConfigured}</span>
            <span><small>{strings.inspector}</small>{row.inspectorName ?? "—"}</span>
            <span><small>{strings.issueDate}</small><bdi dir="ltr">{formatDate(row.recordedAt)}</bdi></span>
            <span><small>{strings.actionForm}</small>{row.actionForm ?? strings.noActionForm}</span>
          </button>
        ))}
        {!filtered.length && !requestedUnavailable
          ? <div className="panel sq-state" role="status"><h2>{strings.empty}</h2></div>
          : null}
      </section>

      {selected ? (
        <>
          <button className={styles.backdrop} type="button" aria-label={strings.close} onClick={closeDrawer} />
          <aside
            className={styles.drawer}
            role="dialog"
            aria-modal="true"
            aria-labelledby="enforcement-record-title"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                closeDrawer();
              }
            }}
          >
            <header className={styles.drawerHeader}>
              <div>
                <h2 id="enforcement-record-title">{selected.title}</h2>
                <p>{selected.code} · <bdi dir="ltr">{selected.inspectionId}</bdi> · {selected.factoryName}</p>
              </div>
              <button ref={closeButtonRef} className="btn btn-ghost btn-touch" type="button" onClick={closeDrawer} aria-label={strings.close}>✕</button>
            </header>

            <section>
              <h3>{strings.factorySummary}</h3>
              <dl className={styles.definitionGrid}>
                <div><dt>{strings.factorySummary}</dt><dd>{selected.factoryName}</dd></div>
                <div><dt>{strings.licence}</dt><dd><bdi dir="ltr">{selected.licenceNumber ?? "—"}</bdi></dd></div>
                <div><dt>{strings.region}</dt><dd>{[selected.city, selected.region].filter(Boolean).join(", ") || "—"}</dd></div>
              </dl>
            </section>

            <section>
              <h3>{strings.inspectionSummary}</h3>
              <dl className={styles.definitionGrid}>
                <div><dt>{strings.inspectionSummary}</dt><dd><bdi dir="ltr">{selected.inspectionId}</bdi></dd></div>
                <div><dt>{strings.inspector}</dt><dd>{selected.inspectorName ?? "—"}</dd></div>
                <div><dt>{strings.issueDate}</dt><dd><bdi dir="ltr">{formatDate(selected.recordedAt)}</bdi></dd></div>
              </dl>
            </section>

            <section>
              <h3>{strings.violation}</h3>
              <dl className={styles.definitionGrid}>
                <div><dt>{strings.violation}</dt><dd>{selected.title} · <bdi dir="ltr">{selected.code}</bdi></dd></div>
                <div><dt>{strings.status}</dt><dd>{humanize(selected.status)}</dd></div>
                <div><dt>{strings.penalty}</dt><dd>{strings.notConfigured}</dd></div>
                <div><dt>{strings.actionForm}</dt><dd>{selected.actionForm ?? strings.noActionForm}</dd></div>
              </dl>
            </section>

            <section>
              <h3>{strings.evidence}</h3>
              <dl className={styles.definitionGrid}>
                <div><dt>{strings.attachments}</dt><dd>{selected.evidenceCount}</dd></div>
                <div><dt>{strings.custody}</dt><dd>{selected.custodyComplete ? strings.custodyRecorded : strings.custodyIncomplete}</dd></div>
              </dl>
            </section>

            <section>
              <h3>{strings.timeline}</h3>
              <dl className={styles.definitionGrid}>
                <div><dt>{strings.recorded}</dt><dd><bdi dir="ltr">{formatDate(selected.recordedAt)}</bdi></dd></div>
              </dl>
            </section>

            <section>
              <h3>{strings.audit}</h3>
              <dl className={styles.definitionGrid}>
                <div><dt>{strings.mappingVersion}</dt><dd><bdi dir="ltr">{selected.mappingVersion}</bdi></dd></div>
              </dl>
            </section>

            <a className="btn btn-primary btn-lg btn-touch" href={`/factories/${selected.factoryId}`}>{strings.openFactory}</a>
          </aside>
        </>
      ) : null}
    </div>
  );
}
