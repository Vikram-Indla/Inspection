import { unstable_cache } from "next/cache";
import type { DashboardPersona } from "@/lib/dashboard-role";
import { readDashboardSnapshot } from "./snapshot";
import { scopeCacheKey, type DashboardScope } from "./scope";
import type { DashboardClient } from "./sources/client-type";
import type { DashboardSnapshot } from "./types";

export const DASHBOARD_TAG = "dashboard";
export const DASHBOARD_REVALIDATE_SECONDS = 60;

export function dashboardUserTag(userId: string): string {
  return `${DASHBOARD_TAG}:user:${userId}`;
}

export function dashboardSourceTag(source: string): string {
  return `${DASHBOARD_TAG}:source:${source}`;
}

export function cachedDashboardSnapshot(
  sb: DashboardClient,
  scope: DashboardScope,
  persona: DashboardPersona,
  userId: string,
): Promise<DashboardSnapshot> {
  return unstable_cache(
    () => readDashboardSnapshot(sb, scope, persona),
    ["dashboard", "snapshot", userId, persona, scopeCacheKey(scope)],
    {
      tags: [DASHBOARD_TAG, dashboardUserTag(userId)],
      revalidate: DASHBOARD_REVALIDATE_SECONDS,
    },
  )();
}
