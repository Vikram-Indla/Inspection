"use client";

import type { ExpiryRuleRow as ExpiryRule } from "@/app/(app)/admin/planning/expiry/types";
import Button from "@/components/saqeel/button/button";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import { formatCount } from "@/i18n/numbers";
import { formatDate } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import ExpiryRuleEditor from "./expiry-rule-editor";
import { describeNotify, describeScope } from "./expiry-rule-summary";
import type { ExpiryCopy } from "./expiry-copy";
import styles from "./expiry-screen.module.css";

export function ColumnHead({ label }: { label: string }) {
  return (
    <th scope="col">
      <Text as="span" role="label" tone="muted">{label}</Text>
    </th>
  );
}

export default function ExpiryRuleRow({ row, ruleName, copy, locale, canConfigure, pending, columnCount, isEditing, versionLabel, onToggle, onEdit, onCloseEditor }: {
  row: ExpiryRule;
  ruleName: string;
  copy: ExpiryCopy;
  locale: Locale;
  canConfigure: boolean;
  pending: boolean;
  columnCount: number;
  isEditing: boolean;
  versionLabel: string;
  onToggle: () => void;
  onEdit: () => void;
  onCloseEditor: () => void;
}) {
  const effective = `${copy.units.effectiveFrom} ${formatDate(row.effective_from, locale)}${row.effective_to ? "" : ` · ${copy.units.ongoing}`}`;

  return (
    <>
      <tr className={row.enabled ? styles.liveRow : undefined}>
        <td><Text as="span" role="bodyStrong" numeric>{versionLabel}</Text></td>
        <td>
          <StatusPill tone={row.enabled ? "success" : "neutral"}>
            {row.enabled ? copy.status.live : copy.status.superseded}
          </StatusPill>
        </td>
        <td>
          <Text as="span" numeric>
            {`${formatCount(row.offset_minutes, locale)} ${copy.units.minutes}`}
          </Text>
        </td>
        <td className={styles.reasonCell}><Text as="span">{row.reason}</Text></td>
        <td><Text as="span" tone="muted">{describeNotify(row, copy)}</Text></td>
        <td><Text as="span" tone="muted">{describeScope(row.scope, copy)}</Text></td>
        <td><Text as="span" tone="muted">{effective}</Text></td>
        {canConfigure ? (
          <td>
            <div className={styles.actions}>
              <Button
                variant={row.enabled ? "secondary" : "primary"}
                size="sm"
                disabled={pending}
                label={row.enabled ? copy.action.disable : copy.action.enable}
                onClick={onToggle}
              >
                {row.enabled ? copy.action.disable : copy.action.enable}
              </Button>
              <Button
                variant="tertiary"
                size="sm"
                disabled={pending}
                label={isEditing ? copy.action.cancel : copy.action.edit}
                onClick={onEdit}
              >
                {isEditing ? copy.action.cancel : copy.action.edit}
              </Button>
            </div>
          </td>
        ) : null}
      </tr>
      {isEditing ? (
        <tr>
          <td className={styles.editorCell} colSpan={columnCount}>
            <ExpiryRuleEditor
              row={row}
              ruleType={row.rule_type}
              ruleName={ruleName}
              copy={copy}
              onClose={onCloseEditor}
            />
          </td>
        </tr>
      ) : null}
    </>
  );
}
