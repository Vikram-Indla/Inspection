import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import { Heading, Text } from "@/components/saqeel/type";
import type { SubmittedReportsData } from "@/features/field-reports/queries";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import ReportsConnectivity from "./reports-connectivity";
import ReportsLibrary from "./reports-library";
import styles from "./reports.module.css";

export default function ReportsScreen({ data, locale }: {
  data: SubmittedReportsData;
  locale: Locale;
}) {
  const copy = getMessages(locale).fieldReports;
  const empty = data.reports.length === 0 && !data.liveReadFailed;

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
        <ReportsConnectivity offline={copy.offline} weak={copy.weak} />
        {data.liveReadFailed ? (
          <Card as="section" role="alert">
            <CardBody>
              <Text tone="secondary">{copy.error}</Text>
            </CardBody>
          </Card>
        ) : null}
        {empty ? (
          <Card as="section">
            <CardHeader title={copy.empty.title} description={copy.empty.body} />
          </Card>
        ) : (
          <ReportsLibrary
            userId={data.userId}
            initialReports={data.reports}
            locale={locale === "ar" ? "ar" : "en"}
            copy={copy}
          />
        )}
      </div>
    </>
  );
}
