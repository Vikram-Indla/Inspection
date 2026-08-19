"use client";

import { useActionState } from "react";
import TextInput from "@/components/saqeel/text-input/text-input";
import Button from "@/components/saqeel/button/button";
import { Text } from "@/components/saqeel/type";
import {
  publishNotificationRule, deactivateNotificationRule, testNotificationRule, type NotifRuleResult,
} from "@/app/(app)/admin/notifications/actions";
import type { AdminNotificationsMessages } from "@/features/admin-notifications/strings";
import type { NotificationRuleRow } from "@/features/admin-notifications/types";
import NotifMsg from "./notif-msg";
import styles from "./notifications.module.css";

export default function NotifRowActions({ row, strings }: {
  row: NotificationRuleRow;
  strings: AdminNotificationsMessages;
}) {
  const [pubState, pubAction, pubPending] = useActionState<NotifRuleResult, FormData>(publishNotificationRule, {});
  const [deactState, deactAction, deactPending] = useActionState<NotifRuleResult, FormData>(deactivateNotificationRule, {});
  const [testState, testAction, testPending] = useActionState<NotifRuleResult, FormData>(testNotificationRule, {});
  const a = strings.actions;

  if (row.status === "draft") {
    return (
      <div className={styles.rowActions}>
        <form action={pubAction}>
          <input type="hidden" name="rule_id" value={row.id} />
          <Button type="submit" variant="primary" size="sm" disabled={pubPending}>{pubPending ? a.publishing : a.publish}</Button>
        </form>
        <NotifMsg state={pubState} strings={strings} />
      </div>
    );
  }

  if (row.status === "published") {
    return (
      <div className={styles.rowActions}>
        <form action={testAction}>
          <input type="hidden" name="rule_id" value={row.id} />
          <Button type="submit" variant="secondary" size="sm" disabled={testPending}>{testPending ? a.testing : a.test}</Button>
        </form>
        <NotifMsg state={testState} strings={strings} />
        <form action={deactAction} className={styles.reasonForm}>
          <input type="hidden" name="rule_id" value={row.id} />
          <TextInput name="deactivation_reason" label={strings.form.deactivationReason} required placeholder={strings.form.reasonPlaceholder} />
          <Button type="submit" variant="tertiary" size="sm" disabled={deactPending}>{deactPending ? a.deactivating : a.deactivate}</Button>
        </form>
        <NotifMsg state={deactState} strings={strings} />
      </div>
    );
  }

  return <Text as="span" role="label" tone="muted">{row.deactivation_reason ?? strings.dash}</Text>;
}
