import Link from "next/link";
import { redirect } from "next/navigation";
import FieldHeader from "@/components/field/FieldHeader";
import FieldHeaderSync from "@/components/field/FieldHeaderSync";
import FieldHome, { type FieldHomeMarker } from "@/components/field/FieldHome";
import { FieldScopeProvider } from "@/components/field/FieldScopeProvider";
import FieldMetricStrip, { type FieldScopeStat } from "@/components/field/FieldMetricStrip";
import DailyBriefingCard, { type BriefRecommendation } from "@/components/field/DailyBriefingCard";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import { getOrGenerateBriefing } from "@/lib/ai/briefing";
import { isNotificationUnread } from "@/lib/notification-read";
import { isTestFixtureEstablishment } from "@/lib/field/fixtures";
import styles from "./field-home.module.css";

// SAQEEL Field Dashboard.dc.html — the inspector Home, REBUILT to the design's
// composition (not patched to its pixel values). The design's sections, in the
// design's order:
//
//   1. ONE card: mission line + returned/draft chips + Daily/Weekly control,
//      split by a rule from the four metrics.        → <FieldMetricStrip>
//   2. AI Daily Brief — prose paragraph + the "start here" recommendation
//      with its governed risk badge.                 → <DailyBriefingCard>
//   3. "Today's operations map": the route card and the factory preview
//      STACKED full width (the .dc.html defines .fd-2col but does not use it
//      here — the two-column split this route drew was an invention).
//   4. Today's Schedule.   5. Pending Attention.   6. Operational insight.
//   7. Quick actions.
//
// Renders the source-backed execution composition inside the canonical
// AppShell. FieldHeader is route content; global navigation, theme, account and
// notification controls remain owned by the shared shell.
//
// NOT DEAD WOOD: every number is real and RLS-scoped, or the element renders the
// governed empty state. Per the project no-fabrication + Health≠Risk laws the
// design's ungoverned values are NOT invented: Health Score, the "Est. Finish
// Time" clock, the SLA "closes in 2 hours" clause, distance/"nearest to you",
// and the traffic advisory are all left out or rendered as "—".
// Baseline: CR-099 (Inspector Dashboard — inspector-specific information only),
// CR-100 (only assigned visits), CR-107 (AI recommendations are advisory only).

type ReviewRow = { returned_sections: string[] | null };
type VisitRow = {
  id: string;
  planning_status: string;
  operational_state: string;
  visit_type: string | null;
  window_start: string;
  window_end: string | null;
  factory_id: string | null;
  factories: {
    id: string;
    name: string;
    factory_code: string | null;
    region: string | null;
    city: string | null;
    risk_score: number | null;
    risk_band: string | null;
    official_lat: number | null;
    official_lng: number | null;
  } | null;
  inspections: { id: string; status: string; reviews: ReviewRow | ReviewRow[] | null } | null;
};
type Assignment = { visit_id: string; visits: VisitRow | null };

const CLOSED_STATES = ["submitted", "approved", "completed", "closed"];

// Risk band → DS status token (tone only; Risk is the governed factory signal,
// never conflated with any Health concept).
function riskColor(band: string | null): string {
  switch (band) {
    case "high": return "var(--status-critical)";
    case "medium": return "var(--status-warning)";
    case "low": return "var(--status-compliant-text)";
    default: return "var(--text-muted)";
  }
}
const isReturned = (r: ReviewRow | ReviewRow[] | null): boolean => {
  const rows = Array.isArray(r) ? r : r ? [r] : [];
  return rows.some((x) => (x.returned_sections?.length ?? 0) > 0);
};

