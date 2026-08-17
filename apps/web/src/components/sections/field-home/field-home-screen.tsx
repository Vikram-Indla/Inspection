import { FieldScopeProvider } from "@/components/field/FieldScopeProvider";
import type { FieldHomeData } from "@/features/field-home/queries";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import FieldDailyBrief from "./field-daily-brief";
import FieldHomeHeader from "./field-home-header";
import FieldHomeUnavailable from "./field-home-unavailable";
import FieldInsightStrip from "./field-insight-strip";
import FieldMissionMetrics from "./field-mission-metrics";
import FieldOperationsMap from "./field-operations-map";
import FieldPendingAttention from "./field-pending-attention";
import FieldQuickActions from "./field-quick-actions";
import FieldSchedule from "./field-schedule";
import styles from "./field-home.module.css";

export default function FieldHomeScreen({ data, locale }: {
  data: FieldHomeData;
  locale: Locale;
}) {
  const messages = getMessages(locale);
  const copy = messages.fieldHome;
  const enums = messages.visits.enum;
  const body = data.body;

  return (
    <>
      <FieldHomeHeader data={data} copy={copy} />

      {body.kind === "unavailable" ? (
        <div className={styles.page}>
          <FieldHomeUnavailable brief={body.brief} copy={copy} />
        </div>
      ) : (
        <FieldScopeProvider>
          <div className={styles.page}>
            <FieldMissionMetrics
              daily={body.daily}
              weekly={body.weekly}
              returned={body.returnedCount}
              drafts={body.draftCount}
              copy={copy}
            />

            <FieldDailyBrief
              daily={body.brief.daily}
              weekly={body.brief.weekly}
              recommendation={body.recommendation}
              copy={copy}
            />

            <FieldOperationsMap body={body} copy={copy} enums={enums} region={data.region} />

            <FieldSchedule rows={body.schedule} copy={copy} enums={enums} />

            <FieldPendingAttention
              returned={body.returnedCount}
              drafts={body.draftCount}
              copy={copy}
            />

            <FieldInsightStrip
              today={body.daily.inspections}
              remaining={body.daily.remaining}
              pending={body.returnedCount + body.draftCount}
              progressPct={body.progressPct}
              copy={copy}
            />

            <FieldQuickActions activeInspection={body.activeInspection} copy={copy} />
          </div>
        </FieldScopeProvider>
      )}
    </>
  );
}
