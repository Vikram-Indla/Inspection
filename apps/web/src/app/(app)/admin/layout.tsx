import type { ReactNode } from "react";
import AdminRouteBoundary from "@/components/AdminRouteBoundary";
import AdminScreenRegistry from "./_components/AdminScreenRegistry";

// CC-SAQEEL-RESPONSIVE-REVAMP-001: legacy capability profiles collapsed onto
// the four canonical roles (public.roles: admin, planner, supervisor,
// inspector). Supervisor absorbs the former reviewer/ops entry into the admin
// tree (needed to reach compliance-approvals/audit/enforcement-recommendations);
// every other legacy governance role folded into admin. Planner and Inspector
// deliberately reach the localized unauthorized state; nested module
// boundaries still apply their narrower maker-checker and specialty-role rules.
const ADMINISTRATOR_CAPABILITY_ROLES = [
  "admin",
  "supervisor",
] as const;

export default function AdministrationLayout({ children }: { children: ReactNode }) {
  return (
    <AdminRouteBoundary allowedRoles={ADMINISTRATOR_CAPABILITY_ROLES}>
      <AdminScreenRegistry>{children}</AdminScreenRegistry>
    </AdminRouteBoundary>
  );
}
