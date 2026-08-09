/* @retiring 2026-08-10 · replaced-by app/(app)/compliance/approvals · pending none — middleware.ts rewrites /admin/compliance-approvals to /compliance/approvals unconditionally, so no request reaches this segment · delete-when 0-imports */
import type { ReactNode } from "react";
import AdminRouteBoundary from "@/components/AdminRouteBoundary";

export default function ComplianceApprovalsLayout({ children }: { children: ReactNode }) {
  return <AdminRouteBoundary allowedRoles={["admin", "supervisor"]}>{children}</AdminRouteBoundary>;
}
