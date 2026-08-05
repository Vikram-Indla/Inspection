import type { ReactNode } from "react";
import AdminRouteBoundary from "@/components/AdminRouteBoundary";

export default function ItemsLayout({ children }: { children: ReactNode }) {
  return <AdminRouteBoundary allowedRoles={["admin", "compliance_admin", "form_admin", "reviewer"]}>{children}</AdminRouteBoundary>;
}
