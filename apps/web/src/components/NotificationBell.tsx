"use client";
// Platform-wide notification bell (ENG-11 · M03-001 companion) — every persona
// sees their own RLS-scoped rows (notif_own, 0002). Polls unread count, lists
// the latest rows, records read receipts (read_at; notif_update_recipient 0015).
// SB19 — strings built server-side with t() and passed as props.
import { useCallback, useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { getVerifiedUser } from "@/lib/verified-user";

export type BellStrings = {
  label: string;            // accessible name for the toggle
  heading: string;
  empty: string;
  markAll: string;
  markRead: string;
  unreadBadge: string;      // sr-only tag on unread rows
  loadError: string;
  events: Record<string, string>;          // event_key → label
  channels: Record<string, string>;        // channel → label
  notConfigured: string;    // delivery adapter pending (honest state)
};

type Row = {
  id: string; event_key: string; payload: Record<string, unknown> | null;
  channel: string; delivery_state: string; read_at: string | null; created_at: string;
};

const POLL_MS = 30_000;
const isUnread = (r: Row) => !r.read_at && r.delivery_state !== "read" && r.delivery_state !== "handled";

export default function NotificationBell({ strings }: { strings: BellStrings }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState("");
  const [authed, setAuthed] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sbRef = useRef(supabaseBrowser());

  const load = useCallback(async () => {
    const sb = sbRef.current;
    const { data: { user } } = await getVerifiedUser(sb);
    if (!user) { setAuthed(false); return; }
    setAuthed(true);
    const [{ data, error }, { count }] = await Promise.all([
      sb.from("notifications")
        .select("id, event_key, payload, channel, delivery_state, read_at, created_at")
        .eq("recipient", user.id)
        .order("created_at", { ascending: false })
        .limit(15),
      sb.from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient", user.id)
        .is("read_at", null)
        .not("delivery_state", "in", "(read,handled)"),
    ]);
    if (error) { setErr(strings.loadError); return; }
    setErr("");
    setRows((data ?? []) as Row[]);
    setUnreadTotal(count ?? 0);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  // Light dismiss on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  async function markRead(r: Row) {
    const sb = sbRef.current;
    // read_at is the platform read receipt; legacy 'queued' rows also flip
    // delivery_state so the field inbox (delivery_state semantics) agrees.
    const patch: Record<string, unknown> = { read_at: new Date().toISOString() };
    if (r.delivery_state === "queued") patch.delivery_state = "read";
    const { error } = await sb.from("notifications").update(patch).eq("id", r.id);
    if (error) { setErr(strings.loadError); return; }
    setRows(rs => rs.map(x => x.id === r.id ? { ...x, ...patch } as Row : x));
    setUnreadTotal(n => Math.max(0, n - 1));
  }

  async function markAllRead() {
    for (const r of rows.filter(isUnread)) await markRead(r);
  }

  if (!authed) return null;
  const unread = Math.max(unreadTotal, rows.filter(isUnread).length);
  const detail = (p: Record<string, unknown> | null) => {
    const cand = [p?.reason, p?.decision, p?.factory, p?.inspection_id, p?.visit_id, p?.session_id]
      .find(x => typeof x === "string" && x);
    return (cand as string | undefined) ?? "";
  };
  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button className="ax-btn ax-btn--subtle" aria-label={strings.label} aria-expanded={open}
        onClick={() => { setOpen(o => !o); if (!open) load(); }}>
        <span aria-hidden="true">🔔</span>
        {unread > 0 && <span className="ax-badge ax-badge--critical">{unread}</span>}
      </button>
      {open && (
        <div className="ax-popover" role="dialog" aria-label={strings.heading}
          style={{ position: "absolute", insetBlockStart: "calc(100% + 6px)", insetInlineEnd: 0, inlineSize: 360, maxInlineSize: "80vw", zIndex: 30, display: "flex", flexDirection: "column", gap: "var(--ax-space-100)" }}>
          <div className="ax-row" style={{ justifyContent: "space-between" }}>
            <strong>{strings.heading}</strong>
            {unread > 0 && <button className="ax-btn ax-btn--subtle" onClick={markAllRead}>{strings.markAll}</button>}
          </div>
          {err && <p className="ax-caption" role="alert">{err}</p>}
          {rows.length === 0 && <p className="ax-caption">{strings.empty}</p>}
          <div style={{ maxBlockSize: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: "var(--ax-space-100)" }}>
            {rows.map(r => (
              <div key={r.id} className="ax-surface" style={{ padding: "var(--ax-space-150)", borderInlineStart: isUnread(r) ? "3px solid var(--ax-color-primary)" : "3px solid transparent" }}>
                <div className="ax-row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <strong style={{ fontWeight: isUnread(r) ? 700 : 500 }}>
                      {strings.events[r.event_key] ?? r.event_key.replace(/_/g, " ")}
                      {isUnread(r) && <span className="ax-sr-only"> — {strings.unreadBadge}</span>}
                    </strong>
                    {detail(r.payload) && <p className="ax-caption ax-numeric" style={{ margin: 0 }}>{detail(r.payload).slice(0, 80)}</p>}
                    <p className="ax-caption ax-numeric" style={{ margin: 0 }}>
                      {new Date(r.created_at).toISOString().slice(0, 16).replace("T", " ")}
                      {" · "}{strings.channels[r.channel] ?? r.channel}
                      {r.delivery_state === "not_configured" && <> · <span className="ax-lozenge ax-lozenge--warning">{strings.notConfigured}</span></>}
                    </p>
                  </div>
                  {isUnread(r) && <button className="ax-btn ax-btn--subtle" onClick={() => markRead(r)}>{strings.markRead}</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
