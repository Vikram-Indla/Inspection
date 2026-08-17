import MyTasksSyncStatus from "./my-tasks-sync-status";
import a11y from "@/components/field/field-a11y.module.css";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import { Heading, Text } from "@/components/saqeel/type";
import type { MyTasksData } from "@/features/field-my-tasks/queries";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import MyTasksDetail from "./my-tasks-detail";
import MyTasksList from "./my-tasks-list";
import styles from "./my-tasks.module.css";

export default function MyTasksScreen({ data, locale }: {
  data: MyTasksData;
  locale: Locale;
}) {
  const messages = getMessages(locale);
  const copy = messages.fieldMyTasks;
  const enums = messages.visits.enum;

  const header = (
    <header className={styles.header}>
      {data.selectedId ? (
        <Button href="/field/my-tasks" prefetch={false} variant="tertiary" size="sm" icon="previousPage">
          {copy.back}
        </Button>
      ) : null}
      <div className={styles.headerIdentity}>
        <Heading level={1} visual="subheading">{copy.title}</Heading>
        <Text role="label" tone="secondary" as="p">{copy.subtitle}</Text>
      </div>
      <div className={styles.headerControls}>
        <MyTasksSyncStatus
          onlineLabel={copy.header.online}
          offlineLabel={copy.header.offline}
          syncLabel={copy.header.syncNow}
          syncingLabel={copy.header.syncing}
        />
      </div>
    </header>
  );

  if (data.failed) {
    return (
      <>
        {header}
        <div className={`${styles.grid} ${a11y.scope}`}>
          <Card as="section" role="alert">
            <CardHeader level="h2" title={copy.unavailable} />
            <CardBody>
              <Text tone="secondary">{copy.detail.selectBody}</Text>
            </CardBody>
          </Card>
        </div>
      </>
    );
  }

  const pane = data.selectedId ? styles.paneDetail : styles.paneList;

  return (
    <>
      {header}
      <div className={`${styles.grid} ${pane} ${a11y.scope}`}>
        <MyTasksList
          tasks={data.tasks}
          selectedId={data.selectedId}
          alertSourceAvailable={data.alertSourceAvailable}
          locale={locale === "ar" ? "ar" : "en"}
          renderNow={data.renderNow}
          windowStartLabels={data.windowStartLabels}
          copy={copy}
        />

        {data.detail ? (
          <MyTasksDetail detail={data.detail} copy={copy} enums={enums} />
        ) : (
          <Card as="section" labelledBy="my-tasks-select">
            <CardHeader level="h2" titleId="my-tasks-select" title={copy.detail.selectPrompt} />
            <CardBody>
              <Text tone="secondary">{copy.detail.selectBody}</Text>
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}
