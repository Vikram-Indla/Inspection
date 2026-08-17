import type { AssignmentTask } from "@/app/(app)/field/my-tasks/assignment-task-model";
import { loadFactory360Dossier, resolveFactory360Permissions, type ProductionLine } from "@/lib/factory360/dossier";
import { isTestFixtureEstablishment } from "@/lib/field/fixtures";
import type { Locale } from "@/lib/i18n";
import { logProviderError } from "@/lib/neutral-error";
import { isNotificationUnread } from "@/lib/notification-read";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import {
  ASSIGNMENT_COLUMNS,
  countUnreadByVisit,
  toAssignments,
  type MyTasksAssignment,
  type MyTasksVisit,
} from "./rows";

export const REG_CHIPS = [
  "activities", "manufacturing", "contacts", "machines",
  "products", "raw", "documents", "license",
] as const;

export type RegChip = (typeof REG_CHIPS)[number];

const NO_SOURCE_CHIPS: readonly RegChip[] = ["manufacturing", "contacts"];

const COMPLETED_STATES = ["submitted", "under_review"];
const COMPLETED_INSPECTIONS = ["submitted", "approved", "rejected"];

export type RegTerm =
  | "hs" | "qty" | "activityNo" | "activityClass"
  | "type" | "reference" | "validTo"
  | "licenseNumber" | "expiryDate" | "status";

export type RegCard = {
  title: string;
  titleTerm?: "licenseCert";
  lines: readonly { term: RegTerm; value: string }[];
};

export type MyTasksDetail = {
  visitId: string;
  crTitle: string;
  hasDossier: boolean;
  timelineHref: string | null;
  windowStart: string;
  factoryCode: string | null;
  registrationNumber: string | null;
  investment: string | null;
  requestDate: string | null;
  establishmentStatus: string | null;
  complianceRate: number | null;
  complianceBasis: { passed: number; answered: number } | null;
  riskVisible: boolean;
  riskScore: number | null;
  riskBand: string | null;
  licenseType: string | null;
  licenseStatus: string | null;
  licenseExpiry: string | null;
  licenseNumber: string | null;
  region: string | null;
  city: string | null;
  address: string | null;
  factoryName: string;
  lat: number | null;
  lng: number | null;
  activeReg: RegChip;
  regCards: readonly RegCard[];
  regHasNoGovernedSource: boolean;
  startHref: string;
  remoteHref: string;
};

export type MyTasksData = {
  failed: boolean;
  tasks: readonly AssignmentTask[];
  selectedId: string | null;
  alertSourceAvailable: boolean;
  renderNow: number;
  windowStartLabels: Readonly<Record<string, string>>;
  detail: MyTasksDetail | null;
};

type LineFlags = ProductionLine & {
  is_machine?: boolean | null;
  is_end_product?: boolean | null;
  is_raw_material?: boolean | null;
  is_spare_part?: boolean | null;
};

export function toRegChip(value: string | undefined): RegChip {
  const found = REG_CHIPS.find(chip => chip === value);
  return found ?? "activities";
}

export function hasNoGovernedSource(chip: RegChip): boolean {
  return NO_SOURCE_CHIPS.includes(chip);
}

function textOf(value: string | number | null | undefined): string {
  return value === null || value === undefined || value === "" ? "" : String(value);
}

