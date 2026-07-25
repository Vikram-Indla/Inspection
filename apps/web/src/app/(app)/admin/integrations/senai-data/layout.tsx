import type { ReactNode } from "react";
import AdminRouteBoundary from "@/components/AdminRouteBoundary";

export default function SenaiDataLayout({ children }: { children: ReactNode }) {
  return <AdminRouteBoundary allowedRoles={["security_admin", "workflow_admin", "compliance_admin"]}>{children}</AdminRouteBoundary>;
}
