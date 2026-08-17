"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardHeader } from "@/components/saqeel/card/card";
import Icon from "@/components/saqeel/icon/icon";
import { ListRow, ListRows } from "@/components/saqeel/list-row/list-row";
import SegmentedControl from "@/components/saqeel/segmented-control/segmented-control";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Mono, Text } from "@/components/saqeel/type";
import type { Messages } from "@/i18n/messages";
import { formatDate } from "@/lib/dates";
import { localForUser, type CachedSubmittedReport } from "@/lib/offline";
import ReportDocument from "./report-document";
import styles from "./reports.module.css";

type Tab = "records" | "visits";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function validCachedReport(value: CachedSubmittedReport): boolean {
  return value.schema === "saqeel-submitted-report-v1"
    && Boolean(value.inspectionId)
    && Boolean(value.submissionVersionId)
    && Number.isFinite(value.versionNumber)
    && (value.submittedAt === null || Boolean(value.submittedAt));
}

function acknowledged(report: CachedSubmittedReport): boolean {
  if (!isRecord(report.acknowledgement)) return false;
  const { signed, signed_at, signature_data_url } = report.acknowledgement;
  return Boolean(signed || signed_at || signature_data_url);
}

export default function ReportsLibrary({ userId, initialReports, locale, copy }: {
  userId: string;
  initialReports: readonly CachedSubmittedReport[];
  locale: "en" | "ar";
  copy: Messages["fieldReports"];
}) {
  const [reports, setReports] = useState<readonly CachedSubmittedReport[]>(initialReports);
  const [online, setOnline] = useState(true);
  const [opened, setOpened] = useState<CachedSubmittedReport | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [tab, setTab] = useState<Tab>("records");
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    const local = localForUser(userId);
    const refreshConnectivity = () => setOnline(navigator.onLine);
    refreshConnectivity();
    window.addEventListener("online", refreshConnectivity);
    window.addEventListener("offline", refreshConnectivity);
    void (async () => {
      for (const report of initialReports) {
        if (validCachedReport(report)) await local.cacheSubmittedReport(report);
      }
      const cached = await local.getSubmittedReports();
      if (cancelled.current) return;
      const merged = new Map(cached.filter(validCachedReport).map(report => [report.inspectionId, report]));
      for (const report of initialReports) merged.set(report.inspectionId, report);
      setReports([...merged.values()].sort((a, b) =>
        (b.submittedAt ?? b.cachedAt).localeCompare(a.submittedAt ?? a.cachedAt)));
    })();
    return () => {
      cancelled.current = true;
      window.removeEventListener("online", refreshConnectivity);
      window.removeEventListener("offline", refreshConnectivity);
    };
  }, [initialReports, userId]);

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

  function selectTab(next: Tab) {
    setTab(next);
    setOpened(null);
    setUnavailable(false);
  }

  return (
    <>
      <SegmentedControl
        items={[
          { value: "records", label: copy.tabs.records },
          { value: "visits", label: copy.tabs.visits },
        ]}
        value={tab}
        label={copy.title}
        onChange={selectTab}
      />

      {tab === "records" ? (
        <div className={styles.panel}>
          <Text role="label" tone="secondary" as="p">{copy.tabs.recordsHint}</Text>
          <ListRows label={copy.tabs.records}>
            {reports.map(report => (
              <ListRow
                key={report.inspectionId}
                href={online ? `/field/reports/${report.inspectionId}` : undefined}
                pressed={opened?.inspectionId === report.inspectionId}
                onSelect={online ? undefined : () => void openOffline(report.inspectionId)}
                leading={<Icon name="forms" size="md" />}
                title={report.factoryName ?? copy.noValue}
                description={
                  <>
                    {report.factoryCode ? <><Mono as="span">{report.factoryCode}</Mono>{" · "}</> : null}
                    {report.submittedAt ? formatDate(report.submittedAt, locale) : copy.noValue}
                    {" · "}{copy.version} <Mono as="span">{report.versionNumber}</Mono>
                    {report.inspectorName ? <>{" · "}{report.inspectorName}</> : null}
                  </>
                }
                badge={
                  <StatusPill tone={acknowledged(report) ? "success" : "warning"} ping={false}>
                    {acknowledged(report) ? copy.signed : copy.submittedBadge}
                  </StatusPill>
                }
                trailing={<Text role="label" tone="accent" as="span">{copy.open}</Text>}
              />
            ))}
          </ListRows>
        </div>
      ) : (
        <Card as="section">
          <CardHeader title={copy.prior.title} description={copy.prior.body} />
        </Card>
      )}

      {opened || unavailable ? (
        <ReportDocument
          report={opened}
          unavailable={unavailable}
          locale={locale}
          copy={copy}
          onClose={() => { setOpened(null); setUnavailable(false); }}
        />
      ) : null}
    </>
  );
}
