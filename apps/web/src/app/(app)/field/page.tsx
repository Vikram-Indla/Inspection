import Link from "next/link";
import { redirect } from "next/navigation";
import FieldNav from "@/components/field/FieldNav";
import FieldHeader from "@/components/field/FieldHeader";
import FieldHeaderSync from "@/components/field/FieldHeaderSync";
import FieldHome, { type FieldHomeMarker } from "@/components/field/FieldHome";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import { getOrGenerateBriefing } from "@/lib/ai/briefing";
import { isNotificationUnread } from "@/lib/notification-read";
import { isTestFixtureEstablishment } from "@/lib/field/fixtures";
import styles from "./field-home.module.css";

// SAQEEL Field Dashboard.dc.html — the inspector Home. Rebuilt to the current
// canonical design: an AI Daily Brief (mission + real stats + a "start here"
// recommendation), a Today's-route map beside a factory preview, Today's
// Schedule, a Pending-Attention row, an Operational-Insight strip and a
// Quick-Actions rail. Renders its own SAQEEL chrome (FieldHeader + FieldNav);
// the global AppShell is bypassed for /field.
//
// NOT DEAD WOOD: every number is real and RLS-scoped, or the element is omitted.
// Per the project no-fabrication + Health≠Risk laws, the design's ungoverned
// values (Health Score, Est. Finish Time, SLA "closes in 2h", distance/"nearest
// to you", decorative map pins) are NOT invented — they are left out entirely.
// Bottom nav stays 5 tabs (Factory 360 is contextual, reached with a real id).

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

function toBulletLines(text: string): string[] {
  const lines = text.split("\n").map((line) => line.replace(/^-\s*/, "").trim()).filter(Boolean);
  if (lines.length > 1) return lines;
  return (lines[0] ?? text).split(/(?<=[.!?؟])\s+/).map((s) => s.trim()).filter(Boolean);
}

