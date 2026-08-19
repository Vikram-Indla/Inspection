"use client";

import { Text } from "@/components/saqeel/type";
import type { DelegationResult } from "@/app/(app)/admin/delegation/actions";
import { delegationResultMessage, type AdminDelegationMessages } from "@/features/admin-delegation/strings";

export default function DelegationMsg({ state, done, strings }: {
  state: DelegationResult;
  done: string;
  strings: AdminDelegationMessages;
}) {
  if (state.error) return <Text role="label" tone="danger" live="alert">{delegationResultMessage(state.error, strings)}</Text>;
  if (state.ok) return <Text role="label" tone="success" live="status">{done}</Text>;
  return null;
}
