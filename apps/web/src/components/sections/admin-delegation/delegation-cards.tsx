import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DefinitionList from "@/components/saqeel/definition-list/definition-list";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import {
  effectiveDelegationStatus,
  scopeLabel,
  statusLabel,
  type AdminDelegationMessages,
} from "@/features/admin-delegation/strings";
import type { DelegationRow, EffectiveStatus } from "@/features/admin-delegation/types";
import { formatDate, formatDateRange } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import DelegationRevokeForm from "./delegation-revoke-form";
import styles from "./delegation.module.css";

const STATUS_TONE: Readonly<Record<EffectiveStatus, StatusTone>> = {
  active: "success",
  expired: "warning",
  revoked: "neutral",
};

export default function DelegationCards({ rows, showRevoke, locale, strings }: {
  rows: readonly DelegationRow[];
  showRevoke: boolean;
  locale: Locale;
  strings: AdminDelegationMessages;
}) {
  const now = Date.now();

  return (
    <div className={styles.cardList}>
      {rows.map(row => {
        const status = effectiveDelegationStatus(row, now);
        const items = [
          { label: strings.card.scope, value: scopeLabel(row.scope, locale) },
          { label: strings.card.window, value: <Text as="span" role="mono" dir="ltr">{formatDateRange(row.starts_at, row.ends_at, locale)}</Text> },
          { label: strings.card.reason, value: row.reason },
          ...(row.revoked_at
            ? [{ label: strings.card.revokedNote, value: `${formatDate(row.revoked_at, locale)} — ${row.revoked_reason ?? ""}` }]
            : []),
        ];
        return (
          <Card as="section" key={row.id}>
            <CardHeader
              title={
                <span className={styles.pair}>
                  <Text as="span" role="bodyStrong">{row.delegator?.full_name ?? "—"}</Text>
                  <span className={styles.arrow} aria-hidden="true">→</span>
                  <Text as="span" role="bodyStrong">{row.delegate?.full_name ?? "—"}</Text>
                </span>
              }
              trailing={<StatusPill tone={STATUS_TONE[status]}>{statusLabel(status, strings)}</StatusPill>}
            />
            <CardBody>
              <DefinitionList items={items} />
              {showRevoke && status === "active" ? (
                <DelegationRevokeForm delegationId={row.id} strings={strings} />
              ) : null}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
