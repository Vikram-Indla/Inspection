"use client";

import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import type { FactoryDataResult } from "@/app/(app)/admin/integrations/factory-data/actions";
import { resultMessage, type AdminFactoryDataMessages } from "@/features/admin-factory-data/strings";

export default function FormResult({ state, strings }: {
  state: FactoryDataResult;
  strings: AdminFactoryDataMessages;
}) {
  if (state.error) return <Text tone="danger" role="bodyStrong" live="alert">{resultMessage(state.error, strings)}</Text>;
  if (state.ok) return <StatusPill tone="success">{strings.masterData.status.saved}</StatusPill>;
  return null;
}
