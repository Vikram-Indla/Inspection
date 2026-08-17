import type { FieldNotificationRow } from "@/lib/field-notifications";
import { logProviderError } from "@/lib/neutral-error";
import {
  notificationHref,
  notificationPayloadEntries,
  notificationReadPatch,
  type NotificationPayloadEntry,
} from "@/lib/notification-read";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { notificationVisitIds, toVisitNames } from "./rows";

const LIST_COLUMNS = "id, event_key, payload, channel, delivery_state, read_at, created_at";
const DETAIL_COLUMNS = "id, event_key, payload, delivery_state, read_at, created_at";

export type FieldNotificationsData = {
  userId: string;
  failed: boolean;
  rows: readonly FieldNotificationRow[];
  visitNames: Record<string, string>;
};

export async function loadFieldNotifications(): Promise<FieldNotificationsData | null> {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) return null;

  const { data, error } = await sb.from("notifications")
    .select(LIST_COLUMNS)
    .eq("recipient", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    logProviderError("field notifications", error);
    return { userId: user.id, failed: true, rows: [], visitNames: {} };
  }

  const rows = (data ?? []) as FieldNotificationRow[];
  const visitIds = notificationVisitIds(rows);
  const names: Record<string, string> = {};
  if (visitIds.length > 0) {
    const context = await sb.from("visits").select("id, factories(name)").in("id", visitIds);
    if (context.error) logProviderError("field notifications visit context", context.error);
    else Object.assign(names, toVisitNames(context.data));
  }

  return { userId: user.id, failed: false, rows, visitNames: names };
}

export type NotificationDetail = {
  id: string;
  eventKey: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
  message: string | null;
  sender: string | null;
  entries: readonly NotificationPayloadEntry[];
  deepLink: string | null;
  receiptError: boolean;
};

export type NotificationDetailResult =
  | { status: "ok"; detail: NotificationDetail }
  | { status: "not-found" }
  | { status: "unavailable" }
  | { status: "unauthenticated" };

function firstString(candidates: readonly unknown[]): string | null {
  const found = candidates.find(value => typeof value === "string" && value.trim().length > 0);
  return typeof found === "string" ? found : null;
}

export async function loadNotificationDetail(id: string): Promise<NotificationDetailResult> {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) return { status: "unauthenticated" };

  const { data: notification, error: readError } = await sb.from("notifications")
    .select(DETAIL_COLUMNS)
    .eq("id", id)
    .eq("recipient", user.id)
    .maybeSingle();
  if (readError) {
    logProviderError("field notification detail read", readError);
    return { status: "unavailable" };
  }
  if (!notification) return { status: "not-found" };

  let receiptError = false;
  if (!notification.read_at) {
    const patch = notificationReadPatch(notification.delivery_state, new Date().toISOString());
    const { data, error } = await sb.from("notifications")
      .update(patch)
      .eq("id", notification.id)
      .eq("recipient", user.id)
      .is("read_at", null)
      .select("id");
    if (error || !data?.length) {
      receiptError = true;
      logProviderError("field notification detail receipt", error ?? new Error("no row updated"));
    }
  }

  const payload = (notification.payload ?? null) as Record<string, unknown> | null;
  return {
    status: "ok",
    detail: {
      id: notification.id,
      eventKey: notification.event_key,
      payload,
      createdAt: notification.created_at,
      message: firstString([payload?.reason, payload?.decision, payload?.message]),
      sender: firstString([payload?.actor_name, payload?.sender_name, payload?.sender]),
      entries: notificationPayloadEntries(notification.payload),
      deepLink: notificationHref(notification.event_key, payload, true),
      receiptError,
    },
  };
}
