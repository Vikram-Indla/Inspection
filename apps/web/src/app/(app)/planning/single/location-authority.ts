export const PLANNER_LOCATION_OVERRIDE_ERROR =
  "Factory coordinates are read-only external master data and cannot be changed in Planning";

export const containsPlannerLocationOverride = (values: unknown[]) =>
  values.some(value => value != null && String(value).trim() !== "");
