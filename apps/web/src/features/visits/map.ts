import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";

export const MAP_PAGE_SIZE = 25;

export type VisitMapParams = {
  readonly region?: string;
  readonly page?: string;
};

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

export function mapHref(basePath: string, region: string, page: number): string {
  const query = new URLSearchParams();
  if (region !== "") query.set("region", region);
  if (page > 0) query.set("page", String(page + 1));
  const search = query.toString();
  return search === "" ? `${basePath}/map` : `${basePath}/map?${search}`;
}

export function placeLabel(region: string, city: string): string {
  if (city === "") return region;
  if (region === "" || region === city) return city;
  return `${region} · ${city}`;
}
