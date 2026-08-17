"use client";

import { useState, useTransition } from "react";
import { setRuleEnabled, type ExpiryResult } from "@/app/(app)/admin/planning/expiry/actions";
import type { ExpiryRuleRow as ExpiryRule } from "@/app/(app)/admin/planning/expiry/types";
import type { ExpiryRuleGroup } from "@/features/admin-planning-expiry/queries";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import { fill } from "@/i18n/messages";
import { formatCount } from "@/i18n/numbers";
import type { Locale } from "@/lib/i18n";
import ExpiryRuleEditor from "./expiry-rule-editor";
import ExpiryRuleRow, { ColumnHead } from "./expiry-rule-row";
import type { ExpiryCopy } from "./expiry-copy";
import styles from "./expiry-screen.module.css";

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
      <CardHeader
        level="h2"
        titleId={headingId}
        title={ruleName}
        description={group.live
          ? fill(copy.status.liveSummary, { version: formatCount(group.live.version, locale) })
          : undefined}
        trailing={canConfigure ? (
          <Button
            variant="secondary"
            size="sm"
            disabled={pending}
            label={copy.action.newVersion}
            onClick={() => { setEditingId(null); setCreating(!creating); }}
          >
            {copy.action.newVersion}
          </Button>
        ) : undefined}
      />
      <CardBody gap="tight">
        {feedback.ok ? (
          <Text tone="secondary" live="status">{feedback.ok}</Text>
        ) : null}
        {feedback.error ? (
          <Text tone="danger" live="alert">{feedback.error}</Text>
        ) : null}
        {group.versions.length > 0 && !group.live ? (
          <StatusPill tone="warning">{copy.status.noneLive}</StatusPill>
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
          <Text tone="muted">{copy.empty.body}</Text>
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
      </CardBody>
    </Card>
  );
}