export default async function Field() {
  const sb = await supabaseServer();
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => (locale === "ar" ? ar : t(key, en));
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login"); // ERR-AUTH-001: never proceed with a null session

  const nowMs = Date.now();
  const arLocale = locale === "ar";
  const dt = (value: string | null | undefined) =>
    value ? new Intl.DateTimeFormat(arLocale ? "ar-SA-u-ca-gregory" : "en-SA", { dateStyle: "medium" }).format(new Date(value)) : "—";
  const tm = (value: string | null | undefined) =>
    value ? new Intl.DateTimeFormat(arLocale ? "ar-SA-u-ca-gregory" : "en-US", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Riyadh" }).format(new Date(value)) : "—";
  const label = (value: string | null | undefined) => (value ? t(`enum.${value}`, value.replaceAll("_", " ")) : "—");

  const langHref = locale === "ar" ? "/locale?set=en" : "/locale?set=ar";
  const langLabel = locale === "ar" ? "EN" : "AR";

  // Both briefing scopes are pre-fetched (cached server-side) so the shared
  // Daily/Weekly control switches the brief with no extra round trip — the
  // design's `briefRange` state drives both the metrics and the brief text.
  const [profileRead, assignmentRead, notificationRead, dailyBriefing, weeklyBriefing] = await Promise.all([
    sb.from("profiles").select("full_name, region").eq("user_id", user.id).maybeSingle(),
    sb.from("assignments")
      .select("visit_id, visits(id, planning_status, operational_state, visit_type, window_start, window_end, factory_id, factories(id, name, factory_code, region, city, risk_score, risk_band, official_lat, official_lng), inspections(id, status, reviews(returned_sections)))")
      .eq("inspector_id", user.id).order("created_at", { ascending: false }),
    sb.from("notifications").select("id, read_at, delivery_state").eq("recipient", user.id)
      .order("created_at", { ascending: false }).limit(20),
    getOrGenerateBriefing("daily", { locale: locale === "ar" ? "ar" : "en" }),
    getOrGenerateBriefing("weekly", { locale: locale === "ar" ? "ar" : "en" }),
  ]);

  // FND-012 partial service. Only the assignment read is lost here; the
  // profile, notification and briefing reads are independent and may well have
  // succeeded. Blanking the whole dashboard threw away work that was already
  // done and stranded the inspector with no route out. What must NOT happen is
  // rendering the normal dashboard with an empty task list: every count would
  // read 0, which asserts "you have no visits today" — a statement this page
  // cannot make when it does not know. So the assignment-derived surfaces are
  // named as unavailable, and everything with an independent source is served.
  if (assignmentRead.error) {
    console.error("[field home]", assignmentRead.error.message);
    const degradedBrief = (dailyBriefing.text ?? "")
      .split("\n").map((l) => l.replace(/^[-•]\s*/, "").trim()).filter(Boolean)[0] ?? "";
    return (
      <>
        <FieldHeader title={tr("field.dashboard.title", "Field dashboard", "لوحة الميدان")}
          langHref={langHref} langLabel={langLabel} />
        <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div className="alert alert-critical" role="alert">
            {t("field.dashboard.serviceUnavailable", "Field data is temporarily unavailable (ERR-OPS-001). Try again.")}
          </div>
          {/* Say which surfaces are affected. "Unavailable" is not "none". */}
          <p className="t-caption">
            {tr("field.dashboard.degradedScope",
              "Your assigned visits, today's schedule and route could not be read, so no counts are shown — this is not a count of zero.",
              "تعذّرت قراءة زياراتك المسندة وجدول اليوم والمسار، لذلك لا تُعرض أي أعداد — وهذا ليس عدداً صفرياً.")}
          </p>
          {degradedBrief ? (
            <section className="panel">
              <h4>{tr("field.home.brief.daily", "Daily brief", "الموجز اليومي")}</h4>
              <p>{degradedBrief}</p>
            </section>
          ) : null}
          {/* Independent surfaces still reachable — the inspector is not stranded. */}
          <nav aria-label={tr("field.dashboard.stillAvailable", "Still available", "ما زال متاحاً")}
            style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
            <Link className="btn btn-secondary btn-touch" href="/field" prefetch={false}>
              {tr("common.retry", "Try again", "إعادة المحاولة")}
            </Link>
            <Link className="btn btn-secondary btn-touch" href="/field/my-tasks" prefetch={false}>
              {tr("field.tabs.myTasks", "My Tasks", "مهامي")}
            </Link>
            <Link className="btn btn-secondary btn-touch" href="/field/establishments" prefetch={false}>
              {tr("field.tabs.establishments", "Establishments", "المنشآت")}
            </Link>
            <Link className="btn btn-secondary btn-touch" href="/field/notifications" prefetch={false}>
              {tr("field.tabs.notifications", "Notifications", "الإشعارات")}
            </Link>
          </nav>
        </div>
      </>
    );
  }

  // ---- Greeting + date (real Riyadh time-of-day, real name/region) ----------
  const riyadhHour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Riyadh" }).format(nowMs));
  const partOfDay = riyadhHour < 12 ? "morning" : riyadhHour < 17 ? "afternoon" : "evening";
  const greetWord = partOfDay === "morning"
    ? tr("field.home.greeting.morning", "Good morning", "صباح الخير")
    : partOfDay === "afternoon"
      ? tr("field.home.greeting.afternoon", "Good afternoon", "مساء الخير")
      : tr("field.home.greeting.evening", "Good evening", "مساء الخير");
  const fullName = (profileRead.data?.full_name ?? "").trim();
  const firstName = fullName ? fullName.split(/\s+/)[0] : tr("field.home.inspector", "Inspector", "مفتش");
  const greeting = `${greetWord}${arLocale ? "، " : ", "}${firstName}`;
  const avatarLetter = (firstName[0] ?? "I").toUpperCase();
  const dateStr = new Intl.DateTimeFormat(arLocale ? "ar-SA-u-ca-gregory" : "en-US", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Riyadh",
  }).format(nowMs);
  const dateShort = new Intl.DateTimeFormat(arLocale ? "ar-SA-u-ca-gregory" : "en-US", { day: "numeric", month: "short", timeZone: "Asia/Riyadh" }).format(nowMs);
  // The design's header line is "date · city". `profiles` carries a governed
  // `region` and no city column, so the region is what we can truthfully print.
  const region = profileRead.data?.region?.trim();
  const dateLine = region ? `${dateStr} · ${region}` : dateStr;
  const todayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(nowMs); // YYYY-MM-DD Riyadh

  const hasUnread = !notificationRead.error && (notificationRead.data ?? []).some((n) =>
    isNotificationUnread({ read_at: n.read_at as string | null, delivery_state: n.delivery_state as string }));

  // ---- Assigned tasks (RLS-scoped; e2e fixtures excluded) — CR-100 ----------
  const tasks = (assignmentRead.data as unknown as Assignment[] ?? [])
    .map((a) => a.visits)
    .filter((v): v is VisitRow => !!v && !!v.factories && ["published", "expired"].includes(v.planning_status))
    .filter((v) => !isTestFixtureEstablishment(v.factories));

  const actionable = tasks.filter((v) => v.planning_status !== "expired");
  const dayOf = (v: VisitRow) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date(v.window_start));
  const todayTasks = actionable.filter((v) => dayOf(v) === todayKey);
  const weekEndMs = nowMs + (7 * 24 * 60 * 60 * 1000);
  const weekTasks = actionable.filter((v) => {
    const start = new Date(v.window_start).getTime();
    return start >= nowMs && start < weekEndMs;
  });
  const isDone = (v: VisitRow) => CLOSED_STATES.includes(v.operational_state);

  // ---- Real, governed counts (no fabrication, no invented thresholds) --------
  const scopeStat = (rows: VisitRow[]): FieldScopeStat => {
    const submitted = rows.filter(isDone).length;
    return {
      inspections: rows.length,
      followUp: rows.filter((v) => isReturned(v.inspections?.reviews ?? null)).length,
      highRisk: rows.filter((v) => v.factories?.risk_band === "high").length,
      remaining: rows.length - submitted,
      completionPct: rows.length ? Math.round((submitted / rows.length) * 100) : 0,
    };
  };
  const dailyStat = scopeStat(todayTasks);
  const weeklyStat = scopeStat(weekTasks);
  const progressPct = dailyStat.completionPct;

  const draftCount = tasks.filter((v) => v.inspections && !CLOSED_STATES.includes(v.inspections.status) && v.inspections.status !== "not_started").length;
  // Whole-queue returned count — the Pending-Attention card and the exception
  // chip both answer "what is waiting on me", not "what is in this period".
  const returnedCount = tasks.filter((v) => isReturned(v.inspections?.reviews ?? null)).length;

  // ---- "Start here" recommendation: highest real risk among actionable, else
  // the soonest window. Reason is derived ONLY from real signals. -------------
  const byStart = [...tasks].sort((a, b) => a.window_start.localeCompare(b.window_start));
  // "Today's Schedule" is scoped to TODAY. The design titles the section
  // "Today's Schedule" and prints today's visit count beside it; listing the
  // whole assigned queue under that heading asserted something false about the
  // rows. This is the same set the insight strip counts as "Today's visits",
  // ordered by window — so the two sections can never disagree.
  const scheduleTasks = [...todayTasks].sort((a, b) => a.window_start.localeCompare(b.window_start));
  const byRisk = [...actionable].sort((a, b) => (b.factories?.risk_score ?? -1) - (a.factories?.risk_score ?? -1));
  const nextActionable = actionable.find((v) => !v.inspections || v.inspections.status === "not_started");
  const selected = (byRisk[0]?.factories?.risk_band === "high" ? byRisk[0] : null)
    ?? nextActionable
    ?? [...actionable].sort((a, b) => a.window_start.localeCompare(b.window_start))[0]
    ?? null;
  // The design's "Start Journey" targets the Travel screen (SAQEEL PWA-Field
  // Travel.dc.html), which this channel really has at /field/<visitId>/travel —
  // "Journey to Site", display-and-navigate only, no state mutation. The
  // pre-inspection pack is the Startup/PreExecution screen at /field/<visitId>.
  // A visit already under way is reached by the Quick-Actions "continue" pill,
  // exactly as the design separates them.
  const journeyHref = selected ? `/field/${selected.id}/travel` : "/field/my-tasks";
  const prepHref = selected ? `/field/${selected.id}` : "/field/my-tasks";
  const factory360Href = selected?.factories ? `/field/factory-360?factory=${selected.factories.id}` : "/field/establishments";
  const selZone = selected?.factories
    ? [selected.factories.region, selected.factories.city].filter(Boolean).join(" · ")
    : "";
  // Honest recommendation reason from real data only.
  const recoReason = selected?.factories?.risk_band === "high"
    ? tr("field.home.reco.highRisk", "Highest risk band in your queue — start here.", "الأعلى خطورة في قائمتك — ابدأ هنا.")
    : selected
      ? tr("field.home.reco.soonest", "Earliest scheduled window in your queue.", "أقرب موعد مجدول في قائمتك.")
      : "";

  // Governed risk-band badge for the recommendation. The design shows "Highest
  // Risk"; that superlative is only true when the pick IS the high band, so
  // every other band prints its own governed label and an unset band prints
  // nothing at all.
  const bandBadge = (band: string | null | undefined): { text: string; cls: string } | null => {
    switch (band) {
      case "high": return { text: tr("field.home.reco.highest", "Highest risk", "الأعلى خطورة"), cls: "badge-critical" };
      case "medium": return { text: tr("field.home.band.medium", "Medium risk", "خطورة متوسطة"), cls: "badge-warning" };
      case "low": return { text: tr("field.home.band.low", "Low risk", "خطورة منخفضة"), cls: "badge-compliant" };
      default: return null;
    }
  };
  const selBadge = bandBadge(selected?.factories?.risk_band);

  const recommendation: BriefRecommendation | null = selected?.factories
    ? {
        factoryName: selected.factories.name,
        badgeText: selBadge?.text ?? null,
        badgeClass: selBadge?.cls ?? "",
        reason: recoReason,
        factoryHref: factory360Href,
        startHref: journeyHref,
      }
    : null;

  // ---- Map markers (real GIS coordinates only) ------------------------------
  const markers: FieldHomeMarker[] = tasks
    .filter((v) => v.factories?.official_lat != null && v.factories?.official_lng != null)
    .map((v) => ({
      id: v.id,
      lat: v.factories!.official_lat as number,
      lng: v.factories!.official_lng as number,
      label: `${v.factories!.name} · ${dt(v.window_start)}`,
      tone: v.planning_status === "expired" ? "high" : (v.factories!.risk_band === "high" ? "high" : v.factories!.risk_band === "medium" ? "medium" : v.factories!.risk_band === "low" ? "low" : "neutral"),
    }));
  const mapCenter: [number, number] = markers.length
    ? [markers.reduce((a, m) => a + m.lat, 0) / markers.length, markers.reduce((a, m) => a + m.lng, 0) / markers.length]
    : [24.7136, 46.6753]; // KSA fallback (Riyadh) when nothing is geocoded

  // Planned sequence for the route-card footer — today's assigned visits in
  // window order. This is a real ordering, not an optimised/AI route.
  const routeStops = [...todayTasks].sort((a, b) => a.window_start.localeCompare(b.window_start)).slice(0, 3);

  // First governed brief line drives the Factory-Preview AI focus note. It is
  // sourced ONLY from the real daily briefing (getOrGenerateBriefing); if the
  // briefing produced nothing, the focus-note panel is omitted (no fabrication).
  const focusNote = (dailyBriefing.text ?? "")
    .split("\n").map((l) => l.replace(/^[-•]\s*/, "").trim()).filter(Boolean)[0] ?? "";

  // ---- Last submitted inspection at the selected factory (RLS-scoped) --------
  // Latest inspection with a real submitted_at for this factory's visits. RLS
  // (inspections_read + inspections_read_prior_approved) confines this to the
  // inspector's own inspections plus APPROVED inspections at the same factory,
  // so any date returned is one this inspector is governed to see. Else "—".
  let lastInspectionAt: string | null = null;
  if (selected?.factories?.id) {
    const lastInsp = await sb
      .from("inspections")
      .select("submitted_at, visits!inner(factory_id)")
      .eq("visits.factory_id", selected.factories.id)
      .not("submitted_at", "is", null)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!lastInsp.error) lastInspectionAt = (lastInsp.data?.submitted_at as string | null) ?? null;
  }

  // ---- Open Violations: no clean governed source -----------------------------
  // The violations table (0001_foundation) has NO open/closed lifecycle — only a
  // soft-invalidate (invalidated_at, migration 20260721150000). There is no
  // per-factory "open violations" count to derive without inventing a status.
  // This matches the platform's standing governed decision (DEC-DASH-003; see
  // factories/cr/[id] and api/field/factory-360/snapshot), so we render "—".
  const openViolations: number | null = null;

  // The design's third quick action is "Continue Active Inspection — <name>".
  // It is rendered ONLY when a real in-flight inspection exists.
  const activeVisit = byStart.find((v) => v.inspections
    && !CLOSED_STATES.includes(v.inspections.status)
    && v.inspections.status !== "not_started") ?? null;

  const statusTone = (v: VisitRow) => {
    if (v.planning_status === "expired") return "badge-warning";
    switch (v.operational_state) {
      case "submitted": case "approved": case "completed": case "closed": return "badge-compliant";
      case "cancelled": case "rejected": return "badge-critical";
      default: return "badge-info";
    }
  };
  const statusLabel = (v: VisitRow) => (v.planning_status === "expired" ? label("expired") : label(v.operational_state));

  // ---- Header cluster --------------------------------------------------------
  // The design's header is: avatar, greeting + "date · city", date pill, online
  // pill, search, notifications, sync and language. The canonical AppShell owns
  // the application-wide theme control, so FieldHeader does not duplicate it.
  const avatar = (
    <span className="avatar avatar-lg" aria-hidden="true"
      style={{ background: "var(--action-primary)", color: "var(--text-on-action)" }}>
      {avatarLetter}
    </span>
  );
  const headerRight = (
    <>
      <span className={styles.datePill} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 14, height: 14 }}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
        {dateShort}
      </span>
      <FieldHeaderSync userId={user.id} strings={{
        online: tr("field.home.online", "Online", "متصل"),
        offline: tr("field.home.offline", "Offline", "غير متصل"),
        syncNow: tr("field.home.syncNow", "Sync now", "مزامنة الآن"),
        syncing: tr("field.home.syncing", "Syncing…", "جارٍ المزامنة…"),
      }} />
      <Link href="/field/search" prefetch={false} className="btn btn-icon btn-ghost"
        aria-label={tr("field.home.search", "Search", "بحث")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
      </Link>
      <Link href="/field/notifications" prefetch={false} className="btn btn-icon btn-ghost"
        style={{ position: "relative" }} aria-label={tr("field.tabs.notifications", "Notifications", "الإشعارات")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
        {hasUnread && <span aria-hidden="true" style={{ position: "absolute", top: 4, insetInlineEnd: 6, width: 8, height: 8, borderRadius: "50%", background: "var(--status-critical)" }} />}
      </Link>
    </>
  );

  const sparkle = <svg viewBox="0 0 24 24" fill="none" stroke="var(--action-primary)" strokeWidth="1.7" style={{ width: 14, height: 14, flex: "none", marginBlockStart: 1 }} aria-hidden="true"><path d="M12 2l1.6 5.2L19 9l-5.4 1.8L12 16l-1.6-5.2L5 9l5.4-1.8L12 2z" /></svg>;

  const routeTitle = region
    ? `${region} — ${tr("field.home.map.todaysRoute", "Today's route", "مسار اليوم")}`
    : tr("field.home.map.todaysRoute", "Today's route", "مسار اليوم");

  return (
    <>
      <FieldHeader leading={avatar} title={greeting} subtitle={dateLine} right={headerRight}
        langHref={langHref} langLabel={langLabel} />

      <FieldScopeProvider>
        <div className={styles.wrap} style={{ flex: 1 }}>
          {/* 1 — MISSION RAIL + METRIC STRIP (ONE card, per the design) */}
          <FieldMetricStrip
            daily={dailyStat}
            weekly={weeklyStat}
            returned={returnedCount}
            drafts={draftCount}
            strings={{
              missionDaily: tr("field.home.mission.daily", "{n} visits remaining today", "لديك {n} زيارة متبقية اليوم"),
              missionWeekly: tr("field.home.mission.weekly", "{n} visits remaining this week", "لديك {n} زيارة متبقية هذا الأسبوع"),
              returned: tr("field.home.railReturned", "returned", "مُعادة"),
              drafts: tr("field.home.railDraft", "draft to resume", "مسودة للاستئناف"),
              daily: tr("field.home.daily", "Daily", "يومي"),
              weekly: tr("field.home.weekly", "Weekly", "أسبوعي"),
              scopeAria: tr("field.home.scopeAria", "Metric period", "فترة المؤشرات"),
              stripAria: tr("field.home.stripAria", "Today's mission and metrics", "مهمة اليوم والمؤشرات"),
              labelInspections: tr("field.home.stat.inspections", "Inspections", "عمليات تفتيش"),
              labelFollowUp: tr("field.home.stat.followUp", "Follow-up", "متابعة"),
              labelHighRisk: tr("field.home.stat.highRisk", "High-risk factories", "منشآت عالية الخطورة"),
              labelFinish: tr("field.home.stat.finishTime", "Est. finish time", "وقت الإنهاء المتوقع"),
              labelCompletion: tr("field.home.stat.completion", "Completion rate", "نسبة الإنجاز"),
              capAssignedDaily: tr("field.home.cap.assignedDaily", "assigned · window begins today", "مسندة · تبدأ نافذتها اليوم"),
              capAssignedWeekly: tr("field.home.cap.assignedWeekly", "assigned · window begins this week", "مسندة · تبدأ نافذتها هذا الأسبوع"),
              capFollowUp: tr("field.home.cap.followUp", "returned for correction · this period", "مُعادة للتصحيح · هذه الفترة"),
              capHighRisk: tr("field.home.cap.highRisk", "risk band · high", "درجة الخطورة · عالية"),
              capCompletion: tr("field.home.cap.completion", "submitted ÷ assigned · not approval", "مُرسلة ÷ مسندة · ليست اعتماداً"),
              notConfigured: tr("field.home.notConfigured", "Not configured", "غير مُهيأ"),
            }}
          />

          {/* 2 — AI DAILY BRIEF (prose + start-here recommendation) */}
          <DailyBriefingCard
            daily={{ text: dailyBriefing.text ?? null, error: dailyBriefing.error ?? null }}
            weekly={{ text: weeklyBriefing.text ?? null, error: weeklyBriefing.error ?? null }}
            reco={recommendation}
            strings={{
              title: tr("field.home.brief.title", "AI Daily Brief", "ملخص اليوم الذكي"),
              advisory: tr("field.home.brief.advisory", "Advisory only", "استشاري فقط"),
              unavailable: tr("field.home.brief.unavailable", "No advisory is available right now — nothing was generated or changed.", "لا يوجد ملخص استشاري الآن — لم يتم إنشاء أو تغيير أي شيء."),
              recoLabel: tr("field.home.reco.label", "AI recommendation — start here", "توصية الذكاء الاصطناعي — ابدأ هنا"),
              viewCard: tr("field.home.reco.viewCard", "View factory card", "عرض بطاقة المنشأة"),
              startJourney: tr("field.home.reco.start", "Start journey", "بدء الرحلة"),
            }}
          />

          {/* 3 — TODAY'S OPERATIONS MAP: route card then factory preview,
                  STACKED full width exactly as the .dc.html renders them. */}
          <div>
            <div className="t-label" style={{ marginBlockEnd: 8 }}>{tr("field.home.mapSection", "Today's operations map", "خريطة العمليات اليوم")}</div>
            <div className={styles.mapStack}>
              <section className={styles.card} style={{ overflow: "hidden" }}>
                <div className={styles.cardHead}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}><bdi>{routeTitle}</bdi></span>
                  <span className="grow" />
                  <span className="t-caption">{tr("field.home.map.plannedSeq", "Planned sequence · today", "التسلسل المخطط · اليوم")}</span>
                </div>
                <div className={styles.mapCanvas}>
                  <FieldHome markers={markers} center={mapCenter}
                    ariaLabel={tr("field.home.map.title", "Assigned tasks map", "خريطة المهام المسندة")} />
                </div>
                {/* Footer = the design's numbered planned-sequence legend. The
                    design's traffic advisory is omitted: no governed traffic
                    provider exists, and a fabricated one would be a lie. The
                    "View full map" link keeps /field/map reachable — the bottom
                    nav has no map tab and this card is its only entry point. */}
                <div className={styles.legend}>
                  {routeStops.length > 0 ? routeStops.map((v, i) => (
                    <span key={v.id} className={styles.legendItem}>
                      <span className={styles.stopNum} style={{ background: riskColor(v.factories?.risk_band ?? null) }}>{i + 1}</span>
                      <span>
                        <bdi>{v.factories?.name ?? "—"}</bdi>
                        {" · "}
                        <span className={styles.stopRisk} style={{ color: riskColor(v.factories?.risk_band ?? null) }}>{label(v.factories?.risk_band)}</span>
                      </span>
                    </span>
                  )) : (
                    <span className="t-caption">{tr("field.home.map.noStops", "No visits planned for today", "لا توجد زيارات مخططة اليوم")}</span>
                  )}
                  <span className="grow" />
                  <Link href="/field/map" prefetch={false} className={styles.mapLink}>
                    {tr("field.home.map.viewFull", "View full map", "عرض الخريطة الكاملة")}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 15, height: 15 }} data-directional aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
                  </Link>
                </div>
              </section>

              {selected?.factories ? (
                <section className={styles.card}>
                  <div className={styles.cardHead}><span style={{ fontWeight: 600, fontSize: 14 }}>{tr("field.home.preview", "Factory preview", "معاينة المنشأة")}</span></div>
                  <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}><bdi>{selected.factories.name}</bdi></div>
                      {selZone && <div className="t-caption" style={{ marginBlockEnd: 8 }}>{selZone}</div>}
                      {/* Risk is the governed factory signal; the design's
                          Health Score tile has no governed source and is omitted
                          rather than invented (Health ≠ Risk law). */}
                      {selected.factories.risk_score != null && (
                        <div className={styles.previewScores}>
                          <div className={styles.scoreBox}>
                            <div className="id-code" style={{ fontWeight: 700, fontSize: 16, color: riskColor(selected.factories.risk_band) }}>{selected.factories.risk_score}</div>
                            <div className="t-caption">{tr("field.home.riskScore", "Risk score", "مؤشر الخطورة")}{selected.factories.risk_band ? ` · ${label(selected.factories.risk_band)}` : ""}</div>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Key/value rows in the design's order. */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12 }}>
                      <div className={styles.kvRow}><span style={{ color: "var(--text-secondary)" }}>{tr("field.home.lastInspection", "Last inspection", "آخر تفتيش")}</span><span className="id-code" style={{ fontWeight: 600 }}>{lastInspectionAt ? dt(lastInspectionAt) : "—"}</span></div>
                      {/* Open Violations — no governed open/closed lifecycle exists (DEC-DASH-003); governed "—". */}
                      <div className={styles.kvRow}><span style={{ color: "var(--text-secondary)" }}>{tr("field.home.openViolations", "Open violations", "المخالفات المفتوحة")}</span><span className="id-code" style={{ fontWeight: 600 }}>{openViolations ?? "—"}</span></div>
                      <div className={styles.kvRow}><span style={{ color: "var(--text-secondary)" }}>{tr("field.home.visitType", "Visit type", "نوع الزيارة")}</span><span className="id-code" style={{ fontWeight: 600 }}>{label(selected.visit_type)}</span></div>
                      <div className={styles.kvRow}><span style={{ color: "var(--text-secondary)" }}>{tr("field.home.scheduled", "Scheduled", "موعد الزيارة")}</span><span className="id-code" style={{ fontWeight: 600 }}>{dt(selected.window_start)} · {tm(selected.window_start)}</span></div>
                    </div>
                    {/* AI focus note — first line of the REAL daily briefing only;
                        omitted entirely when the briefing produced no text. */}
                    {focusNote && (
                      <div className={styles.focusNote}>
                        {sparkle}
                        <span><bdi>{focusNote}</bdi></span>
                      </div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      <Link href={journeyHref} prefetch={false} className="btn btn-primary btn-block btn-sm">{tr("field.home.reco.start", "Start journey", "بدء الرحلة")}</Link>
                      <Link href={prepHref} prefetch={false} className={`btn btn-block btn-sm ${styles.btnOutline}`}>{tr("field.home.openPrep", "Open pre-inspection pack", "فتح حزمة ما قبل التفتيش")}</Link>
                      <Link href={factory360Href} prefetch={false} className={`btn btn-block btn-sm ${styles.btnOutline}`}>{tr("field.home.openF360", "Open Factory 360", "فتح ملف المنشأة 360")}</Link>
                    </div>
                  </div>
                </section>
              ) : (
                <section className={styles.card} style={{ display: "grid", placeItems: "center", padding: 20 }}>
                  <p className="t-caption" role="status" style={{ textAlign: "center", maxWidth: 220 }}>{tr("field.home.preview.empty", "No actionable establishment in your queue right now.", "لا توجد منشأة قابلة للتنفيذ في قائمتك الآن.")}</p>
                </section>
              )}
            </div>
          </div>

          {/* 4 — TODAY'S SCHEDULE */}
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <span style={{ fontWeight: 600, fontSize: 14.5 }}>{tr("field.home.schedule.title", "Today's schedule", "جدول اليوم")}</span>
              <span className="grow" />
              <span className="t-caption">{tr("field.home.schedule.count", "{n} visits", "{n} زيارة").replace("{n}", String(scheduleTasks.length))}</span>
            </div>
            {scheduleTasks.length === 0 ? (
              <div style={{ padding: "18px 16px" }}>
                <div style={{ fontWeight: 600, marginBlockEnd: 4 }}>{tr("field.home.schedule.empty", "No visits scheduled today", "لا توجد زيارات مجدولة اليوم")}</div>
                <p className="t-caption">{tr("field.home.register.emptyBody", "Only your own assignments appear here. New assignments arrive with a notification.", "تظهر هنا مهامك المسندة فقط. تصل المهام الجديدة مع إشعار.")}</p>
              </div>
            ) : (
              <div>
                {scheduleTasks.map((v) => (
                  <Link key={v.id} href={`/field/my-tasks?task=${v.id}`} prefetch={false} className={styles.schedRow}>
                    <span className="id-code" style={{ fontSize: 12, color: "var(--text-secondary)" }}>{tm(v.window_start)}</span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontWeight: 600, fontSize: 13.5 }}><bdi>{v.factories?.name ?? "—"}</bdi></span>
                      <span className="t-caption">{label(v.visit_type)}</span>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: riskColor(v.factories?.risk_band ?? null) }} />
                      {label(v.factories?.risk_band)}
                    </span>
                    <span className={`badge ${statusTone(v)}`} style={{ height: 18, whiteSpace: "nowrap" }}>{statusLabel(v)}</span>
                  </Link>
                ))}
              </div>
            )}
            {/* The design renders "View all" unconditionally — with the list
                scoped to today it is exactly what an inspector needs when today
                is empty but the assigned queue is not. */}
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "11px 16px" }}>
              <Link href="/field/my-tasks" prefetch={false} style={{ color: "var(--action-primary)", fontSize: 12.5, fontWeight: 600, textDecoration: "none" }}>{tr("field.home.register.viewAll", "View all", "عرض الكل")}</Link>
            </div>
          </section>

          {/* 5 — PENDING ATTENTION (real counts only) */}
          <div>
            <div className="t-label" style={{ marginBlockEnd: 8 }}>{tr("field.home.pending", "Pending attention", "بانتظار الاهتمام")}</div>
            <div className={styles.attn}>
              <div className={styles.card} style={{ padding: "15px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span className={styles.attnIc} style={{ background: "var(--status-warning-soft)", color: "var(--status-warning-text)" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 15, height: 15 }}><path d="M1 4v6h6" /><path d="M3.5 15a9 9 0 1 0 2.1-9.4L1 10" /></svg></span>
                  <span className="badge badge-critical" style={{ height: 17 }}>{tr("field.home.priority.high", "High priority", "أولوية عالية")}</span>
                </div>
                <div><div className={`id-code ${styles.attnNum}`}>{returnedCount}</div><div className="t-caption">{tr("field.home.returned", "Returned inspections", "تقارير مُعادة")}</div></div>
                <Link href="/field/my-tasks" prefetch={false} className={`btn btn-sm ${styles.btnOutline}`} style={{ textAlign: "center" }}>{tr("field.home.reviewNow", "Review now", "مراجعة الآن")}</Link>
              </div>
              <div className={styles.card} style={{ padding: "15px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span className={styles.attnIc} style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 15, height: 15 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg></span>
                  <span className="badge badge-warning" style={{ height: 17 }}>{tr("field.home.priority.medium", "Medium", "متوسطة")}</span>
                </div>
                <div><div className={`id-code ${styles.attnNum}`}>{draftCount}</div><div className="t-caption">{tr("field.home.drafts", "Draft inspections", "تقارير مسودة")}</div></div>
                <Link href="/field/drafts" prefetch={false} className={`btn btn-sm ${styles.btnOutline}`} style={{ textAlign: "center" }}>{tr("field.home.resume", "Resume", "استئناف")}</Link>
              </div>
              {/* The design's third card is "Pending Synchronization" with a
                  Sync-Now button. The outbox is a CLIENT-side store (lib/offline)
                  and is not readable from this server render, so the count is the
                  governed empty state and the live control stays in the header
                  cluster (FieldHeaderSync), which reads the real queue. */}
              <div className={styles.card} style={{ padding: "15px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span className={styles.attnIc} style={{ background: "var(--status-critical-soft)", color: "var(--status-critical-text)" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 15, height: 15 }}><path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /></svg></span>
                  <span className="badge badge-info" style={{ height: 17 }}>{tr("field.home.notConfigured", "Not configured", "غير مُهيأ")}</span>
                </div>
                <div><div className={`id-code ${styles.attnNum}`}>—</div><div className="t-caption">{tr("field.home.pendingSync", "Pending synchronization", "بانتظار المزامنة")}</div></div>
                <span className="t-caption">{tr("field.home.pendingSyncManaged", "Managed by secure offline sync", "تديرها المزامنة الآمنة دون اتصال")}</span>
              </div>
            </div>
          </div>

          {/* 6 — OPERATIONAL INSIGHT STRIP (all derivable, real) */}
          <div className={`${styles.card} ${styles.insight}`}>
            <div className={styles.insightItem}>
              <span className={styles.statIc} style={{ background: "var(--surface-sunken)", color: "var(--text-secondary)" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 14, height: 14 }}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg></span>
              <div><div className={`id-code ${styles.insightNum}`}>{dailyStat.inspections}</div><div className="t-caption">{tr("field.home.insight.today", "Today's visits", "زيارات اليوم")}</div></div>
            </div>
            <div className={styles.insightItem}>
              <span className={styles.statIc} style={{ background: "var(--surface-sunken)", color: "var(--text-secondary)" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 14, height: 14 }}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg></span>
              <div><div className={`id-code ${styles.insightNum}`}>{dailyStat.remaining}</div><div className="t-caption">{tr("field.home.insight.remaining", "Remaining visits", "الزيارات المتبقية")}</div></div>
            </div>
            <div className={styles.insightItem}>
              <span className={styles.statIc} style={{ background: "var(--surface-sunken)", color: "var(--text-secondary)" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 14, height: 14 }}><path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg></span>
              <div><div className={`id-code ${styles.insightNum}`}>{returnedCount + draftCount}</div><div className="t-caption">{tr("field.home.pending", "Pending attention", "بانتظار الاهتمام")}</div></div>
            </div>
            <div className={styles.insightItem}>
              <span className={styles.statIc} style={{ background: "var(--surface-sunken)", color: "var(--text-secondary)" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 14, height: 14 }}><path d="M22 11.08V12a10 10 0 1 1-5.9-9.1" /><path d="m22 4-10 10-3-3" /></svg></span>
              <div style={{ minWidth: 100 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className={`id-code ${styles.insightNum}`} style={{ fontSize: 15 }}>{progressPct}%</span>
                  <span className={styles.progressTrack}><span className={styles.progressFill} style={{ width: `${progressPct}%` }} /></span>
                </div>
                <div className="t-caption">{tr("field.home.insight.progress", "Daily progress", "إنجاز اليوم")}</div>
              </div>
            </div>
          </div>

          {/* 7 — QUICK ACTIONS (the design's rail; every pill a real navigation) */}
          <div>
            <div className="t-label" style={{ marginBlockEnd: 8 }}>{tr("field.home.quickActions", "Quick actions", "إجراءات سريعة")}</div>
            <div className={styles.qaRail}>
              <Link href="/planning/immediate" prefetch={false} className={`${styles.qbtnPill} ${styles.qbtnPrimary}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M12 5v14M5 12h14" /></svg>
                {tr("field.home.qa.immediate", "Create immediate visit", "إنشاء زيارة فورية")}
              </Link>
              <Link href="/field/search" prefetch={false} className={styles.qbtnPill}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 16, height: 16 }}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
                {tr("field.home.qa.search", "Search factory", "بحث منشأة")}
              </Link>
              {/* Third pill in the design's rail: "Continue Active Inspection —
                  <factory>". Rendered only when a real in-flight inspection
                  exists. The design's fourth pill is Sync Now with a pending
                  count; the outbox is a client-side store (lib/offline) that this
                  server render cannot read, and the live control already sits in
                  the header cluster (FieldHeaderSync), so it is not duplicated
                  here with a fabricated count. */}
              {activeVisit?.inspections && (
                <Link href={`/field/inspection/${activeVisit.inspections.id}`} prefetch={false} className={styles.qbtnPill}>
                  <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--status-compliant-text)", flex: "none" }} />
                  {tr("field.home.qa.continue", "Continue active inspection", "متابعة التفتيش النشط")} — <bdi>{activeVisit.factories?.name ?? "—"}</bdi>
                </Link>
              )}
              {/* CR-100/101/102 — the assigned-visits surface (list · calendar ·
                  map). This contextual rail keeps the execution entry point
                  beside the other task actions. */}
              <Link href="/field/visits" prefetch={false} className={styles.qbtnPill}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 16, height: 16 }}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 10h18" /></svg>
                {tr("field.home.qa.myVisits", "My visits", "زياراتي")}
              </Link>
            </div>
          </div>
        </div>
      </FieldScopeProvider>
    </>
  );
}
