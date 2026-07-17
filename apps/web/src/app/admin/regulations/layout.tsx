import type { ReactNode } from "react";
import AdminRouteBoundary from "@/components/AdminRouteBoundary";

export default function RegulationsLayout({ children }: { children: ReactNode }) {
  return <AdminRouteBoundary allowedRoles={["compliance_admin", "reviewer"]}>{children}</AdminRouteBoundary>;
}
