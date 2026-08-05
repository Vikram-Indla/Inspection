import type { ReactNode } from "react";
import AdminRouteBoundary from "@/components/AdminRouteBoundary";

export default function OperationsAdminLayout({ children }: { children: ReactNode }) {
  return <AdminRouteBoundary allowedRoles={["admin"]}>{children}</AdminRouteBoundary>;
}
