import { Card, CardBody } from "@/components/saqeel/card/card";
import { Text } from "@/components/saqeel/type";
import type { FieldVisitsData } from "@/features/field-visits/queries";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import VisitsHeader from "./visits-header";
import VisitViewsNav from "./visit-views-nav";
import VisitsList from "./visits-list";
import styles from "./visits.module.css";

export default function VisitsScreen({ data, locale, now }: {
  data: FieldVisitsData;
  locale: Locale;
  now: number;
}) {
  const messages = getMessages(locale);
  const copy = messages.fieldVisits;

  const header = <VisitsHeader title={copy.title} subtitle={copy.scope} userId={data.userId} copy={copy} />;

  if (data.failed) {
    return (
      <>
        {header}
        <div className={styles.page}>
          <Card as="section" role="alert">
            <CardBody>
              <Text tone="secondary">{copy.error}</Text>
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
        <VisitViewsNav active="list" copy={copy} />
        <VisitsList
          visits={data.visits}
          locale={locale === "ar" ? "ar" : "en"}
          now={now}
          copy={copy}
          enums={messages.visits.enum}
        />
      </div>
    </>
  );
}
