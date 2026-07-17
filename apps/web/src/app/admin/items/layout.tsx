import type { ReactNode } from "react";
import AdminRouteBoundary from "@/components/AdminRouteBoundary";

export default function ItemsLayout({ children }: { children: ReactNode }) {
  return <AdminRouteBoundary allowedRoles={["compliance_admin", "form_admin"]}>{children}</AdminRouteBoundary>;
}
