"use client";
// Field home — "My visits" depth for SCR-IPAD-600.
// M03-003: Calendar / List / Map view switch over the same RLS-scoped rows.
// M03-004: text search (factory / code), filter by status / type / mode, sort by window.
// M03-015: expired / overdue display — window_end < now with a not-started
//          inspection renders red 'expired'; lapsed-but-started renders amber
//          'overdue'. Persistence is the server's expire_lapsed_visits() rpc.
// M03-001: inspector notification inbox card with mark-read (delivery_state).
// All strings arrive pre-translated from the server page (strings-prop canon —
// client components cannot call useT()). Colors: ax tokens only; logical props.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { formatDateTime } from "@/lib/dates";
import { IconCalendar, IconSearch } from "@/app/icons";
import { useActionState } from "react";
import EmptyState from "@/components/EmptyState";
import Pagination from "@/components/Pagination"; // FNS-011 shared client-side pager
import dynamic from "next/dynamic";
import type { GeoMarkerData, GeoTone } from "@/components/GeoMap";
import { markNotificationRead, requestVisitReschedule, type FieldActionResult } from "@/app/(app)/field/actions";

// Mapbox is browser-only — dynamic import with ssr:false (GeoMap canon).
const GeoMap = dynamic(() => import("@/components/GeoMap"), {
  ssr: false,
  loading: () => <div className="sq-skeleton" style={{ blockSize: "100%", minBlockSize: 320 }} />,
});

export type FieldVisit = {
  id: string;
  visitType: string;
  executionMode: string;
  planningStatus: string;       // published | expired (others filtered server-side)
  windowStart: string;          // ISO
  windowEnd: string;            // ISO
  factoryName: string;
  factoryCode: string;
  city: string;
  lat: number | null;
  lng: number | null;
  inspectionId: string | null;
  inspectionStatus: string | null; // null = prepared (no inspection row yet)
};

export type FieldNotification = {
  id: string;
  label: string;      // pre-translated event label (server maps event_key)
  detail: string;     // payload extract (reason / visit ref) — data, not UI copy
  createdAt: string;  // ISO
  unread: boolean;    // delivery_state === 'queued'
};

export type FieldHomeStrings = {
  heading: string;
  viewList: string;
  viewCalendar: string;
  viewMap: string;
  viewSwitchAria: string;
  searchPlaceholder: string;
  searchAria: string;
  allStatuses: string;
  allTypes: string;
  allModes: string;
  sortAria: string;
  sortEarliest: string;
  sortLatest: string;
  emptyTitle: string;
  emptyBody: string;
  noMatch: string;
  mapEmpty: string;
  // FNS-010 — persistent selected-task highlight (mirrors VisitsBoard select spine).
  selectAria: string;            // "{name}" — a11y label for the select control (no register match — draft)
  openDetails: string;           // register: VR-088 "Establishment Details" — "Details" term (تفاصيل)
  openDetailsAria: string;       // "{name}" — a11y label for the navigation link (no register match — draft)
  // FNS-011 — task-list pagination (shared Pagination.tsx over the filtered list).
  paginationPrev: string;        // register: VR-002 "Previous" (السابق)
  paginationNext: string;        // register: VR-001 "Next" (التالي)
  paginationPageAria: string;    // "{page}"/"{count}" — nav a11y label (no register match — draft)
  windowEnds: string;            // "window ends {date}"
  statusLabels: Record<string, string>; // prepared/not_started/…/expired/overdue
  inboxTitle: string;
  inboxEmpty: string;
  markRead: string;
  unreadBadge: string;
  rescheduleHint: string;
  rescheduleSent: string;
  rescheduleFailed: string;
};

type ViewKey = "list" | "calendar" | "map";
type DerivedStatus = { key: string; tone: "critical" | "warning" | "success" | "ops" };

// M03-015 display logic — 'now' comes from the server render to stay deterministic.
function deriveStatus(v: FieldVisit, nowMs: number): DerivedStatus {
  const lapsed = new Date(v.windowEnd).getTime() < nowMs;
  const started = !!v.inspectionStatus && v.inspectionStatus !== "not_started";
  if (v.planningStatus === "expired" || (lapsed && !started)) return { key: "expired", tone: "critical" };
  if (lapsed && started && v.inspectionStatus !== "approved") return { key: "overdue", tone: "warning" };
  if (v.inspectionStatus === "approved") return { key: v.inspectionStatus, tone: "success" };
  return { key: v.inspectionStatus ?? "prepared", tone: "ops" };
}

