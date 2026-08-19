import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import { measureLabel, type EnforcementRecommendationsMessages } from "@/features/admin-enforcement-recommendations/strings";
import type { PendingRow } from "@/features/admin-enforcement-recommendations/types";
import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import EnforcementDecideForm from "./enforcement-decide-form";
import styles from "./enforcement-recs.module.css";

export default function EnforcementRecommendationCard({ row, canDecide, strings, locale }: {
  row: PendingRow;
  canDecide: boolean;
  strings: EnforcementRecommendationsMessages;
  locale: Locale;
}) {
  const location = [
    [row.factory?.city, row.factory?.region].filter(Boolean).join(", "),
    row.factory?.factory_code ?? strings.unregistered,
  ].filter(Boolean).join(" · ");

  return (
    <Card as="article">
      <CardHeader
        title={<span className={styles.identity}>{row.factory?.name ?? row.factory_id}</span>}
        description={location}
        trailing={<StatusPill tone="warning">{`${strings.measureLabel}: ${measureLabel(row.recommended_action, strings)}`}</StatusPill>}
      />
      <CardBody>
        {row.recommendation_notes ? <Text tone="secondary">{row.recommendation_notes}</Text> : null}
        <Text role="mono" tone="muted" dir="ltr">{formatDateTime(row.recommended_at, locale)}</Text>
        {canDecide
          ? <EnforcementDecideForm id={row.id} strings={strings} />
          : <Text tone="muted">{strings.awaitingDecider}</Text>}
      </CardBody>
    </Card>
  );
}
