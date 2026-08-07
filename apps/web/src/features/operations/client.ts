import { headers } from "next/headers";
import { scopeToSearchParams, type OperationsScope } from "./scope";
import type { OperationsSnapshot } from "./types";

export type OperationsSnapshotResult =
  | { readonly status: "ok"; readonly snapshot: OperationsSnapshot }
  | { readonly status: "unauthenticated" }
  | { readonly status: "forbidden" }
  | { readonly status: "unavailable" };

async function requestContext() {
  const bag = await headers();
  return {
    origin: `${bag.get("x-forwarded-proto") ?? "http"}://${bag.get("x-forwarded-host") ?? bag.get("host") ?? ""}`,
    cookie: bag.get("cookie") ?? "",
  };
}

export async function fetchOperationsSnapshot(scope: OperationsScope): Promise<OperationsSnapshotResult> {
  const { origin, cookie } = await requestContext();
  const query = scopeToSearchParams(scope).toString();
  const response = await fetch(
    `${origin}/api/operations/snapshot${query ? `?${query}` : ""}`,
    { headers: { cookie }, cache: "no-store" },
  );
  if (response.status === 401) return { status: "unauthenticated" };
  if (response.status === 403) return { status: "forbidden" };
  if (!response.ok) return { status: "unavailable" };
  return { status: "ok", snapshot: await response.json() as OperationsSnapshot };
}
