import { headers } from "next/headers";
import type { DashboardPersona } from "@/lib/dashboard-role";
import { scopeToSearchParams, type DashboardScope, type DashboardView } from "./scope";
import type { DashboardSnapshot } from "./types";

export type DashboardSnapshotPayload = {
  readonly persona: DashboardPersona;
  readonly view: DashboardView;
  readonly snapshot: DashboardSnapshot;
};

export type DashboardSnapshotResult =
  | { readonly status: "ok"; readonly payload: DashboardSnapshotPayload }
  | { readonly status: "unauthenticated" }
  | { readonly status: "no-workspace" }
  | { readonly status: "unavailable" };

async function requestContext() {
  const bag = await headers();
  return {
    origin: `${bag.get("x-forwarded-proto") ?? "http"}://${bag.get("x-forwarded-host") ?? bag.get("host") ?? ""}`,
    cookie: bag.get("cookie") ?? "",
  };
}

export async function fetchDashboardSnapshot(scope: DashboardScope): Promise<DashboardSnapshotResult> {
  const { origin, cookie } = await requestContext();
  const response = await fetch(
    `${origin}/api/dashboard/snapshot?${scopeToSearchParams(scope).toString()}`,
    { headers: { cookie }, cache: "no-store" },
  );
  if (response.status === 401) return { status: "unauthenticated" };
  if (response.status === 403) return { status: "no-workspace" };
  if (!response.ok) return { status: "unavailable" };
  return { status: "ok", payload: await response.json() as DashboardSnapshotPayload };
}
