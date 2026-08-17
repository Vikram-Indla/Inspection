import type { GeoMarkerData } from "@/components/GeoMap";
import { getOrGenerateBriefing } from "@/lib/ai/briefing";
import { isTestFixtureEstablishment } from "@/lib/field/fixtures";
import type { Locale } from "@/lib/i18n";
import { logProviderError } from "@/lib/neutral-error";
import { isNotificationUnread } from "@/lib/notification-read";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import {
  ASSIGNMENT_COLUMNS,
  countUnread,
  toAssignedVisits,
  toProfile,
  type FieldVisit,
} from "./rows";

const CLOSED_INSPECTION_STATES = ["submitted", "approved", "completed", "closed"];
const RIYADH = "Asia/Riyadh";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const KSA_CENTRE: readonly [number, number] = [24.7136, 46.6753];

export type PartOfDay = "morning" | "afternoon" | "evening";

export type FieldScopeStat = {
  inspections: number;
  followUp: number;
  highRisk: number;
  remaining: number;
  completionPct: number;
};

export type FieldBriefText = { text: string | null; error: string | null };

export type FieldRouteStop = {
  id: string;
  factoryName: string;
  riskBand: string | null;
};

export type FieldScheduleRow = {
  id: string;
  factoryName: string;
  time: string;
  visitType: string | null;
  riskBand: string | null;
  planningStatus: string;
  operationalState: string;
};

export type FieldRecommendation = {
  factoryName: string;
  riskBand: string | null;
  isHighestRisk: boolean;
  factoryHref: string;
  startHref: string;
};

export type FieldPreview = {
  factoryName: string;
  zone: string;
  riskScore: number | null;
  riskBand: string | null;
  lastInspection: string | null;
  openViolations: number | null;
  visitType: string | null;
  scheduledDate: string;
  scheduledTime: string;
  journeyHref: string;
  prepHref: string;
  factory360Href: string;
};

export type FieldHomeReady = {
  kind: "ready";
  daily: FieldScopeStat;
  weekly: FieldScopeStat;
  returnedCount: number;
  draftCount: number;
  progressPct: number;
  brief: { daily: FieldBriefText; weekly: FieldBriefText };
  focusNote: string;
  recommendation: FieldRecommendation | null;
  preview: FieldPreview | null;
  markers: readonly GeoMarkerData[];
  mapCentre: readonly [number, number];
  routeStops: readonly FieldRouteStop[];
  schedule: readonly FieldScheduleRow[];
  activeInspection: { href: string; factoryName: string } | null;
};

export type FieldHomeUnavailable = {
  kind: "unavailable";
  brief: string;
};

export type FieldHomeData = {
  userId: string;
  partOfDay: PartOfDay;
  firstName: string | null;
  region: string | null;
  dateLine: string;
  dateShort: string;
  hasUnread: boolean;
  body: FieldHomeReady | FieldHomeUnavailable;
};

function dateFormat(locale: Locale, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory" : "en-US", {
    timeZone: RIYADH,
    ...options,
  });
}

function dayKey(value: number | string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: RIYADH }).format(new Date(value));
}

function firstBriefLine(text: string | null): string {
  return (text ?? "")
    .split("\n")
    .map(line => line.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean)[0] ?? "";
}

function partOfDayAt(nowMs: number): PartOfDay {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: RIYADH }).format(nowMs),
  );
  if (hour < 12) return "morning";
  return hour < 17 ? "afternoon" : "evening";
}

function isClosed(state: string | null): boolean {
  return state !== null && CLOSED_INSPECTION_STATES.includes(state);
}

function scopeStat(rows: readonly FieldVisit[]): FieldScopeStat {
  const submitted = rows.filter(visit => isClosed(visit.operationalState)).length;
  return {
    inspections: rows.length,
    followUp: rows.filter(visit => visit.returnedForCorrection).length,
    highRisk: rows.filter(visit => visit.factory?.riskBand === "high").length,
    remaining: rows.length - submitted,
    completionPct: rows.length ? Math.round((submitted / rows.length) * 100) : 0,
  };
}

