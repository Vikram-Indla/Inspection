import { Card, CardBody } from "@/components/saqeel/card/card";
import { Text } from "@/components/saqeel/type";
import type { FieldVisitsData } from "@/features/field-visits/queries";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import CalendarBoard from "./calendar-board";
import VisitsHeader from "./visits-header";
import VisitViewsNav from "./visit-views-nav";
import styles from "./visits.module.css";

export default function CalendarScreen({ data, locale, anchorNow }: {
  data: FieldVisitsData;
  locale: Locale;
  anchorNow: number;
}) {
  const copy = getMessages(locale).fieldVisits;
  const header = <VisitsHeader title={copy.calendarTitle} subtitle={copy.calendarScope} userId={data.userId} copy={copy} />;

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

  const calendarVisits = data.visits.filter(visit => visit.operationalState !== "new");

  return (
    <>
      {header}
      <div className={`${styles.page} ${styles.calendarShell}`}>
        <VisitViewsNav active="calendar" copy={copy} />
        <CalendarBoard visits={calendarVisits} locale={locale === "ar" ? "ar" : "en"} anchorNow={anchorNow} copy={copy} />
      </div>
    </>
  );
}