export async function loadMyTasks(
  locale: Locale,
  params: { task?: string; reg?: string; view?: string },
): Promise<MyTasksData | null> {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) return null;

  const isArabic = locale === "ar";
  const dateOf = new Intl.DateTimeFormat(isArabic ? "ar-SA" : "en-SA", { dateStyle: "medium" });
  const dateTimeOf = new Intl.DateTimeFormat(isArabic ? "ar-SA" : "en-SA", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh",
  });
  const day = (value: string | null | undefined) => (value ? dateOf.format(new Date(value)) : null);

  const [assignmentRead, notificationRead] = await Promise.all([
    sb.from("assignments").select(ASSIGNMENT_COLUMNS)
      .eq("inspector_id", user.id).order("created_at", { ascending: false }),
    sb.from("notifications").select("payload, read_at, delivery_state")
      .eq("recipient", user.id).order("created_at", { ascending: false }).limit(100),
  ]);

  if (assignmentRead.error) {
    logProviderError("field my-tasks assignments", assignmentRead.error);
    return {
      failed: true, tasks: [], selectedId: null, alertSourceAvailable: false,
      renderNow: Date.now(), windowStartLabels: {}, detail: null,
    };
  }
  if (notificationRead.error) logProviderError("field my-tasks notifications", notificationRead.error);

  const assignments = toAssignments(assignmentRead.data)
    .filter(row => ["published", "expired"].includes(row.visit.planningStatus))
    .filter(row => !isTestFixtureEstablishment(
      row.visit.factory ? { name: row.visit.factory.name, factory_code: row.visit.factory.factoryCode } : null,
    ));

  const unread = countUnreadByVisit(notificationRead.data, isNotificationUnread);
  const renderNow = Date.now();

  const tasks: readonly AssignmentTask[] = assignments.map((row: MyTasksAssignment) => ({
    id: row.visit.id,
    assignmentStatus: row.assignmentStatus,
    returnReason: row.returnReason,
    planningStatus: row.visit.planningStatus,
    operationalState: row.visit.operationalState,
    windowStart: row.visit.windowStart,
    windowEnd: row.visit.windowEnd,
    visitType: row.visit.visitType,
    executionMode: row.visit.executionMode,
    priority: row.visit.priority,
    packageVersionId: row.visit.packageVersionId,
    inspectionId: row.visit.inspectionId,
    inspectionStatus: row.visit.inspectionStatus,
    unreadAlertCount: unread.get(row.visit.id) ?? 0,
    factory: {
      name: row.visit.factory?.name ?? "",
      code: row.visit.factory?.factoryCode ?? null,
      region: row.visit.factory?.region ?? null,
      city: row.visit.factory?.city ?? null,
    },
  }));

  const windowStartLabels = Object.fromEntries(
    tasks.map(task => [task.id, dateTimeOf.format(new Date(task.windowStart))]),
  );

  const visits = assignments.map(row => row.visit);
  const selectable = params.view === "completed"
    ? visits.filter(visit => COMPLETED_STATES.includes(visit.operationalState)
      || COMPLETED_INSPECTIONS.includes(visit.inspectionStatus ?? ""))
    : visits;
  const selected = selectable.find(visit => visit.id === params.task) ?? selectable[0] ?? null;

  return {
    failed: false,
    tasks,
    selectedId: selected?.id ?? null,
    alertSourceAvailable: !notificationRead.error,
    renderNow,
    windowStartLabels,
    detail: selected
      ? await buildDetail(sb, selected, { locale, isArabic, day, activeReg: toRegChip(params.reg) })
      : null,
  };
}

type DetailContext = {
  locale: Locale;
  isArabic: boolean;
  day: (value: string | null | undefined) => string | null;
  activeReg: RegChip;
};

async function buildDetail(
  sb: Awaited<ReturnType<typeof supabaseServer>>,
  visit: MyTasksVisit,
  ctx: DetailContext,
): Promise<MyTasksDetail> {
  const permissions = visit.factoryId ? await resolveFactory360Permissions(sb) : null;
  const resolved = visit.factoryId && permissions?.["view_factory_360"]
    ? await resolveDossier(sb, visit.factoryId, permissions)
    : null;

  const dossier = resolved?.dossier ?? null;
  const cr = dossier?.cr ?? null;
  const factory = dossier?.factory ?? null;
  const license = dossier?.selected ?? null;
  const address = dossier?.address ?? null;
  const compliance = dossier?.currentCompliance;

  const crTitle = cr
    ? (ctx.isArabic
      ? cr.legal_name_ar ?? cr.legal_name ?? cr.legal_name_en ?? cr.cr_number
      : cr.legal_name_en ?? cr.legal_name ?? cr.legal_name_ar ?? cr.cr_number)
    : visit.factory?.name ?? "";

  const addressText = address
    ? [
      address.address_line_1,
      ctx.isArabic ? address.street_name_ar : address.street_name_en,
      ctx.isArabic ? address.city_ar : address.city_en,
      ctx.isArabic ? address.region_ar : address.region_en,
    ].filter(Boolean).join(" · ")
    : "";

  const startHref = visit.inspectionId && visit.inspectionStatus !== "not_started"
    ? `/field/inspection/${visit.inspectionId}`
    : `/field/${visit.id}`;

  return {
    visitId: visit.id,
    crTitle,
    hasDossier: dossier !== null,
    timelineHref: resolved?.timelineHref ?? null,
    windowStart: ctx.day(visit.windowStart) ?? "",
    factoryCode: visit.factory?.factoryCode ?? null,
    registrationNumber: cr?.cr_number ?? null,
    investment: license?.investment_size != null
      ? new Intl.NumberFormat(ctx.isArabic ? "ar-SA" : "en-SA", {
        style: "currency", currency: "SAR", maximumFractionDigits: 0,
      }).format(license.investment_size)
      : null,
    requestDate: ctx.day(cr?.issue_date),
    establishmentStatus: cr?.status ?? null,
    complianceRate: compliance?.rate ?? null,
    complianceBasis: compliance?.status === "available"
      ? { passed: compliance.passed, answered: compliance.answered }
      : null,
    riskVisible: permissions?.["view_risk_details"] === true,
    riskScore: factory?.risk_score ?? null,
    riskBand: factory?.risk_band ?? null,
    licenseType: license?.license_type ?? null,
    licenseStatus: license?.status ?? null,
    licenseExpiry: ctx.day(license?.expiry_date),
    licenseNumber: license?.license_number ?? null,
    region: factory?.region ?? null,
    city: factory?.city ?? null,
    address: addressText || null,
    factoryName: factory?.name ?? crTitle,
    lat: factory?.official_lat ?? visit.factory?.lat ?? null,
    lng: factory?.official_lng ?? visit.factory?.lng ?? null,
    activeReg: ctx.activeReg,
    regCards: dossier ? regCardsFor(dossier, ctx) : [],
    regHasNoGovernedSource: hasNoGovernedSource(ctx.activeReg),
    startHref,
    remoteHref: `/field/${visit.id}`,
  };
}