function visitHref(v: FieldVisit): string {
  return v.inspectionId && v.inspectionStatus !== "not_started"
    ? `/field/inspection/${v.inspectionId}`
    : `/field/${v.id}`;
}

function fmtWindow(iso: string, locale: string): string {
  return formatDateTime(iso, locale === "ar" ? "ar" : "en");
}


// FNS-010 — the card carries a persistent, keyboard-operable selected state
// (mirrors the VisitsBoard continuity spine: a button drives the highlight via
// aria-pressed, an adjacent link preserves direct navigation). Selecting never
// navigates; the Details link is the navigation affordance, so tap-to-open is
// preserved for keyboard and pointer users alike.
function VisitCard({ v, s, strings, selected, onSelect, onDragStart, locale }: { v: FieldVisit; s: DerivedStatus; strings: FieldHomeStrings; selected: boolean; onSelect: (id: string) => void; onDragStart: (id: string) => void; locale: string }) {
  const accent = s.tone === "critical" ? "var(--status-critical)"
    : s.tone === "warning" ? "var(--status-warning)"
    : "var(--action-primary)";
  return (
    // V2 a11y fix: aria-selected is only a valid ARIA attribute on elements
    // with a role that supports it (option/row/tab/gridcell/etc) — axe
    // flagged it here as unsupported on a plain div. The inner button's
    // aria-pressed (below) already correctly communicates the selected
    // state; this outer attribute was redundant as well as invalid.
    <div className="sq-surface sq-panel" draggable={s.key !== "expired" && s.key !== "approved"}
      onDragStart={() => onDragStart(v.id)}
      style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-3)", color: "inherit", borderInlineStart: `4px solid ${accent}`,
        outline: selected ? "var(--focus-ring-shadow)" : undefined, outlineOffset: selected ? "-2px" : undefined }}>
      <div className="sq-row" style={{ justifyContent: "space-between", gap: "var(--space-3)" }}>
        {/* Select-on-click/focus drives the persistent highlight (real state in
            the parent); the button is natively keyboard-operable. */}
        <button type="button" className="sq-link sq-inline-target" aria-pressed={selected}
          onClick={() => onSelect(v.id)} onFocus={() => onSelect(v.id)}
          aria-label={strings.selectAria.replace("{name}", v.factoryName)}
          style={{ font: "var(--type-field)", fontWeight: 600, textAlign: "start", background: "none", border: "none", padding: 0, cursor: "pointer", color: "inherit" }}>
          {v.factoryName}
        </button>
        <span className={`sq-lozenge sq-lozenge--${s.tone === "ops" ? "ops" : s.tone}`}>
          {strings.statusLabels[s.key] ?? s.key.replace(/_/g, " ")}
        </span>
      </div>
      <span className="sq-caption sq-numeric">
        {fmtWindow(v.windowStart, locale)} · {v.visitType} · {v.executionMode.replace(/_/g, " ")} · {v.city}
      </span>
      {(s.key === "expired" || s.key === "overdue") && (
        <span className="sq-caption" style={{ color: s.key === "expired" ? "var(--status-critical)" : "var(--status-warning-text)" }}>
          {strings.windowEnds.replace("{date}", fmtWindow(v.windowEnd, locale))}
        </span>
      )}
      <div className="sq-row" style={{ justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
        {s.key !== "expired" && s.key !== "approved" ? <span className="sq-caption">{strings.rescheduleHint}</span> : <span />}
        <Link href={visitHref(v)} prefetch={false} className="sq-link sq-caption sq-inline-target" style={{ marginInlineStart: "auto" }}
          aria-label={strings.openDetailsAria.replace("{name}", v.factoryName)}>{strings.openDetails} →</Link>
      </div>
    </div>
  );
}