function markerTone(visit: FieldVisit): GeoMarkerData["tone"] {
  if (visit.planningStatus === "expired") return "high";
  const band = visit.factory?.riskBand;
  if (band === "high" || band === "medium" || band === "low") return band;
  return "neutral";
}

function centreOf(markers: readonly GeoMarkerData[]): readonly [number, number] {
  if (markers.length === 0) return KSA_CENTRE;
  const lat = markers.reduce((total, marker) => total + marker.lat, 0) / markers.length;
  const lng = markers.reduce((total, marker) => total + marker.lng, 0) / markers.length;
  return [lat, lng];
}

function pickRecommended(actionable: readonly FieldVisit[]): FieldVisit | null {
  const byRisk = [...actionable].sort(
    (a, b) => (b.factory?.riskScore ?? -1) - (a.factory?.riskScore ?? -1),
  );
  const highest = byRisk[0]?.factory?.riskBand === "high" ? byRisk[0] : null;
  const notStarted = actionable.find(
    visit => visit.inspectionId === null || visit.inspectionStatus === "not_started",
  );
  const soonest = [...actionable].sort((a, b) => a.windowStart.localeCompare(b.windowStart))[0];
  return highest ?? notStarted ?? soonest ?? null;
}

export async function loadFieldHome(locale: Locale): Promise<FieldHomeData | null> {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) return null;

  const nowMs = Date.now();
  const briefingLocale = locale === "ar" ? "ar" : "en";

  const [profileRead, assignmentRead, notificationRead, dailyBriefing, weeklyBriefing] = await Promise.all([
    sb.from("profiles").select("full_name, region").eq("user_id", user.id).maybeSingle(),
    sb.from("assignments").select(ASSIGNMENT_COLUMNS)
      .eq("inspector_id", user.id).order("created_at", { ascending: false }),
    sb.from("notifications").select("id, read_at, delivery_state").eq("recipient", user.id)
      .order("created_at", { ascending: false }).limit(20),
    getOrGenerateBriefing("daily", { locale: briefingLocale }),
    getOrGenerateBriefing("weekly", { locale: briefingLocale }),
  ]);

  const profile = toProfile(profileRead.data);
  const fullName = (profile.fullName ?? "").trim();
  const region = profile.region?.trim() ?? null;

  const longDate = dateFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(nowMs);
  const shell = {
    userId: user.id,
    partOfDay: partOfDayAt(nowMs),
    firstName: fullName ? fullName.split(/\s+/)[0] : null,
    region,
    dateLine: region ? `${longDate} · ${region}` : longDate,
    dateShort: dateFormat(locale, { day: "numeric", month: "short" }).format(nowMs),
    hasUnread: !notificationRead.error && countUnread(notificationRead.data, isNotificationUnread),
  };

  if (assignmentRead.error) {
    logProviderError("field home assignments", assignmentRead.error);
    return { ...shell, body: { kind: "unavailable", brief: firstBriefLine(dailyBriefing.text ?? null) } };
  }

  const dateOf = dateFormat(locale, { dateStyle: "medium" });
  const timeOf = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory" : "en-US", {
    hour: "numeric", minute: "2-digit", timeZone: RIYADH,
  });

  const tasks = toAssignedVisits(assignmentRead.data)
    .filter(visit => visit.factory !== null && ["published", "expired"].includes(visit.planningStatus))
    .filter(visit => !isTestFixtureEstablishment(
      visit.factory ? { name: visit.factory.name, factory_code: visit.factory.factoryCode } : null,
    ));

  const actionable = tasks.filter(visit => visit.planningStatus !== "expired");
  const todayKey = dayKey(nowMs);
  const todayTasks = actionable.filter(visit => dayKey(visit.windowStart) === todayKey);
  const weekTasks = actionable.filter(visit => {
    const start = new Date(visit.windowStart).getTime();
    return start >= nowMs && start < nowMs + WEEK_MS;
  });

  const daily = scopeStat(todayTasks);
  const byWindow = [...todayTasks].sort((a, b) => a.windowStart.localeCompare(b.windowStart));
  const selected = pickRecommended(actionable);
  const selectedFactory = selected?.factory ?? null;

  const markers: readonly GeoMarkerData[] = tasks
    .filter(visit => visit.factory?.lat != null && visit.factory?.lng != null)
    .map(visit => ({
      id: visit.id,
      lat: visit.factory?.lat ?? 0,
      lng: visit.factory?.lng ?? 0,
      label: `${visit.factory?.name ?? ""} · ${dateOf.format(new Date(visit.windowStart))}`,
      tone: markerTone(visit),
    }));

  const lastInspection = selectedFactory
    ? await sb.from("inspections")
      .select("submitted_at, visits!inner(factory_id)")
      .eq("visits.factory_id", selectedFactory.id)
      .not("submitted_at", "is", null)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    : null;
  const lastInspectionAt = lastInspection && !lastInspection.error
    ? (typeof lastInspection.data?.submitted_at === "string" ? lastInspection.data.submitted_at : null)
    : null;

  const active = [...tasks]
    .sort((a, b) => a.windowStart.localeCompare(b.windowStart))
    .find(visit => visit.inspectionId !== null
      && !isClosed(visit.inspectionStatus)
      && visit.inspectionStatus !== "not_started") ?? null;

  return {
    ...shell,
    body: {
      kind: "ready",
      daily,
      weekly: scopeStat(weekTasks),
      returnedCount: tasks.filter(visit => visit.returnedForCorrection).length,
      draftCount: tasks.filter(visit => visit.inspectionId !== null
        && !isClosed(visit.inspectionStatus)
        && visit.inspectionStatus !== "not_started").length,
      progressPct: daily.completionPct,
      brief: {
        daily: { text: dailyBriefing.text ?? null, error: dailyBriefing.error ?? null },
        weekly: { text: weeklyBriefing.text ?? null, error: weeklyBriefing.error ?? null },
      },
      focusNote: firstBriefLine(dailyBriefing.text ?? null),
      recommendation: selectedFactory && selected
        ? {
          factoryName: selectedFactory.name,
          riskBand: selectedFactory.riskBand,
          isHighestRisk: selectedFactory.riskBand === "high",
          factoryHref: `/field/factory-360?factory=${selectedFactory.id}`,
          startHref: `/field/${selected.id}/travel`,
        }
        : null,
      preview: selectedFactory && selected
        ? {
          factoryName: selectedFactory.name,
          zone: [selectedFactory.region, selectedFactory.city].filter(Boolean).join(" · "),
          riskScore: selectedFactory.riskScore,
          riskBand: selectedFactory.riskBand,
          lastInspection: lastInspectionAt ? dateOf.format(new Date(lastInspectionAt)) : null,
          openViolations: null,
          visitType: selected.visitType,
          scheduledDate: dateOf.format(new Date(selected.windowStart)),
          scheduledTime: timeOf.format(new Date(selected.windowStart)),
          journeyHref: `/field/${selected.id}/travel`,
          prepHref: `/field/${selected.id}`,
          factory360Href: `/field/factory-360?factory=${selectedFactory.id}`,
        }
        : null,
      markers,
      mapCentre: centreOf(markers),
      routeStops: byWindow.slice(0, 3).map(visit => ({
        id: visit.id,
        factoryName: visit.factory?.name ?? "",
        riskBand: visit.factory?.riskBand ?? null,
      })),
      schedule: byWindow.map(visit => ({
        id: visit.id,
        factoryName: visit.factory?.name ?? "",
        time: timeOf.format(new Date(visit.windowStart)),
        visitType: visit.visitType,
        riskBand: visit.factory?.riskBand ?? null,
        planningStatus: visit.planningStatus,
        operationalState: visit.operationalState,
      })),
      activeInspection: active?.inspectionId
        ? { href: `/field/inspection/${active.inspectionId}`, factoryName: active.factory?.name ?? "" }
        : null,
    },
  };
}
