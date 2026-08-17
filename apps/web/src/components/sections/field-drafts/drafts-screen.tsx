import Button from "@/components/saqeel/button/button";
import { Card, CardBody } from "@/components/saqeel/card/card";
import Icon from "@/components/saqeel/icon/icon";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Heading, Text } from "@/components/saqeel/type";
import type { FieldDraftsData } from "@/features/field-drafts/queries";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import DraftList from "./draft-list";
import styles from "./drafts.module.css";

function Note({ icon, children }: { icon: "info" | "ai"; children: React.ReactNode }) {
  return (
    <div className={styles.note}>
      <Icon name={icon} size="sm" />
      <Text role="label" tone="secondary" as="p">{children}</Text>
    </div>
  );
}

export default function DraftsScreen({ data, locale }: {
  data: FieldDraftsData;
  locale: Locale;
}) {
  const copy = getMessages(locale).fieldDrafts;

  const header = (
    <header className={styles.header}>
      <Button href="/field" prefetch={false} variant="tertiary" size="sm" icon="previousPage">
        {copy.back}
      </Button>
      <div className={styles.headerIdentity}>
        <Heading level={1} visual="subheading">{copy.title}</Heading>
      </div>
      {data.failed ? null : (
        <StatusPill tone="warning" ping={false}>{`${data.drafts.length} ${copy.draftsWord}`}</StatusPill>
      )}
    </header>
  );

  if (data.failed) {
    return (
      <>
        {header}
        <div className={styles.page}>
          <Card as="section" role="alert">
            <CardBody>
              <Text tone="secondary">{copy.unavailable}</Text>
            </CardBody>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      {header}
      <div className={styles.page}>
        <Text tone="secondary">{copy.intro}</Text>

        <section aria-labelledby="field-drafts-heading" className={styles.list}>
          <Heading level={2} visual="label" id="field-drafts-heading">{copy.heading}</Heading>
          <DraftList
            userId={data.userId}
            serverDrafts={data.drafts}
            strings={{
              resume: copy.resume,
              localDraft: copy.localDraft,
              empty: copy.empty,
              storeKey: copy.storeKey,
              itemsQueued: copy.itemsQueued,
              syncPending: copy.syncPending,
              syncLocal: copy.syncLocal,
              loading: copy.loading,
              localUnavailable: copy.localUnavailable,
            }}
          />
        </section>

        <Note icon="info">{copy.offlineNote}</Note>
        <Note icon="ai">{copy.grounding}</Note>
      </div>
    </>
  );
}
