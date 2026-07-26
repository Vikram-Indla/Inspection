import type { ReactNode } from "react";
import AdminRouteBoundary from "@/components/AdminRouteBoundary";
import { ADMINISTRATOR_CAPABILITY_ROLES } from "@/lib/admin-role-convergence";

export default function AdministrationLayout({ children }: { children: ReactNode }) {
  return (
    <AdminRouteBoundary allowedRoles={ADMINISTRATOR_CAPABILITY_ROLES}>
      {children}
    </AdminRouteBoundary>
  );
}
