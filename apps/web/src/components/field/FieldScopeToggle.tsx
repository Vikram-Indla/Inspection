"use client";
// Daily/Weekly segmented control (TASK-FIELD-BRIEFING-WEEKLY-001 /
// TASK-FIELD-KPI-WEEKLY-001). Drives both the briefing card and the KPI
// strip — see FieldScopeProvider for the shared-vs-separate decision.

import { useFieldScope } from "./FieldScopeProvider";

export type FieldScopeToggleStrings = { daily: string; weekly: string; aria: string };

export default function FieldScopeToggle({ strings }: { strings: FieldScopeToggleStrings }) {
  const { scope, setScope } = useFieldScope();
  return (
    <div className="sq-segmented sq-segmented--field" role="group" aria-label={strings.aria}>
      <button type="button" aria-pressed={scope === "daily"} onClick={() => setScope("daily")}>{strings.daily}</button>
      <button type="button" aria-pressed={scope === "weekly"} onClick={() => setScope("weekly")}>{strings.weekly}</button>
    </div>
  );
}
