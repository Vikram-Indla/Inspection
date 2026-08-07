import { unstable_cache } from "next/cache";
import { readOperationsSnapshot } from "./snapshot";
import { operationsScopeKey, type OperationsScope } from "./scope";
import type { OperationsClient } from "./sources/client-type";
import type { OperationsSnapshot } from "./types";

export const OPERATIONS_TAG = "operations";
export const OPERATIONS_REVALIDATE_SECONDS = 30;

export function operationsUserTag(userId: string): string {
  return `${OPERATIONS_TAG}:user:${userId}`;
}

export function cachedOperationsSnapshot(
  sb: OperationsClient,
  scope: OperationsScope,
  userId: string,
  factoryCodes: readonly string[],
  nowIso: string,
): Promise<OperationsSnapshot> {
  return unstable_cache(
    () => readOperationsSnapshot(sb, scope, userId, factoryCodes, nowIso),
    ["operations", "snapshot", userId, operationsScopeKey(scope)],
    { tags: [OPERATIONS_TAG, operationsUserTag(userId)], revalidate: OPERATIONS_REVALIDATE_SECONDS },
  )();
}
