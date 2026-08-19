"use client";

import { useEffect, useState } from "react";
import { Text } from "@/components/saqeel/type";
import type { CompletedHistoryRecord } from "@/lib/field/completed-history";
import { localForUser } from "@/lib/offline";
import type { Messages } from "@/i18n/messages";
import CompletedCard from "./completed-card";
import styles from "./completed.module.css";

export default function CompletedHistoryList({ userId, records, liveReadFailed, locale, copy }: {
  userId: string;
  records: readonly CompletedHistoryRecord[];
  liveReadFailed: boolean;
  locale: "en" | "ar";
  copy: Messages["fieldCompleted"];
}) {
  const [visible, setVisible] = useState<readonly CompletedHistoryRecord[]>(records);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    const store = localForUser(userId);
    if (!liveReadFailed) {
      void store.cacheCompletedHistory([...records]);
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

  const dateOf = (value: string) => new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh",
  }).format(new Date(value));

  if (visible.length === 0) {
    return <Text tone="muted" align="center" live="status">{liveReadFailed ? copy.unavailable : copy.empty}</Text>;
  }

  return (
    <>
      {fromCache ? <Text tone="warning" live="status">{copy.cached}</Text> : null}
      <div className={styles.cards}>
        {visible.map(record => (
          <CompletedCard key={record.inspectionId} record={record} dateLabel={dateOf(record.submittedAt)} copy={copy} />
        ))}
      </div>
    </>
  );
}
