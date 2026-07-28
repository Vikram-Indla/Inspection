import type { ReactNode } from "react";
import AdminRouteBoundary from "@/components/AdminRouteBoundary";
import AdminScreenRegistry from "./_components/AdminScreenRegistry";

// CC-SAQEEL-RESPONSIVE-REVAMP-001: legacy capability profiles map to the
// canonical Administrator presentation role. Planner and Inspector deliberately
// reach the localized unauthorized state; nested module boundaries still apply
// their narrower maker-checker and specialty-role rules.
const ADMINISTRATOR_CAPABILITY_ROLES = [
  "admin",
  "compliance_admin",
  "form_admin",
  "workflow_admin",
  "security_admin",
  "gis_admin",
  "risk_owner",
  "reviewer",
  "ops",
  "auditor",
  "leadership",
] as const;

export default function AdministrationLayout({ children }: { children: ReactNode }) {
  return (
    <AdminRouteBoundary allowedRoles={ADMINISTRATOR_CAPABILITY_ROLES}>
      <AdminScreenRegistry>{children}</AdminScreenRegistry>
    </AdminRouteBoundary>
  );
}
