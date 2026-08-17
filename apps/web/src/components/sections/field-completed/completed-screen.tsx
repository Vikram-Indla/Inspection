import Button from "@/components/saqeel/button/button";
import { Heading, Text } from "@/components/saqeel/type";
import type { CompletedHistoryData } from "@/features/field-completed/queries";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import CompletedHistoryList from "./completed-history-list";
import LockedNotice from "./locked-notice";
import styles from "./completed.module.css";

export default function CompletedScreen({ data, locale }: {
  data: CompletedHistoryData;
  locale: Locale;
}) {
  const copy = getMessages(locale).fieldCompleted;

  return (
    <>
      <header className={styles.header}>
        <Button href="/field" prefetch={false} variant="tertiary" size="sm" icon="previousPage">
          {copy.back}
        </Button>
        <div className={styles.headerIdentity}>
          <Heading level={1} visual="subheading">{copy.title}</Heading>
          <Text role="label" tone="secondary" as="p">{copy.subtitle}</Text>
        </div>
      </header>

      <div className={styles.page}>
        <LockedNotice>{copy.locked}</LockedNotice>
        <CompletedHistoryList
          userId={data.userId}
          records={data.records}
          liveReadFailed={data.liveReadFailed}
          locale={locale === "ar" ? "ar" : "en"}
          copy={copy}
        />
      </div>
    </>
  );
}
