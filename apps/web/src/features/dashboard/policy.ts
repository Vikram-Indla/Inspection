import { resolveDashboardPolicyGates, resolveDashboardPolicyVersion, type ResolvedPolicy, type ResolvedPolicyGates } from "@/lib/dashboard-kpi/loader";
import type { DashboardClient } from "./sources/client-type";

export type DashboardPolicy = {
  readonly policy: ResolvedPolicy;
  readonly gates: ResolvedPolicyGates;
};

export function loadDashboardPolicy(sb: DashboardClient): Promise<DashboardPolicy> {
  return Promise.all([
    resolveDashboardPolicyVersion(sb),
    resolveDashboardPolicyGates(sb),
  ]).then(([policy, gates]) => ({ policy, gates }));
}
