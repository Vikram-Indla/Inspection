import type { ReactNode } from "react";
import AdminRouteBoundary from "@/components/AdminRouteBoundary";

export default function NewComplianceRequestLayout({ children }: { children: ReactNode }) {
  return <AdminRouteBoundary allowedRoles={["compliance_admin", "form_admin"]}>{children}</AdminRouteBoundary>;
}