const EXC_TONES = ["exc-warning", "exc-critical", "exc-pending", "exc-info"] as const;

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
    value ? new Intl.DateTimeFormat(arLocale ? "ar-SA" : "en-SA", { dateStyle: "medium" }).format(new Date(value)) : "—";
  const tm = (value: string | null | undefined) =>
    value ? new Intl.DateTimeFormat(arLocale ? "ar-SA" : "en-US", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Riyadh" }).format(new Date(value)) : "—";
  const label = (value: string | null | undefined) => (value ? t(`enum.${value}`, value.replaceAll("_", " ")) : "—");

  const langHref = locale === "ar" ? "/locale?set=en" : "/locale?set=ar";
  const langLabel = locale === "ar" ? "EN" : "AR";
  const nav = (
    <FieldNav active="home" labels={{
      home: tr("field.tabs.home", "Home", "الرئيسية"),
      myTasks: tr("field.tabs.myTasks", "My Tasks", "مهامي"),
      establishments: tr("field.tabs.establishments", "Establishments", "المنشآت"),
      notifications: tr("field.tabs.notifications", "Notifications", "الإشعارات"),
      account: tr("field.tabs.account", "Account", "الحساب"),
    }} />
  );

  const [profileRead, assignmentRead, notificationRead, dailyBriefing] = await Promise.all([
    sb.from("profiles").select("full_name, region").eq("user_id", user.id).maybeSingle(),
    sb.from("assignments")
      .select("visit_id, visits(id, planning_status, operational_state, visit_type, window_start, window_end, factory_id, factories(id, name, factory_code, region, city, risk_score, risk_band, official_lat, official_lng), inspections(id, status, reviews(returned_sections)))")
      .eq("inspector_id", user.id).order("created_at", { ascending: false }),
    sb.from("notifications").select("id, read_at, delivery_state").eq("recipient", user.id)
      .order("created_at", { ascending: false }).limit(20),
    getOrGenerateBriefing("daily", { locale: locale === "ar" ? "ar" : "en" }),
  ]);

  if (assignmentRead.error) {
    console.error("[field home]", assignmentRead.error.message);
    return (
      <>
        <FieldHeader title={tr("field.dashboard.title", "Field dashboard", "لوحة الميدان")}
          langHref={langHref} langLabel={langLabel} />
        <div style={{ flex: 1, padding: 20 }}>
          <div className="alert alert-critical" role="alert">
            {t("field.dashboard.serviceUnavailable", "Field data is temporarily unavailable (ERR-OPS-001). Try again.")}
          </div>
        </div>
        {nav}
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
  const dateStr = new Intl.DateTimeFormat(arLocale ? "ar-SA" : "en-US", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Riyadh",
  }).format(nowMs);
  const dateShort = new Intl.DateTimeFormat(arLocale ? "ar-SA" : "en-US", { day: "numeric", month: "short", timeZone: "Asia/Riyadh" }).format(nowMs);
  const region = profileRead.data?.region?.trim();
  const dateLine = region ? `${dateStr} · ${region}` : dateStr;
  const todayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(nowMs); // YYYY-MM-DD Riyadh

  const hasUnread = !notificationRead.error && (notificationRead.data ?? []).some((n) =>
    isNotificationUnread({ read_at: n.read_at as string | null, delivery_state: n.delivery_state as string }));

  // ---- Assigned tasks (RLS-scoped; e2e fixtures excluded) --------------------
  const tasks = (assignmentRead.data as unknown as Assignment[] ?? [])
    .map((a) => a.visits)
    .filter((v): v is VisitRow => !!v && !!v.factories && ["published", "expired"].includes(v.planning_status))
    .filter((v) => !isTestFixtureEstablishment(v.factories));

  const actionable = tasks.filter((v) => v.planning_status !== "expired");
  const dayOf = (v: VisitRow) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date(v.window_start));
  const todayTasks = actionable.filter((v) => dayOf(v) === todayKey);
  const isDone = (v: VisitRow) => ["submitted", "approved", "completed", "closed"].includes(v.operational_state);

  // ---- Real, governed counts (no fabrication, no invented thresholds) --------
  const stat = {
    today: todayTasks.length,
    highRisk: actionable.filter((v) => v.factories?.risk_band === "high").length,
    followUp: tasks.filter((v) => isReturned(v.inspections?.reviews ?? null)).length,
    remaining: todayTasks.filter((v) => !isDone(v)).length,
  };
  const completedToday = todayTasks.filter(isDone).length;
  const progressPct = todayTasks.length ? Math.round((completedToday / todayTasks.length) * 100) : 0;
  const draftCount = tasks.filter((v) => v.inspections && !["submitted", "approved", "completed", "closed"].includes(v.inspections.status) && v.inspections.status !== "not_started").length;
  const returnedCount = stat.followUp;
  const expiredCount = tasks.filter((v) => v.planning_status === "expired").length;

  // ---- "Start here" recommendation: highest real risk among actionable, else
  // the soonest window. Reason is derived ONLY from real signals. -------------
  const registerTasks = [...tasks].sort((a, b) => a.window_start.localeCompare(b.window_start)).slice(0, 6);
  const byRisk = [...actionable].sort((a, b) => (b.factories?.risk_score ?? -1) - (a.factories?.risk_score ?? -1));
  const nextActionable = actionable.find((v) => !v.inspections || v.inspections.status === "not_started");
  const selected = (byRisk[0]?.factories?.risk_band === "high" ? byRisk[0] : null)
    ?? nextActionable
    ?? [...actionable].sort((a, b) => a.window_start.localeCompare(b.window_start))[0]
    ?? null;
  const startHref = selected
    ? (selected.inspections && selected.inspections.status !== "not_started"
        ? `/field/inspection/${selected.inspections.id}`
        : `/field/${selected.id}`)
    : "/field/my-tasks";
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

  const briefLines = dailyBriefing.text ? toBulletLines(dailyBriefing.text) : [];
  // First governed brief line drives the Factory-Preview AI focus note. It is
  // sourced ONLY from the real daily briefing (getOrGenerateBriefing); if the
  // briefing produced nothing, the focus-note panel is omitted (no fabrication).
  const focusNote = briefLines[0] ?? "";

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
      <Link href="/field/feedback" prefetch={false} className="btn btn-icon btn-ghost"
        aria-label={tr("field.qr.title", "Establishment feedback QR", "رمز تقييم المنشأة")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M20 20h1v1M14 20h1v1" /></svg>
      </Link>
      <Link href="/field/notifications" prefetch={false} className="btn btn-icon btn-ghost"
        style={{ position: "relative" }} aria-label={tr("field.tabs.notifications", "Notifications", "الإشعارات")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
        {hasUnread && <span aria-hidden="true" style={{ position: "absolute", top: 4, insetInlineEnd: 6, width: 8, height: 8, borderRadius: "50%", background: "var(--status-critical)" }} />}
      </Link>
    </>
  );

  const sparkle = <svg viewBox="0 0 24 24" fill="none" stroke="var(--action-primary)" strokeWidth="1.7" style={{ width: 19, height: 19 }} aria-hidden="true"><path d="M12 2l1.6 5.2L19 9l-5.4 1.8L12 16l-1.6-5.2L5 9l5.4-1.8L12 2z" /></svg>;

  return (
    <>
      <FieldHeader leading={avatar} title={greeting} subtitle={dateLine} right={headerRight}
        langHref={langHref} langLabel={langLabel} />

      <div className={styles.wrap} style={{ flex: 1 }}>
        {/* 1 — AI DAILY BRIEF */}
        <section className={styles.card} style={{ padding: "18px 20px" }} aria-labelledby="fd-brief-title">
          <div className={styles.briefHead}>
            {sparkle}
            <span id="fd-brief-title" className={styles.briefTitle}>{tr("field.home.brief.title", "AI Daily Brief", "ملخص اليوم الذكي")}</span>
            <span className="grow" />
            <span className="badge badge-info" style={{ height: 19 }}>{tr("field.home.brief.advisory", "Advisory only", "استشاري فقط")}</span>
          </div>

          {briefLines.length > 0 ? (
            <ul className={styles.briefList}>
              {briefLines.map((line, i) => (
                <li key={i} className={styles.briefItem}>
                  <span className={`exc ${EXC_TONES[i % EXC_TONES.length]} ${styles.briefMark}`} aria-hidden="true"><span className="exc-mark" /></span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="t-caption" role="status">
              {dailyBriefing.error ?? tr("field.home.brief.unavailable", "No advisory is available right now — nothing was generated or changed.", "لا يوجد ملخص استشاري الآن — لم يتم إنشاء أو تغيير أي شيء.")}
            </p>
          )}

          {/* Real, governed stats (Est. Finish Time omitted — no governed source) */}
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statIc} style={{ background: "var(--surface-sunken)", color: "var(--text-secondary)" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 15, height: 15 }}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg></span>
              <div><div className={`id-code ${styles.statNum}`}>{stat.today}</div><div className="t-caption">{tr("field.home.stat.inspections", "Inspections today", "عمليات تفتيش اليوم")}</div></div>
            </div>
            <div className={styles.stat}>
              <span className={styles.statIc} style={{ background: "var(--status-critical-soft)", color: "var(--status-critical-text)" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 15, height: 15 }}><path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg></span>
              <div><div className={`id-code ${styles.statNum}`}>{stat.highRisk}</div><div className="t-caption">{tr("field.home.stat.highRisk", "High-risk factories", "منشآت عالية الخطورة")}</div></div>
            </div>
            <div className={styles.stat}>
              <span className={styles.statIc} style={{ background: "var(--status-warning-soft)", color: "var(--status-warning-text)" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 15, height: 15 }}><path d="M1 4v6h6" /><path d="M3.5 15a9 9 0 1 0 2.1-9.4L1 10" /></svg></span>
              <div><div className={`id-code ${styles.statNum}`}>{stat.followUp}</div><div className="t-caption">{tr("field.home.stat.followUp", "Follow-up (returned)", "متابعة (مُعادة)")}</div></div>
            </div>
            <div className={styles.stat}>
              <span className={styles.statIc} style={{ background: "var(--status-compliant-soft)", color: "var(--status-compliant-text)" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 15, height: 15 }}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg></span>
              <div><div className={`id-code ${styles.statNum}`}>{stat.remaining}</div><div className="t-caption">{tr("field.home.stat.remaining", "Remaining today", "المتبقية اليوم")}</div></div>
            </div>
          </div>

          {/* AI Recommendation — Start Here (real factory pick, honest reason) */}
          {selected?.factories && (
            <div className={styles.reco}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <div className="t-label" style={{ marginBlockEnd: 6 }}>{tr("field.home.reco.label", "AI recommendation — start here", "توصية الذكاء — ابدأ هنا")}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBlockEnd: 6, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 15.5 }}><bdi>{selected.factories.name}</bdi></span>
                  {selected.factories.risk_band === "high" && <span className="badge badge-critical" style={{ height: 18 }}>{tr("field.home.reco.highest", "Highest risk", "الأعلى خطورة")}</span>}
                </div>
                {recoReason && <div style={{ fontSize: 12.5, color: "var(--text-secondary)", display: "flex", alignItems: "flex-start", gap: 6 }}>{sparkle}<span>{recoReason}</span></div>}
              </div>
              <div style={{ display: "flex", gap: 9, flex: "none", flexWrap: "wrap" }}>
                <Link href={factory360Href} prefetch={false} className={styles.qbtnPill}>{tr("field.home.reco.viewCard", "View factory card", "عرض بطاقة المنشأة")}</Link>
                <Link href={startHref} prefetch={false} className={`${styles.qbtnPill} ${styles.qbtnPrimary}`}>{tr("field.home.reco.start", "Start journey", "بدء الرحلة")}</Link>
              </div>
            </div>
          )}
        </section>

        {/* 2 — TODAY'S ROUTE MAP + FACTORY PREVIEW */}
        <div>
          <div className="t-label" style={{ marginBlockEnd: 8 }}>{tr("field.home.mapSection", "Today's operations map", "خريطة العمليات اليوم")}</div>
          <div className={styles.twoCol}>
            <section className={styles.card} style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div className={styles.cardHead}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{tr("field.home.map.route", "Assigned establishments", "المنشآت المسندة")}</span>
                <span className="grow" />
                <Link href="/field/map" prefetch={false} className={styles.mapLink}>
                  {tr("field.home.map.viewFull", "View full map", "عرض الخريطة الكاملة")}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 15, height: 15 }} data-directional aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
                </Link>
              </div>
              <div className={styles.mapCanvas}>
                <FieldHome markers={markers} center={mapCenter}
                  ariaLabel={tr("field.home.map.title", "Assigned tasks map", "خريطة المهام المسندة")} />
              </div>
              <div className={styles.legend}>
                <span className={styles.legendItem}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--status-critical)" }} />{tr("field.home.legend.high", "High risk", "خطورة عالية")}</span>
                <span className={styles.legendItem}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--status-warning)" }} />{tr("field.home.legend.med", "Medium risk", "خطورة متوسطة")}</span>
                <span className={styles.legendItem}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--status-compliant-text)" }} />{tr("field.home.legend.low", "Low risk", "خطورة منخفضة")}</span>
              </div>
            </section>

            {selected?.factories ? (
              <section className={styles.card} style={{ display: "flex", flexDirection: "column" }}>
                <div className={styles.cardHead}><span style={{ fontWeight: 600, fontSize: 14 }}>{tr("field.home.preview", "Factory preview", "معاينة المنشأة")}</span></div>
                <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}><bdi>{selected.factories.name}</bdi></div>
                    {selZone && <div className="t-caption" style={{ marginBlockEnd: 8 }}>{selZone}</div>}
                    {/* Risk is the governed factory signal; Health Score is omitted (no governed source). */}
                    {selected.factories.risk_score != null && (
                      <div className={styles.scoreBox}>
                        <div className="id-code" style={{ fontWeight: 700, fontSize: 16, color: riskColor(selected.factories.risk_band) }}>{selected.factories.risk_score}</div>
                        <div className="t-caption">{tr("field.home.riskScore", "Risk score", "مؤشر الخطورة")}{selected.factories.risk_band ? ` · ${label(selected.factories.risk_band)}` : ""}</div>
                      </div>
                    )}
                  </div>
                  {/* AI focus note — first line of the REAL daily briefing only;
                      omitted entirely when the briefing produced no text. */}
                  {focusNote && (
                    <div className={styles.focusNote}>
                      {sparkle}
                      <span>
                        <span className="t-label" style={{ display: "block", marginBlockEnd: 2 }}>{tr("field.home.focusNote", "AI focus note", "ملاحظة تركيز الذكاء")}</span>
                        <span><bdi>{focusNote}</bdi></span>
                      </span>
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12 }}>
                    <div className={styles.kvRow}><span style={{ color: "var(--text-secondary)" }}>{tr("field.home.visitType", "Visit type", "نوع الزيارة")}</span><span className="id-code" style={{ fontWeight: 600 }}>{label(selected.visit_type)}</span></div>
                    <div className={styles.kvRow}><span style={{ color: "var(--text-secondary)" }}>{tr("field.home.scheduled", "Scheduled", "موعد الزيارة")}</span><span className="id-code" style={{ fontWeight: 600 }}>{dt(selected.window_start)} · {tm(selected.window_start)}</span></div>
                    {/* Last Inspection — most recent SUBMITTED inspection at this factory (RLS-scoped); "—" when none visible. */}
                    <div className={styles.kvRow}><span style={{ color: "var(--text-secondary)" }}>{tr("field.home.lastInspection", "Last inspection", "آخر تفتيش")}</span><span className="id-code" style={{ fontWeight: 600 }}>{lastInspectionAt ? dt(lastInspectionAt) : "—"}</span></div>
                    {/* Open Violations — no governed open/closed lifecycle exists (DEC-DASH-003); governed "—". */}
                    <div className={styles.kvRow}><span style={{ color: "var(--text-secondary)" }}>{tr("field.home.openViolations", "Open violations", "المخالفات المفتوحة")}</span><span className="id-code" style={{ fontWeight: 600 }}>{openViolations ?? "—"}</span></div>
                    {selected.factories.factory_code && <div className={styles.kvRow}><span style={{ color: "var(--text-secondary)" }}>{tr("field.home.factoryCode", "Establishment code", "رمز المنشأة")}</span><span className="id-code" style={{ fontWeight: 600 }}>{selected.factories.factory_code}</span></div>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBlockStart: "auto" }}>
                    <Link href={startHref} prefetch={false} className="btn btn-primary btn-block btn-sm">{tr("field.home.reco.start", "Start journey", "بدء الرحلة")}</Link>
                    <Link href={factory360Href} prefetch={false} className={`btn btn-block btn-sm ${styles.btnOutline}`}>{tr("field.home.openF360", "Open Factory 360", "فتح ملف المنشأة 360")}</Link>
                    <Link href={`/field/my-tasks?task=${selected.id}`} prefetch={false} className={`btn btn-block btn-sm ${styles.btnOutline}`}>{tr("field.home.openVisit", "Open visit details", "فتح تفاصيل الزيارة")}</Link>
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

        {/* 3 — TODAY'S SCHEDULE */}
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <span style={{ fontWeight: 600, fontSize: 14.5 }}>{tr("field.home.schedule.title", "Today's schedule", "جدول اليوم")}</span>
            <span className="grow" />
            <span className="t-caption">{tr("field.home.schedule.count", "{n} assigned", "{n} مسندة").replace("{n}", String(tasks.length))}</span>
          </div>
          {registerTasks.length === 0 ? (
            <div style={{ padding: "18px 16px" }}>
              <div style={{ fontWeight: 600, marginBlockEnd: 4 }}>{tr("field.home.register.empty", "No assigned tasks", "لا توجد مهام مسندة")}</div>
              <p className="t-caption">{tr("field.home.register.emptyBody", "Only your own assignments appear here (RBAC-009). New assignments arrive with a notification.", "تظهر هنا مهامك المسندة فقط (RBAC-009). تصل المهام الجديدة مع إشعار.")}</p>
            </div>
          ) : (
            <div>
              {registerTasks.map((v) => (
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
              <div style={{ display: "flex", justifyContent: "flex-end", padding: "11px 16px" }}>
                <Link href="/field/my-tasks" prefetch={false} style={{ color: "var(--action-primary)", fontSize: 12.5, fontWeight: 600, textDecoration: "none" }}>{tr("field.home.register.viewAll", "View all", "عرض الكل")}</Link>
              </div>
            </div>
          )}
        </section>

        {/* 4 — PENDING ATTENTION (real counts only) */}
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
            <div className={styles.card} style={{ padding: "15px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span className={styles.attnIc} style={{ background: "var(--status-critical-soft)", color: "var(--status-critical-text)" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 15, height: 15 }}><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /></svg></span>
                <span className="badge badge-warning" style={{ height: 17 }}>{tr("field.home.priority.expired", "Lapsed", "منتهية")}</span>
              </div>
              <div><div className={`id-code ${styles.attnNum}`}>{expiredCount}</div><div className="t-caption">{tr("field.home.expired", "Expired windows", "نوافذ منتهية")}</div></div>
              <Link href="/field/my-tasks" prefetch={false} className={`btn btn-sm ${styles.btnOutline}`} style={{ textAlign: "center" }}>{tr("field.home.view", "View", "عرض")}</Link>
            </div>
          </div>
        </div>

        {/* 5 — OPERATIONAL INSIGHT STRIP (all derivable, real) */}
        <div className={`${styles.card} ${styles.insight}`}>
          <div className={styles.insightItem}>
            <span className={styles.statIc} style={{ background: "var(--surface-sunken)", color: "var(--text-secondary)" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 14, height: 14 }}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg></span>
            <div><div className={`id-code ${styles.insightNum}`}>{stat.today}</div><div className="t-caption">{tr("field.home.insight.today", "Today's visits", "زيارات اليوم")}</div></div>
          </div>
          <div className={styles.insightItem}>
            <span className={styles.statIc} style={{ background: "var(--surface-sunken)", color: "var(--text-secondary)" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 14, height: 14 }}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg></span>
            <div><div className={`id-code ${styles.insightNum}`}>{stat.remaining}</div><div className="t-caption">{tr("field.home.insight.remaining", "Remaining visits", "الزيارات المتبقية")}</div></div>
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

        {/* 6 — QUICK ACTIONS (real navigations) */}
        <div>
          <div className="t-label" style={{ marginBlockEnd: 8 }}>{tr("field.home.quickActions", "Quick actions", "إجراءات سريعة")}</div>
          <div className={styles.qaRail}>
            <Link href={startHref} prefetch={false} className={`${styles.qbtnPill} ${styles.qbtnPrimary}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M12 5v14M5 12h14" /></svg>
              {tr("field.home.qa.start", "Start visit", "بدء زيارة")}
            </Link>
            <Link href="/field/search" prefetch={false} className={styles.qbtnPill}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 16, height: 16 }}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
              {tr("field.home.qa.search", "Search factory", "بحث منشأة")}
            </Link>
            <Link href="/field/my-tasks" prefetch={false} className={styles.qbtnPill}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 16, height: 16 }}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 9h6M9 13h6M9 17h3" /></svg>
              {tr("field.home.qa.allTasks", "All tasks", "كل المهام")}
            </Link>
            <Link href="/field/drafts" prefetch={false} className={styles.qbtnPill}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 16, height: 16 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
              {tr("field.home.qa.drafts", "Resume draft", "متابعة مسودة")}
              {draftCount > 0 && <span className="badge badge-critical" style={{ height: 16, fontSize: 10 }}>{draftCount}</span>}
            </Link>
          </div>
        </div>
      </div>

      {/* No local nav spacer: FieldNav is position:fixed and renders its own
          .field-nav-spacer (56px / 60px ≥834px, + safe-area). The design's
          static 58px div here is now a duplicate that stacked a second gap
          under the content. */}
      {nav}
    </>
  );
}
