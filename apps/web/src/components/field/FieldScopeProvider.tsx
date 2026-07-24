"use client";
// Shared Daily/Weekly scope for the field dashboard (TASK-FIELD-BRIEFING-WEEKLY-001,
// TASK-FIELD-KPI-WEEKLY-001 — both sponsor-owned deviations).
//
// Decision: ONE shared toggle drives both the briefing card (Task 3) and the
// KPI tiles (Task 4), not two independent toggles. Rationale: both surfaces
// answer the same underlying question ("today, or the past 7 days?") off the
// same visit/inspection rows; a single control is less UI clutter on an iPad
// dashboard that is already dense, and prevents the confusing state where the
// KPIs say "today" while the briefing says "this week" (or vice versa).
// Persisted client-side only (localStorage) — this is a display preference,
// not something that needs server round-tripping or governance tracking.

import { createContext, useContext, useEffect, useState } from "react";

export type FieldScope = "daily" | "weekly";

const STORAGE_KEY = "field.dashboard.scope";

const FieldScopeContext = createContext<{ scope: FieldScope; setScope: (s: FieldScope) => void }>({
  scope: "daily",
  setScope: () => {},
});

export function FieldScopeProvider({ children }: { children: React.ReactNode }) {
  const [scope, setScopeState] = useState<FieldScope>("daily");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "daily" || stored === "weekly") setScopeState(stored);
    } catch { /* localStorage unavailable — default to daily */ }
  }, []);

  const setScope = (s: FieldScope) => {
    setScopeState(s);
    try { window.localStorage.setItem(STORAGE_KEY, s); } catch { /* best-effort persistence only */ }
  };

  return <FieldScopeContext.Provider value={{ scope, setScope }}>{children}</FieldScopeContext.Provider>;
}

export function useFieldScope() {
  return useContext(FieldScopeContext);
}
