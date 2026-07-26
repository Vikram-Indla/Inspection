"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatDate } from "@/lib/dates";
import { localForUser, type CachedSubmittedReport } from "@/lib/offline";
import styles from "./reports.module.css";

type Strings = {
  visitRecords: string;
  priorVisits: string;
  recordsHint: string;
  visitsHint: string;
  version: string;
  signed: string;
  submitted: string;
  open: string;
  unavailableTitle: string;
  unavailableBody: string;
  close: string;
  documentTitle: string;
  submittedAt: string;
  inspector: string;
  answers: string;
  notes: string;
  summary: string;
  downloadPdf: string;
  downloadUnavailable: string;
  print: string;
  priorUnavailableTitle: string;
  priorUnavailableBody: string;
  noValue: string;
};

function validCachedReport(value: CachedSubmittedReport): boolean {
  return value.schema === "saqeel-submitted-report-v1"
    && Boolean(value.inspectionId)
    && Boolean(value.submissionVersionId)
    && Number.isFinite(value.versionNumber)
    && (value.submittedAt === null || Boolean(value.submittedAt));
}

export default function ReportsLibrary({
  userId,
  initialReports,
  locale,
  strings,
}: {
  userId: string;
  initialReports: CachedSubmittedReport[];
  locale: "en" | "ar";
  strings: Strings;
}) {
  const [reports, setReports] = useState(initialReports);
  const [online, setOnline] = useState(true);
  const [opened, setOpened] = useState<CachedSubmittedReport | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [tab, setTab] = useState<"records" | "visits">("records");

  useEffect(() => {
    const local = localForUser(userId);
    let active = true;
    const refreshConnectivity = () => setOnline(navigator.onLine);
    refreshConnectivity();
    window.addEventListener("online", refreshConnectivity);
    window.addEventListener("offline", refreshConnectivity);
    void (async () => {
      for (const report of initialReports) {
        if (validCachedReport(report)) await local.cacheSubmittedReport(report);
      }
      const cached = await local.getSubmittedReports();
      if (!active) return;
      const merged = new Map(cached.filter(validCachedReport).map(report => [report.inspectionId, report]));
      for (const report of initialReports) merged.set(report.inspectionId, report);
      setReports([...merged.values()].sort((a, b) => (b.submittedAt ?? b.cachedAt).localeCompare(a.submittedAt ?? a.cachedAt)));
    })();
    return () => {
      active = false;
      window.removeEventListener("online", refreshConnectivity);
      window.removeEventListener("offline", refreshConnectivity);
    };
  }, [initialReports, userId]);

  const snapshot = useMemo(() => {
    if (!opened || typeof opened.snapshot !== "object" || opened.snapshot === null) return null;
    return opened.snapshot as {
      answers?: Record<string, unknown>;
      notes?: Record<string, unknown>;
      document_url?: unknown;
    };
  }, [opened]);
  const documentUrl = typeof snapshot?.document_url === "string" && snapshot.document_url.trim()
    ? snapshot.document_url
    : null;

  async function openOffline(inspectionId: string) {
    const cached = await localForUser(userId).getSubmittedReport(inspectionId);
    if (!cached || !validCachedReport(cached)) {
      setUnavailable(true);
      setOpened(null);
      return;
    }
    setUnavailable(false);
    setOpened(cached);
  }

  return (
    <>
      <div className={styles.segment} role="tablist">
        <button type="button" role="tab" aria-selected={tab === "records"} onClick={() => { setTab("records"); setOpened(null); setUnavailable(false); }}>{strings.visitRecords}</button>
        <button type="button" role="tab" aria-selected={tab === "visits"} onClick={() => { setTab("visits"); setOpened(null); setUnavailable(false); }}>{strings.priorVisits}</button>
      </div>

      {tab === "records" ? (
        <div className={styles.tabPanel} role="tabpanel">
          <p className={styles.hint}>{strings.recordsHint}</p>
          <section className={styles.card} aria-label={strings.submitted}>
            {reports.map(report => {
              const acknowledgement = report.acknowledgement as { signed?: boolean; signed_at?: string; signature_data_url?: string } | null;
              const acknowledged = Boolean(acknowledgement?.signed || acknowledgement?.signed_at || acknowledgement?.signature_data_url);
              return (
                <Link
                  key={report.inspectionId}
                  className={styles.row}
                  href={`/field/reports/${report.inspectionId}`}
                  prefetch={false}
                  onClick={event => {
                    if (online) return;
                    event.preventDefault();
                    void openOffline(report.inspectionId);
                  }}
                >
                  <span className={styles.icon} aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M8 2h6l4 4v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
                      <path d="M14 2v4h4" />
                    </svg>
                  </span>
                  <span className={styles.copy}>
                    {report.factoryName ? <strong>{report.factoryName}</strong> : null}
                    <span>
                      {report.factoryCode ? <><bdi>{report.factoryCode}</bdi>{" · "}</> : null}
                      {report.submittedAt ? formatDate(report.submittedAt, locale) : strings.noValue}
                      {" · "}{strings.version} <bdi>{report.versionNumber}</bdi>
                    </span>
                    {report.inspectorName ? <span>{report.inspectorName}</span> : null}
                  </span>
                  <span className={`badge ${acknowledged ? "badge-completed" : "badge-warning"}`}>
                    {acknowledged ? strings.signed : strings.submitted}
                  </span>
                  <span className={styles.open}>{strings.open}<span aria-hidden="true">›</span></span>
                </Link>
              );
            })}
          </section>
        </div>
      ) : (
        <div className={styles.empty} role="tabpanel">
          <strong>{strings.priorUnavailableTitle}</strong>
          <span>{strings.priorUnavailableBody}</span>
        </div>
      )}

      {(opened || unavailable) && (
        <section className={styles.detailCard} aria-label={strings.documentTitle}>
          <div className={styles.detailHead}>
            <div>
              <span className={styles.detailLabel}>{strings.documentTitle}</span>
              {opened?.factoryName ? <h2>{opened.factoryName}</h2> : null}
            </div>
            {opened ? <span className="badge badge-completed">{strings.signed}</span> : null}
            <button type="button" className="btn btn-icon btn-ghost" aria-label={strings.close} onClick={() => { setOpened(null); setUnavailable(false); }}>×</button>
          </div>
          {unavailable ? (
            <div className={styles.unavailable} role="status"><strong>{strings.unavailableTitle}</strong><p>{strings.unavailableBody}</p></div>
          ) : opened ? (
            <>
              <div className={styles.document}>
                <dl>
                  <div><dt>{strings.submittedAt}</dt><dd>{opened.submittedAt ? formatDate(opened.submittedAt, locale) : strings.noValue}</dd></div>
                  <div><dt>{strings.version}</dt><dd><bdi>{opened.versionNumber}</bdi></dd></div>
                  <div><dt>{strings.inspector}</dt><dd>{opened.inspectorName ?? strings.noValue}</dd></div>
                </dl>
                {snapshot?.answers && Object.keys(snapshot.answers).length ? (
                  <section><h3>{strings.answers}</h3>
                    <dl>{Object.entries(snapshot.answers).map(([key, value]) => (
                      <div key={key}><dt><bdi>{key}</bdi></dt><dd>{value == null ? strings.noValue : String(value)}</dd></div>
                    ))}</dl>
                  </section>
                ) : null}
                {snapshot?.notes && Object.keys(snapshot.notes).length ? (
                  <section><h3>{strings.notes}</h3>
                    <dl>{Object.entries(snapshot.notes).map(([key, value]) => (
                      <div key={key}><dt><bdi>{key}</bdi></dt><dd>{value == null ? strings.noValue : String(value)}</dd></div>
                    ))}</dl>
                  </section>
                ) : null}
              </div>
              <div className={styles.detailActions}>
                {documentUrl ? (
                  <a className="btn btn-secondary" href={documentUrl} download>{strings.downloadPdf}</a>
                ) : (
                  <button type="button" className="btn btn-secondary" disabled title={strings.downloadUnavailable}>{strings.downloadPdf}</button>
                )}
                <button type="button" className="btn btn-secondary" onClick={() => window.print()}>{strings.print}</button>
              </div>
            </>
          ) : null}
        </section>
      )}
    </>
  );
}