async function resolveDossier(
  sb: Awaited<ReturnType<typeof supabaseServer>>,
  factoryId: string,
  permissions: Awaited<ReturnType<typeof resolveFactory360Permissions>>,
): Promise<{ dossier: Awaited<ReturnType<typeof loadFactory360Dossier>>; timelineHref: string } | null> {
  const { data } = await sb.from("industrial_licenses")
    .select("id, commercial_registration_id, license_number")
    .eq("factory_id", factoryId)
    .order("license_number");

  const licence = (data ?? []).find(row => {
    const candidate: { commercial_registration_id?: string | null } = row;
    return typeof candidate.commercial_registration_id === "string";
  });
  if (!licence) return null;

  const crId: string | null = typeof licence.commercial_registration_id === "string"
    ? licence.commercial_registration_id
    : null;
  if (crId === null) return null;

  return {
    dossier: await loadFactory360Dossier(sb, crId, licence.id, permissions),
    timelineHref: `/field/factory-360/${crId}?license=${licence.id}`,
  };
}

function regCardsFor(
  dossier: NonNullable<Awaited<ReturnType<typeof loadFactory360Dossier>>>,
  ctx: DetailContext,
): readonly RegCard[] {
  const lines: LineFlags[] = dossier.lines;
  const lineName = (row: LineFlags) =>
    (ctx.isArabic ? row.name_ar ?? row.name_en : row.name_en ?? row.name_ar) ?? "";
  const lineCard = (row: LineFlags): RegCard => ({
    title: lineName(row),
    lines: [
      { term: "hs", value: textOf(row.hs_code ?? row.activity_code) },
      { term: "qty", value: `${textOf(row.quantity)} / ${textOf(row.capacity)}` },
    ],
  });

  switch (ctx.activeReg) {
    case "machines":
      return lines.filter(row => row.is_machine).map(lineCard);
    case "products":
      return lines.filter(row => row.is_end_product).map(lineCard);
    case "raw":
      return lines.filter(row => row.is_raw_material).map(lineCard);
    case "activities": {
      const withActivity = lines.filter(row => row.activity_code);
      if (withActivity.length > 0) {
        return withActivity.map(row => ({
          title: (ctx.isArabic
            ? row.activity_name_ar ?? row.activity_name_en
            : row.activity_name_en ?? row.activity_name_ar) ?? lineName(row),
          lines: [{ term: "activityNo" as const, value: textOf(row.activity_code) }],
        }));
      }
      return dossier.factory?.activity_class
        ? [{
          title: dossier.factory.activity_class,
          lines: [{ term: "activityClass", value: dossier.factory.activity_class }],
        }]
        : [];
    }
    case "documents":
      return dossier.docs.map(doc => ({
        title: doc.title,
        lines: [
          { term: "type", value: textOf(doc.business_category ?? doc.doc_type) },
          { term: "reference", value: textOf(doc.reference_no) },
          { term: "validTo", value: ctx.day(doc.valid_to) ?? "" },
        ],
      }));
    case "license": {
      const licenceCard: RegCard[] = dossier.selected
        ? [{
          title: "",
          titleTerm: "licenseCert",
          lines: [
            { term: "licenseNumber", value: textOf(dossier.selected.license_number) },
            { term: "expiryDate", value: ctx.day(dossier.selected.expiry_date) ?? "" },
          ],
        }]
        : [];
      return [
        ...licenceCard,
        ...dossier.government.map(record => ({
          title: textOf(record.title ?? record.record_type),
          lines: [
            { term: "reference" as const, value: textOf(record.external_record_id) },
            { term: "status" as const, value: textOf(record.status) },
          ],
        })),
      ];
    }
    default:
      return [];
  }
}
