import type { ReactNode } from "react";
import AdminRouteBoundary from "@/components/AdminRouteBoundary";

export default function ComplianceRequestsLayout({ children }: { children: ReactNode }) {
  return <AdminRouteBoundary allowedRoles={["compliance_admin", "form_admin", "reviewer"]}>{children}</AdminRouteBoundary>;
}
