"use client";

import { useState, useTransition } from "react";
import { setRuleEnabled, type ExpiryResult } from "@/app/(app)/admin/planning/expiry/actions";
import type { ExpiryRuleRow as ExpiryRule } from "@/app/(app)/admin/planning/expiry/types";
import type { ExpiryRuleGroup } from "@/features/admin-planning-expiry/queries";
import { Button, Card, Heading, Notice, Text } from "@/components/experimental/linear";
import { fill } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import { formatCount } from "@/i18n/numbers";
import ExpiryRuleEditor from "./expiry-rule-editor";
import ExpiryRuleRow, { ColumnHead } from "./expiry-rule-row";
import type { ExpiryCopy } from "./expiry-copy";
import styles from "./expiry-rule-section.module.css";

export default function ExpiryRuleSection({ group, copy, locale, canConfigure }: {
  group: ExpiryRuleGroup;
  copy: ExpiryCopy;
  locale: Locale;
  canConfigure: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState<ExpiryResult>({});
  const [pending, startTransition] = useTransition();

  const ruleName = copy.ruleType[group.ruleType as keyof typeof copy.ruleType] ?? group.ruleType;
  const headingId = `expiry-${group.ruleType}`;
  const columnCount = canConfigure ? 8 : 7;

  const toggle = (row: ExpiryRule) => {
    const form = new FormData();
    form.set("rule_id", row.id);
    form.set("rule_type", row.rule_type);
    form.set("enable", row.enabled ? "0" : "1");
    setFeedback({});
    startTransition(async () => setFeedback(await setRuleEnabled(form)));
  };

  return (
    <Card as="section" labelledBy={headingId}>
      <div className={styles.section}>
        <div className={styles.header}>
          <div className={styles.heading}>
            <Heading level={2} role="bodyLg" id={headingId}>{ruleName}</Heading>
            {group.live ? (
              <Text role="caption" tone="muted" as="span">
                {fill(copy.status.liveSummary, { version: formatCount(group.live.version, locale) })}
              </Text>
            ) : null}
          </div>
          {canConfigure ? (
            <Button
              variant="ghost"
              disabled={pending}
              onClick={() => { setEditingId(null); setCreating(!creating); }}
            >
              {copy.action.newVersion}
            </Button>
          ) : null}
        </div>

        {feedback.ok ? (
          <Notice tone="accent" live="status"><Text role="caption">{feedback.ok}</Text></Notice>
        ) : null}
        {feedback.error ? (
          <Notice tone="danger" live="alert"><Text role="caption">{feedback.error}</Text></Notice>
        ) : null}
        {group.versions.length > 0 && !group.live ? (
          <Notice tone="accent">
            <div className={styles.stack}>
              <Text role="caption" tone="strong" weight="medium">{copy.status.noneLive}</Text>
              <Text role="caption" tone="muted">{copy.status.noneLiveNote}</Text>
            </div>
          </Notice>
        ) : null}

        {creating ? (
          <ExpiryRuleEditor
            ruleType={group.ruleType}
            ruleName={ruleName}
            copy={copy}
            onClose={() => setCreating(false)}
          />
        ) : null}

        {group.versions.length === 0 ? (
          <Text role="caption" tone="muted">{copy.empty.body}</Text>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption>{fill(copy.a11y.versionsTable, { rule: ruleName })}</caption>
              <colgroup>
                <col className={styles.colVersion} />
                <col className={styles.colStatus} />
                <col className={styles.colOffset} />
                <col className={canConfigure ? styles.colReason : styles.colReasonWide} />
                <col className={styles.colNotify} />
                <col className={styles.colScope} />
                <col className={styles.colEffective} />
                {canConfigure ? <col className={styles.colActions} /> : null}
              </colgroup>
              <thead>
                <tr>
                  <ColumnHead label={copy.column.version} />
                  <ColumnHead label={copy.column.status} />
                  <ColumnHead label={copy.column.offset} />
                  <ColumnHead label={copy.column.reason} />
                  <ColumnHead label={copy.column.notify} />
                  <ColumnHead label={copy.column.scope} />
                  <ColumnHead label={copy.column.effective} />
                  {canConfigure ? <ColumnHead label={copy.column.actions} /> : null}
                </tr>
              </thead>
              <tbody>
                {group.versions.map(row => (
                  <ExpiryRuleRow
                    key={row.id}
                    row={row}
                    ruleName={ruleName}
                    copy={copy}
                    locale={locale}
                    canConfigure={canConfigure}
                    pending={pending}
                    columnCount={columnCount}
                    isEditing={editingId === row.id}
                    versionLabel={fill(copy.versionLabel, { version: formatCount(row.version, locale) })}
                    onToggle={() => toggle(row)}
                    onEdit={() => { setCreating(false); setEditingId(editingId === row.id ? null : row.id); }}
                    onCloseEditor={() => setEditingId(null)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}
