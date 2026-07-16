import type { ReactNode } from "react";
import AdminRouteBoundary from "@/components/AdminRouteBoundary";

export default function ViolationsLayout({ children }: { children: ReactNode }) {
  return <AdminRouteBoundary allowedRoles={["compliance_admin", "reviewer"]}>{children}</AdminRouteBoundary>;
}
