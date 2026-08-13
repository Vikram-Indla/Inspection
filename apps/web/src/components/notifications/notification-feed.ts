import { isNotificationUnread, notificationReadPatch } from "@/lib/notification-read";
import { supabaseBrowser } from "@/lib/supabase";
import { getVerifiedUser } from "@/lib/verified-user";

export type NotificationRecord = {
  id: string;
  event_key: string;
  payload: Record<string, unknown> | null;
  channel: string;
  delivery_state: string;
  read_at: string | null;
  created_at: string;
};

export type VisitContext = { factory: string; reference: string | null; region: string | null };

export type NotificationFeed = {
  rows: readonly NotificationRecord[];
  unreadTotal: number;
  total: number;
  visitContexts: Readonly<Record<string, VisitContext>>;
};

export const NOTIFICATION_POLL_MS = 30_000;
const FETCH_LIMIT = 15;
const READ_DELIVERY_STATE = "queued";

type Snapshot = NotificationFeed & { at: number; userId: string };

let snapshot: Snapshot | null = null;

function visitIdOf(row: NotificationRecord): string | null {
  return typeof row.payload?.visit_id === "string" ? row.payload.visit_id : null;
}

async function readVisitContexts(
  client: ReturnType<typeof supabaseBrowser>,
  rows: readonly NotificationRecord[],
): Promise<Record<string, VisitContext>> {
  const visitIds = Array.from(new Set(rows.map(visitIdOf).filter((id): id is string => !!id)));
  if (!visitIds.length) return {};
  const { data } = await client.rpc("notification_visit_context", { p_visit_ids: visitIds });
  const contexts: Record<string, VisitContext> = {};
  const resolved = (data ?? []) as {
    visit_id: string;
    visit_reference: string | null;
    factory_name: string | null;
    region: string | null;
  }[];
  for (const row of resolved) {
    if (row.factory_name) {
      contexts[row.visit_id] = { factory: row.factory_name, reference: row.visit_reference, region: row.region };
    }
  }
  return contexts;
}

export async function loadNotificationFeed(force: boolean): Promise<NotificationFeed | null> {
  const client = supabaseBrowser();
  const { data: { user } } = await getVerifiedUser(client);
  if (!user) return null;
  const fresh = snapshot
    && snapshot.userId === user.id
    && Date.now() - snapshot.at < NOTIFICATION_POLL_MS;
  if (!force && fresh && snapshot) return snapshot;

  const [{ data, error }, { count }, { count: total }] = await Promise.all([
    client.from("notifications")
      .select("id, event_key, payload, channel, delivery_state, read_at, created_at")
      .eq("recipient", user.id)
      .order("created_at", { ascending: false })
      .limit(FETCH_LIMIT),
    client.from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient", user.id)
      .is("read_at", null)
      .not("delivery_state", "in", "(read,handled)"),
    client.from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient", user.id),
  ]);
  if (error) throw error;

  const rows = (data ?? []) as NotificationRecord[];
  const feed: NotificationFeed = {
    rows,
    unreadTotal: count ?? 0,
    total: total ?? rows.length,
    visitContexts: await readVisitContexts(client, rows),
  };
  snapshot = { ...feed, at: Date.now(), userId: user.id };
  return feed;
}

export async function markNotificationRead(row: NotificationRecord): Promise<NotificationFeed | null> {
  const client = supabaseBrowser();
  const patch = notificationReadPatch(row.delivery_state, new Date().toISOString());
  const { error } = await client.from("notifications").update(patch).eq("id", row.id);
  if (error) throw error;
  if (!snapshot) return null;
  snapshot = {
    ...snapshot,
    rows: snapshot.rows.map(current => current.id === row.id ? { ...current, ...patch } : current),
    unreadTotal: Math.max(0, snapshot.unreadTotal - 1),
  };
  return snapshot;
}

export async function markAllNotificationsRead(): Promise<NotificationFeed | null> {
  const client = supabaseBrowser();
  const { data: { user } } = await getVerifiedUser(client);
  if (!user) return null;
  const readAt = new Date().toISOString();
  const [legacy, current] = await Promise.all([
    client.from("notifications")
      .update({ read_at: readAt, delivery_state: "read" })
      .eq("recipient", user.id)
      .is("read_at", null)
      .eq("delivery_state", READ_DELIVERY_STATE),
    client.from("notifications")
      .update({ read_at: readAt })
      .eq("recipient", user.id)
      .is("read_at", null)
      .neq("delivery_state", READ_DELIVERY_STATE),
  ]);
  if (legacy.error) throw legacy.error;
  if (current.error) throw current.error;
  return loadNotificationFeed(true);
}

export function isUnread(row: NotificationRecord): boolean {
  return isNotificationUnread(row);
}