// M03-001 — one inbox row: unread dot + mark-read (server action, RLS-scoped).
function InboxRow({ n, strings, locale }: { n: FieldNotification; strings: FieldHomeStrings; locale: string }) {
  const [state, formAction, pending] = useActionState<FieldActionResult, FormData>(markNotificationRead, {});
  const read = !n.unread || !!state.ok;
  return (
    <li className="sq-row" style={{ gap: "var(--space-3)", alignItems: "flex-start", paddingBlock: "var(--space-2)", borderBlockEnd: "1px solid var(--border-subtle)" }}>
      <span aria-hidden="true" style={{ marginBlockStart: 6, inlineSize: 8, blockSize: 8, flex: "0 0 auto", borderRadius: "var(--radius-full)", background: read ? "var(--border-subtle)" : "var(--action-primary)" }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ font: "var(--type-body-strong)" }}>
          {n.label}{!read && <span className="sq-sr-only"> — {strings.unreadBadge}</span>}
        </span>
        {n.detail && <span className="sq-caption">{n.detail}</span>}
        <span className="sq-caption sq-numeric">{fmtWindow(n.createdAt, locale)}</span>
        {state.error && <span className="sq-caption" style={{ color: "var(--status-critical)" }} role="alert">{state.error}</span>}
      </div>
      {!read && (
        <form action={formAction}>
          <input type="hidden" name="notification_id" value={n.id} />
          <button className="sq-btn sq-btn--subtle" disabled={pending}>{pending ? "…" : strings.markRead}</button>
        </form>
      )}
    </li>
  );
}

