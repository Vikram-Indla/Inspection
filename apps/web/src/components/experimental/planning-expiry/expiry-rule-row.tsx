"use client";

import type { ExpiryRuleRow as ExpiryRule } from "@/app/(app)/admin/planning/expiry/types";
import { Badge, Button, Text } from "@/components/experimental/linear";
import type { Locale } from "@/lib/i18n";
import { formatDate } from "@/lib/dates";
import { formatCount } from "@/i18n/numbers";
import ExpiryRuleEditor from "./expiry-rule-editor";
import { describeScope, describeNotify } from "./expiry-rule-summary";
import type { ExpiryCopy } from "./expiry-copy";
import styles from "./expiry-rule-row.module.css";

export function ColumnHead({ label }: { label: string }) {
  return (
    <th scope="col">
      <Text role="caption" tone="muted" weight="medium" as="span">{label}</Text>
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
        <td><Text role="caption" tone="strong" weight="medium" as="span" numeric>{versionLabel}</Text></td>
        <td><Badge label={row.enabled ? copy.status.live : copy.status.superseded} live={row.enabled} /></td>
        <td>
          <Text role="caption" as="span" numeric>
            {`${formatCount(row.offset_minutes, locale)} ${copy.units.minutes}`}
          </Text>
        </td>
        <td className={styles.reasonCell}><Text role="caption" as="span">{row.reason}</Text></td>
        <td><Text role="caption" tone="muted" as="span">{describeNotify(row, copy)}</Text></td>
        <td><Text role="caption" tone="muted" as="span">{describeScope(row.scope, copy)}</Text></td>
        <td><Text role="caption" tone="muted" as="span">{effective}</Text></td>
        {canConfigure ? (
          <td>
            <div className={styles.actions}>
              <Button variant="ghost" disabled={pending} onClick={onToggle}>
                {row.enabled ? copy.action.disable : copy.action.enable}
              </Button>
              <Button variant="quiet" disabled={pending} onClick={onEdit}>
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
