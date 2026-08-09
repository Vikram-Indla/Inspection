import type { DateRangePreset } from "./date-range-picker";

export type DateRangePresetLabels = Readonly<Record<
  "today" | "last7Days" | "last30Days" | "last90Days" | "lastYear" | "next7Days" | "next30Days",
  string
>>;

export function pastDateRangePresets(labels: DateRangePresetLabels): readonly DateRangePreset[] {
  return [
    { id: "today", label: labels.today, days: 1 },
    { id: "last7", label: labels.last7Days, days: 7 },
    { id: "last30", label: labels.last30Days, days: 30 },
    { id: "last90", label: labels.last90Days, days: 90 },
    { id: "lastYear", label: labels.lastYear, days: 365 },
  ];
}

export function upcomingDateRangePresets(labels: DateRangePresetLabels): readonly DateRangePreset[] {
  return [
    { id: "next7", label: labels.next7Days, days: 7, direction: "future" },
    { id: "next30", label: labels.next30Days, days: 30, direction: "future" },
  ];
}

export function windowDateRangePresets(labels: DateRangePresetLabels): readonly DateRangePreset[] {
  return [...pastDateRangePresets(labels), ...upcomingDateRangePresets(labels)];
}
