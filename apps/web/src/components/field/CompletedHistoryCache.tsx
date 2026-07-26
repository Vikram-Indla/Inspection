"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { localForUser } from "@/lib/offline";
import {
  completionReference,
  summarizeSnapshot,
  type CompletedHistoryRecord,
} from "@/lib/field/completed-history";

type Labels = {
  cached: string;
  empty: string;
  unavailable: string;
  version: string;
  submitted: string;
  findings: string;
  evidence: string;
  open: string;
};

export default function CompletedHistoryCache({
  userId,
  records,
  liveReadFailed,
  locale,
  labels,
}: {
  userId: string;
  records: CompletedHistoryRecord[];
  liveReadFailed: boolean;
  locale: string;
  labels: Labels;
}) {
  const [visible, setVisible] = useState(records);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    const store = localForUser(userId);
    if (!liveReadFailed) {
      void store.cacheCompletedHistory(records);
      setVisible(records);
      setFromCache(false);
      return;
    }
    void store.getCompletedHistory().then(cached => {
      if (Array.isArray(cached)) {
        setVisible(cached as CompletedHistoryRecord[]);
        setFromCache(true);
      }
    });
  }, [liveReadFailed, records, userId]);

  const dt = (value: string) => new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Riyadh",
  }).format(new Date(value));

  if (!visible.length) {
    return <div className="empty"><div className="empty-title">{liveReadFailed ? labels.unavailable : labels.empty}</div></div>;
  }

  return (
    <>
      {fromCache && <div className="alert alert-warning" role="status">{labels.cached}</div>}
      <div style={{ display: "grid", gap: 10 }}>
        {visible.map(record => {
          const summary = summarizeSnapshot(record.snapshot);
          return (
            <Link key={record.inspectionId} href={`/field/completed/${record.inspectionId}`} prefetch={false}
              style={{ color: "inherit", textDecoration: "none", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: 14, background: "var(--surface-primary)", display: "grid", gap: 9 }}>
              <div style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <strong><bdi>{record.factoryName}</bdi></strong>
                  <div className="t-caption"><span className="id-code">{completionReference(record)}</span>{record.factoryCode ? ` · ${record.factoryCode}` : ""}</div>
                </div>
                <span className="badge badge-compliant">{labels.version} {record.versionNumber}</span>
              </div>
              <div className="t-caption">{labels.submitted}: <span className="id-code">{dt(record.submittedAt)}</span></div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12 }}>
                <span>{labels.findings}: <strong>{summary.findings}</strong></span>
                <span>{labels.evidence}: <strong>{summary.evidence}</strong></span>
                <span style={{ marginInlineStart: "auto", color: "var(--action-primary)", fontWeight: 600 }}>{labels.open}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
