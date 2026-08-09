import type { PlanningSearchParams } from "./queries";

const firstValue = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export function planningHref(sp: PlanningSearchParams, overrides: Record<string, string>): string {
  const merged: Record<string, string> = {};
  for (const [key, value] of Object.entries(sp)) {
    const single = firstValue(value);
    if (single) merged[key] = single;
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value) merged[key] = value;
    else delete merged[key];
  }
  const qs = new URLSearchParams(merged).toString();
  return qs ? `/planning?${qs}` : "/planning";
}

export function continueDraftHref(draft: { id: string; method: string }): string {
  if (draft.method === "bulk") return `/planning/bulk/review?plan=${draft.id}`;
  if (draft.method === "single") return `/planning/single?plan=${draft.id}`;
  return `/planning/immediate?plan=${draft.id}`;
}
