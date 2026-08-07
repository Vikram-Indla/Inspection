import { collectPostgrestPages, type PostgrestPage } from "@/lib/supabase-pagination";
import type { OperationsClient } from "./client-type";
import type { FactoryRow } from "../types";

const FACTORY_COLUMNS =
  "id, name, region, city, official_lat, official_lng, geofence_radius_m, risk_score, risk_band, activity_class, factory_code, source";

const RISK_BOARD_LIMIT = 8;

export function loadFactories(sb: OperationsClient, factoryCodes: readonly string[]) {
  return collectPostgrestPages<FactoryRow>((from, to) => sb.from("factories")
    .select(FACTORY_COLUMNS)
    .in("factory_code", [...factoryCodes])
    .order("name", { ascending: true })
    .order("id", { ascending: true })
    .range(from, to) as unknown as PromiseLike<PostgrestPage<FactoryRow>>);
}

export function loadRiskBoard(sb: OperationsClient, factoryCodes: readonly string[]) {
  return sb.from("factories")
    .select(FACTORY_COLUMNS)
    .in("factory_code", [...factoryCodes])
    .not("risk_score", "is", null)
    .order("risk_score", { ascending: false })
    .limit(RISK_BOARD_LIMIT) as unknown as PromiseLike<PostgrestPage<FactoryRow>>;
}
