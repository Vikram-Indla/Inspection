export type ExecutionRow = {
  id: string;
  visitReference: string;
  factoryId: string | null;
  factory: string;
  factoryCode: string | null;
  crNumber: string | null;
  windowStart: string;
  windowEnd: string;
  executionDate: string | null;
  reportType: string | null;
  packageCode: string | null;
  packageVersion: string | null;
  visitType: string | null;
  visitMode: string | null;
  risk: string | null;
  priority: string | null;
  inspectorId: string | null;
  inspector: string | null;
  assignmentMethod: string | null;
  assignmentStatus: string | null;
  region: string | null;
  city: string | null;
  operationalState: string;
  planningStatus: string;
  lat: number | null;
  lng: number | null;
  journeyStatus: string | null;
  journeyStartedAt: string | null;
  journeyEndedAt: string | null;
};

export const EXECUTION_VIEWS = ["mine", "all", "map"] as const;
export type ExecutionView = (typeof EXECUTION_VIEWS)[number];

export const CALENDAR_MODES = ["week", "month"] as const;
export type CalendarMode = (typeof CALENDAR_MODES)[number];

export const FILTER_KEYS = ["inspector", "region", "risk", "visitMode", "operationalState"] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];

export type ExecutionFilters = Partial<Record<FilterKey, string>>;

export type RescheduleRequest = {
  row: ExecutionRow;
  date: string | null;
};
