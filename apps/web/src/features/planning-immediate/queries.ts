import type { SupabaseClient } from "@supabase/supabase-js";
import { getPlanningAccess } from "@/lib/planning/access";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import type { Locale } from "@/lib/i18n";
import { immediateMessages, type ImmediateMessages } from "./strings";
import type {
  ActorMode,
  ImmediateFactory,
  ImmediateInspector,
  ImmediatePackage,
  ImmediatePlanningLoad,
  ManualReasonOption,
  VisitTypeOption,
} from "./types";

export type ImmediatePlanningParams = {
  factory?: string;
  cr?: string;
  license?: string;
  returnTo?: string;
};

const FACTORY_COLUMNS =
  "id, name, factory_code, cr_number, license_number, region, city, risk_band, risk_score, official_lat, official_lng, source_synced_at";
const SOURCED_FACTORIES = "factory_code.like.F-%,source.eq.saqeel_test_data";
const LOOKUP_KINDS = ["visit_type", "manual_entry_reason"];
const FACTORY_360_RETURN_PREFIX = "/factories/cr/";
const URGENT_REQUEST_ACTOR_MODE: ActorMode = "planner";
const MANUAL_ENTRY_ALLOWED = false;

type LookupRow = {
  kind: string;
  key: string;
  label_en: string;
  label_ar: string | null;
  metadata: Record<string, unknown> | null;
};

type Embedded<T> = T | readonly T[] | null;

type InspectorRow = { user_id: string; profiles: Embedded<{ full_name: string }> };

type PackageVersionRow = {
  id: string;
  version_label: string;
  packages: Embedded<{ code: string; title: string }>;
};

const embeddedOne = <T,>(value: Embedded<T>): T | null =>
  Array.isArray(value) ? value[0] ?? null : (value as T | null);

const distinct = (values: readonly (string | null)[]): readonly string[] =>
  [...new Set(values.filter((value): value is string => typeof value === "string" && value.length > 0))].sort();

function citiesByRegion(factories: readonly ImmediateFactory[]): Readonly<Record<string, readonly string[]>> {
  const pairs = factories.flatMap(factory =>
    factory.region && factory.city ? [[factory.region, factory.city] as const] : []);
  return Object.fromEntries(
    distinct(pairs.map(([region]) => region)).map(region => [
      region,
      distinct(pairs.filter(([owner]) => owner === region).map(([, city]) => city)),
    ]),
  );
}

function visitTypeOptions(
  lookups: readonly LookupRow[],
  label: (row: LookupRow) => string,
  fallback: ImmediateMessages["identity"]["visitTypeFallback"],
): readonly VisitTypeOption[] {
  const configured = lookups.filter(row => row.kind === "visit_type");
  if (configured.length === 0) {
    return Object.entries(fallback).map(([key, label]) => ({
      key,
      label,
      manualEntryAllowed: false,
      attachmentRequired: false,
    }));
  }
  return configured.map(row => ({
    key: row.key,
    label: label(row),
    manualEntryAllowed: row.metadata?.manual_entry_allowed === true,
    attachmentRequired: row.metadata?.attachment_required === true,
  }));
}

async function readLinkedFactory(
  sb: SupabaseClient,
  factories: readonly ImmediateFactory[],
  factoryId: string,
): Promise<readonly ImmediateFactory[]> {
  if (factories.some(factory => factory.id === factoryId)) return factories;
  const { data } = await sb.from("factories").select(FACTORY_COLUMNS)
    .eq("id", factoryId).eq("is_temporary", false).maybeSingle();
  return data ? [data as ImmediateFactory, ...factories] : factories;
}

export async function loadImmediatePlanning(
  params: ImmediatePlanningParams,
  locale: Locale,
): Promise<ImmediatePlanningLoad> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  const access = await getPlanningAccess(sb, ["planning.create.immediate"]);
  const permitted = user !== null
    && access.error === null
    && access.can("planning.create.immediate")
    && access.accessClass === "business_staff";
  if (!permitted) return { kind: "unauthorized" };

  const today = new Date().toISOString().slice(0, 10);
  const [factoryRead, packageRead, inspectorRead, profileRead, lookupRead] = await Promise.all([
    sb.from("factories").select(FACTORY_COLUMNS).eq("is_temporary", false)
      .or(SOURCED_FACTORIES).not("name", "ilike", "CD%").order("name"),
    sb.from("package_versions").select("id, version_label, packages(code, title)")
      .in("status", ["published", "locked"])
      .lte("effective_from", today).or(`effective_to.is.null,effective_to.gte.${today}`),
    sb.from("user_roles").select("user_id, profiles!user_roles_user_id_fkey(full_name)").eq("role_key", "inspector"),
    sb.from("profiles").select("full_name").eq("user_id", user.id).single(),
    sb.from("planning_lookups").select("kind, key, label_en, label_ar, metadata")
      .in("kind", LOOKUP_KINDS).eq("is_active", true).order("sort_order"),
  ]);

  if (lookupRead.error) console.error("[planning_lookups]", lookupRead.error.message);

  const initialFactoryId = params.factory ?? null;
  const listed = (factoryRead.data ?? []) as readonly ImmediateFactory[];
  const factories = initialFactoryId ? await readLinkedFactory(sb, listed, initialFactoryId) : listed;
  const lookups = lookupRead.error ? [] : (lookupRead.data ?? []) as readonly LookupRow[];
  const lookupLabel = (row: LookupRow) => locale === "ar" && row.label_ar ? row.label_ar : row.label_en;
  const inspectors: readonly ImmediateInspector[] = (inspectorRead.data ?? [])
    .flatMap((row: InspectorRow) => {
      const profile = embeddedOne(row.profiles);
      return profile ? [{ user_id: row.user_id, full_name: profile.full_name }] : [];
    });
  const packages: readonly ImmediatePackage[] = (packageRead.data ?? [])
    .flatMap((row: PackageVersionRow) => {
      const inspectionPackage = embeddedOne(row.packages);
      return inspectionPackage
        ? [{ id: row.id, version_label: row.version_label, packages: inspectionPackage }]
        : [];
    });
  const manualReasons: readonly ManualReasonOption[] = lookups
    .filter(row => row.kind === "manual_entry_reason")
    .map(row => ({ key: row.key, label: lookupLabel(row) }));
  const returnTo = params.returnTo?.startsWith(FACTORY_360_RETURN_PREFIX) ? params.returnTo : null;

  return {
    kind: "ready",
    data: {
      actorMode: URGENT_REQUEST_ACTOR_MODE,
      manualEntryAllowed: MANUAL_ENTRY_ALLOWED,
      factories,
      packages,
      inspectors,
      regionOptions: distinct(factories.map(factory => factory.region)),
      cityOptions: distinct(factories.map(factory => factory.city)),
      cityByRegion: citiesByRegion(factories),
      visitTypes: visitTypeOptions(lookups, lookupLabel, immediateMessages(locale).identity.visitTypeFallback),
      manualReasons,
      actorName: profileRead.data?.full_name ?? "",
      initialFactoryId,
      handoff: {
        crNumber: params.cr ?? null,
        licenseNumber: params.license ?? null,
        returnTo,
      },
    },
  };
}
