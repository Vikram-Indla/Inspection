import type { ReactNode } from "react";
import AdminRouteBoundary from "@/components/AdminRouteBoundary";

export default function ViolationsLayout({ children }: { children: ReactNode }) {
  return <AdminRouteBoundary allowedRoles={["admin", "supervisor", "compliance_admin", "form_admin", "reviewer"]}>{children}</AdminRouteBoundary>;
}
