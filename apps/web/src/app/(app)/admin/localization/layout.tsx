import type { ReactNode } from "react";
import AdminRouteBoundary from "@/components/AdminRouteBoundary";

export default function LocalizationLayout({ children }: { children: ReactNode }) {
  return <AdminRouteBoundary allowedRoles={["admin"]}>{children}</AdminRouteBoundary>;
}
