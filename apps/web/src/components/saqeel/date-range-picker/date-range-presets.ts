import type { DateRangePreset } from "./date-range-picker";

export type DateRangePresetLabels = Readonly<Record<
  "today" | "last7Days" | "last30Days" | "last90Days" | "lastYear" | "next7Days" | "next30Days",
  string
>>;

type PastPreset = { readonly id: string; readonly days: number; readonly labelKey: keyof DateRangePresetLabels };

/**
 * The one past-window vocabulary, as data.
 *
 * A screen that filters by "the last N days" without rendering a calendar still
 * has to offer the same N as everywhere else — exporting the days lets it reuse
 * the vocabulary without reaching for the picker.
 */
export const PAST_DATE_RANGE_PRESETS: readonly PastPreset[] = [
  { id: "today", days: 1, labelKey: "today" },
  { id: "last7", days: 7, labelKey: "last7Days" },
  { id: "last30", days: 30, labelKey: "last30Days" },
  { id: "last90", days: 90, labelKey: "last90Days" },
  { id: "lastYear", days: 365, labelKey: "lastYear" },
];

export function pastDateRangePresets(labels: DateRangePresetLabels): readonly DateRangePreset[] {
  return PAST_DATE_RANGE_PRESETS.map(preset => ({
    id: preset.id, label: labels[preset.labelKey], days: preset.days,
  }));
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
