import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";

export const MAP_PAGE_SIZE = 25;

export type VisitMapParams = {
  readonly region?: string;
  readonly risk?: string;
  readonly window?: string;
  readonly page?: string;
};

export type VisitMapFilter = {
  readonly region: string;
  readonly risk: string;
  readonly windowDays: number | null;
};

const RISK_BANDS: readonly string[] = ["high", "medium", "low"];
const WINDOW_CHOICES: readonly number[] = [7, 30, 90];
const DEFAULT_WINDOW_DAYS = 30;

export function resolveRisk(raw: string | undefined): string {
  return typeof raw === "string" && RISK_BANDS.includes(raw) ? raw : "";
}

export function resolveWindowDays(raw: string | undefined): number | null {
  const parsed = Number(raw);
  return WINDOW_CHOICES.includes(parsed) ? parsed : null;
}

export function windowEndIso(days: number, from: Date): string {
  return new Date(from.getTime() + days * 86_400_000).toISOString();
}

export { RISK_BANDS, WINDOW_CHOICES, DEFAULT_WINDOW_DAYS };

export type VisitMapRow = {
  readonly id: string;
  readonly reference: string;
  readonly factoryId: string;
  readonly factoryName: string;
  readonly region: string;
  readonly city: string;
  readonly inspectorLocation: string | null;
  readonly stateLabel: string;
  readonly stateTone: StatusTone;
};

export type VisitMapStrings = {
  readonly colVisit: string;
  readonly colFactory: string;
  readonly colRegionCity: string;
  readonly colInspector: string;
  readonly colState: string;
  readonly tableCaption: string;
  readonly tableEmptyTitle: string;
  readonly tableEmptyBody: string;
  readonly inspectorScopeNote: string;
  readonly unavailableScope: string;
  readonly pagePrevious: string;
  readonly pageNext: string;
  readonly pageStatus: string;
  readonly pageLabel: string;
};

const OPERATIONAL_TONE: Readonly<Record<string, StatusTone>> = {
  new: "neutral",
  prepared: "info",
  travelling: "info",
  arrived: "info",
  in_progress: "pending",
  submitted: "success",
  cancelled: "danger",
  expired: "danger",
};

export function operationalTone(state: string): StatusTone {
  return OPERATIONAL_TONE[state] ?? "neutral";
}

export function resolveRegion(raw: string | undefined): string {
  return typeof raw === "string" && raw.trim() !== "" ? raw.trim() : "";
}

export function resolvePage(raw: string | undefined): number {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 1 ? parsed - 1 : 0;
}

export function pageCountOf(total: number, pageSize: number = MAP_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function mapHref(basePath: string, filter: VisitMapFilter, page: number): string {
  const query = new URLSearchParams();
  if (filter.region !== "") query.set("region", filter.region);
  if (filter.risk !== "") query.set("risk", filter.risk);
  if (filter.windowDays !== null) query.set("window", String(filter.windowDays));
  if (page > 0) query.set("page", String(page + 1));
  const search = query.toString();
  return search === "" ? `${basePath}/map` : `${basePath}/map?${search}`;
}

export function placeLabel(region: string, city: string): string {
  if (city === "") return region;
  if (region === "" || region === city) return city;
  return `${region} · ${city}`;
}