export default function FieldHome({ visits, notifications, strings, nowIso, locale }: {
  visits: FieldVisit[];
  notifications: FieldNotification[];
  strings: FieldHomeStrings;
  nowIso: string;   // server clock — keeps expiry display SSR/CSR consistent
  locale: string;
}) {
  const router = useRouter();
  const nowMs = new Date(nowIso).getTime();
  const [view, setView] = useState<ViewKey>("list");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [mode, setMode] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedId, setSelectedId] = useState<string | null>(null); // FNS-010 selected-task highlight
  const [page, setPage] = useState(1); // FNS-011 list pagination (1-based, list view only)
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [rescheduleBusy, setRescheduleBusy] = useState<string | null>(null);
  const [rescheduleMessage, setRescheduleMessage] = useState<string | null>(null);

  const derived = useMemo(
    () => visits.map(v => ({ v, s: deriveStatus(v, nowMs) })),
    [visits, nowMs]);

  const statusOptions = useMemo(() => [...new Set(derived.map(d => d.s.key))].sort(), [derived]);
  const typeOptions = useMemo(() => [...new Set(visits.map(v => v.visitType))].sort(), [visits]);
  const modeOptions = useMemo(() => [...new Set(visits.map(v => v.executionMode))].sort(), [visits]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return derived
      .filter(({ v, s }) =>
        (!needle || v.factoryName.toLowerCase().includes(needle) || v.factoryCode.toLowerCase().includes(needle)) &&
        (!status || s.key === status) &&
        (!type || v.visitType === type) &&
        (!mode || v.executionMode === mode))
      .sort((a, b) => {
        const d = new Date(a.v.windowStart).getTime() - new Date(b.v.windowStart).getTime();
        return sortDir === "asc" ? d : -d;
      });
  }, [derived, q, status, type, mode, sortDir]);

  // FNS-011 — client-side pagination over the filtered list (list view only;
  // Calendar groups by day and Map plots all markers, so neither is paged).
  const PAGE_SIZE = 12;
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Reset to page 1 whenever the filtered set changes shape (search/filter/sort).
  useEffect(() => { setPage(1); }, [q, status, type, mode, sortDir]);
  const clampedPage = Math.min(page, pageCount);
  const pageSlice = useMemo(
    () => filtered.slice((clampedPage - 1) * PAGE_SIZE, (clampedPage - 1) * PAGE_SIZE + PAGE_SIZE),
    [filtered, clampedPage]);

  // Calendar: group by UTC day of window_start (M03-003).
  const byDay = useMemo(() => {
    const groups = new Map<string, typeof filtered>();
    for (const d of filtered) {
      const key = d.v.windowStart.slice(0, 10);
      const g = groups.get(key) ?? [];
      g.push(d); groups.set(key, g);
    }
    return [...groups.entries()].sort(([a], [b]) => sortDir === "asc" ? a.localeCompare(b) : b.localeCompare(a));
  }, [filtered, sortDir]);

  const markers: GeoMarkerData[] = useMemo(() =>
    filtered
      .filter(({ v }) => v.lat != null && v.lng != null)
      .map(({ v, s }) => ({
        id: v.id,
        lat: v.lat as number,
        lng: v.lng as number,
        label: `${v.factoryName} · ${fmtWindow(v.windowStart, locale)}`,
        tone: (s.key === "expired" ? "high" : s.key === "overdue" ? "medium" : "neutral") as GeoTone,
      })),
    [filtered]);

  const mapCenter: [number, number] = markers.length
    ? [markers.reduce((a, m) => a + m.lat, 0) / markers.length, markers.reduce((a, m) => a + m.lng, 0) / markers.length]
    : [24.7136, 46.6753]; // KSA fallback center (Riyadh) when nothing is geocoded

  const dayLabel = (isoDay: string) =>
    new Date(`${isoDay}T00:00:00Z`).toLocaleDateString(locale === "ar" ? "ar" : "en",
      { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

  const unread = notifications.filter(n => n.unread).length;

  async function dropOnDay(day: string) {
    if (!draggedId) return;
    const source = visits.find(v => v.id === draggedId);
    setDraggedId(null);
    if (!source) return;
    const start = new Date(source.windowStart);
    const end = new Date(source.windowEnd);
    const duration = end.getTime() - start.getTime();
    // Preserve the visit's existing time-of-day and duration; only the
    // proposed calendar day changes. The server/RPC remains the authority.
    const proposedStart = new Date(`${day}T${start.toISOString().slice(11, 19)}.000Z`);
    const proposedEnd = new Date(proposedStart.getTime() + duration);
    setRescheduleBusy(source.id);
    setRescheduleMessage(null);
    try {
      const result = await requestVisitReschedule(source.id, proposedStart.toISOString(), proposedEnd.toISOString());
      setRescheduleMessage(result.error ? `${strings.rescheduleFailed} ${result.error}` : strings.rescheduleSent);
    } catch {
      setRescheduleMessage(strings.rescheduleFailed);
    } finally {
      setRescheduleBusy(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <section id="visits" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", scrollMarginBlockStart: "var(--space-6)" }}>
        <div className="sq-row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-3)" }}>
          <h3 style={{ font: "var(--type-heading-lg)", margin: 0 }}>{strings.heading}</h3>
          {/* M03-003 — view switch */}
          <div className="sq-segmented sq-segmented--field" role="group" aria-label={strings.viewSwitchAria}>
            {([["list", strings.viewList], ["calendar", strings.viewCalendar], ["map", strings.viewMap]] as [ViewKey, string][]).map(([k, label]) => (
              <button key={k} type="button" aria-pressed={view === k} onClick={() => setView(k)}>{label}</button>
            ))}
          </div>
        </div>
        {rescheduleMessage && <div className="sq-banner" role="status">{rescheduleMessage}</div>}

        {/* M03-004 — search / filter / sort */}
        <div className="sq-row" style={{ gap: "var(--space-3)", flexWrap: "wrap" }}>
          <span className="sq-search" style={{ flex: "1 1 220px" }}>
            <input className="sq-input" style={{ inlineSize: "100%" }} value={q}
              onChange={e => setQ(e.target.value)}
              placeholder={strings.searchPlaceholder} aria-label={strings.searchAria} />
          </span>
          <select className="sq-select" value={status} onChange={e => setStatus(e.target.value)} aria-label={strings.allStatuses}>
            <option value="">{strings.allStatuses}</option>
            {statusOptions.map(sKey => <option key={sKey} value={sKey}>{strings.statusLabels[sKey] ?? sKey.replace(/_/g, " ")}</option>)}
          </select>
          {/* FNS-013 (تخصصي/عام specialist/general segmented control) — BLOCKED, NOT
              built. The visit_type / nature domain has no specialist|general option
              values: `visits.visit_type` is free-text reference data (0001_foundation
              L154; seeded values physical/periodic/follow_up/complaint) with no such
              enum, and the register only captures HT-021 "Visit Nature" (label, no
              options) and VR-033 "Is a specialized visit needed?" (a Yes/No conditional
              field inside a visit report, not a task-type domain). The عام/تخصصي option
              set is uncaptured, so per the no-invention rule the generic type filter is
              retained here rather than fabricating a segmented control. */}
          <select className="sq-select" value={type} onChange={e => setType(e.target.value)} aria-label={strings.allTypes}>
            <option value="">{strings.allTypes}</option>
            {typeOptions.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select className="sq-select" value={mode} onChange={e => setMode(e.target.value)} aria-label={strings.allModes}>
            <option value="">{strings.allModes}</option>
            {modeOptions.map(v => <option key={v} value={v}>{v.replace(/_/g, " ")}</option>)}
          </select>
          <select className="sq-select" value={sortDir} onChange={e => setSortDir(e.target.value as "asc" | "desc")} aria-label={strings.sortAria}>
            <option value="asc">{strings.sortEarliest}</option>
            <option value="desc">{strings.sortLatest}</option>
          </select>
        </div>

        {visits.length === 0 && (
          <EmptyState icon={<IconCalendar size={28} />} title={strings.emptyTitle} body={strings.emptyBody} />
        )}
        {visits.length > 0 && filtered.length === 0 && (
          <EmptyState icon={<IconSearch size={28} />} title={strings.noMatch} inline />
        )}

        {view === "list" && filtered.length > 0 && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "var(--space-4)" }}>
              {pageSlice.map(({ v, s }) => <VisitCard key={v.id} v={v} s={s} strings={strings} selected={v.id === selectedId} onSelect={setSelectedId} onDragStart={setDraggedId} locale={locale} />)}
            </div>
            <Pagination page={clampedPage} pageCount={pageCount} onChange={setPage}
              prevLabel={strings.paginationPrev} nextLabel={strings.paginationNext}
              pageLabel={(p) => strings.paginationPageAria.replace("{page}", String(p)).replace("{count}", String(pageCount))} />
          </>
        )}

        {view === "calendar" && filtered.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
            {byDay.map(([day, group]) => (
              <div key={day} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                <div className="sq-row" style={{ gap: "var(--space-3)" }} onDragOver={e => e.preventDefault()} onDrop={() => void dropOnDay(day)}>
                  <span className="sq-overline">{dayLabel(day)}</span>
                  <span className="sq-badge">{group.length}</span>
                  {draggedId && <span className="sq-caption">{rescheduleBusy ? "…" : strings.rescheduleHint}</span>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "var(--space-4)", borderInlineStart: "2px solid var(--border-subtle)", paddingInlineStart: "var(--space-4)" }}>
                  {group.map(({ v, s }) => <VisitCard key={v.id} v={v} s={s} strings={strings} selected={v.id === selectedId} onSelect={setSelectedId} onDragStart={setDraggedId} locale={locale} />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {view === "map" && filtered.length > 0 && (
          markers.length === 0
            ? <div className="sq-surface"><div className="sq-state sq-state--inline"><p className="sq-caption">{strings.mapEmpty}</p></div></div>
            : <div className="sq-surface sq-map" style={{ blockSize: 420, overflow: "hidden" }}>
                <GeoMap center={mapCenter} zoom={markers.length === 1 ? 13 : 6} markers={markers} height="100%"
                  onMarkerClick={(id) => {
                    const hit = filtered.find(({ v }) => v.id === id);
                    if (hit) router.push(visitHref(hit.v));
                  }} />
              </div>
        )}
      </section>

      {/* M03-001 — inspector inbox remains available after the active work
          queue so alerts do not displace the next assignment. */}
      <section className="sq-surface sq-panel" style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <div className="sq-row" style={{ justifyContent: "space-between" }}>
          <h3 style={{ font: "var(--type-heading-lg)", margin: 0 }}>{strings.inboxTitle}</h3>
          {unread > 0 && <span className="sq-badge">{unread}</span>}
        </div>
        {notifications.length === 0
          ? <span className="sq-caption">{strings.inboxEmpty}</span>
          : <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {notifications.map(n => <InboxRow key={n.id} n={n} strings={strings} locale={locale} />)}
            </ul>}
      </section>
    </div>
  );
}
