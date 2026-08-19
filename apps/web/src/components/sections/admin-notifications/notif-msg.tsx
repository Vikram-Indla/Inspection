"use client";

import { Text } from "@/components/saqeel/type";
import type { NotifRuleResult } from "@/app/(app)/admin/notifications/actions";
import { notifResultMessage, type AdminNotificationsMessages } from "@/features/admin-notifications/strings";

export default function NotifMsg({ state, strings }: {
  state: NotifRuleResult;
  strings: AdminNotificationsMessages;
}) {
  if (state.error) return <Text role="label" tone="danger" live="alert">{notifResultMessage(state.error, strings)}</Text>;
  if (state.notice) return <Text role="label" tone="secondary" live="status">{notifResultMessage(state.notice, strings)}</Text>;
  return null;
}
