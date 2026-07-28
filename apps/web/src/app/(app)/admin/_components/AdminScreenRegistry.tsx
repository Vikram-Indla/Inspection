"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

const ADMIN_SCREENS = [
  ["/admin/access", "ADM-S01"],
  ["/admin/audit", "ADM-S02"],
  ["/admin/bulk-violations", "ADM-S03"],
  ["/admin/compliance-approvals", "ADM-S04"],
  ["/admin/compliance-requests/:id", "ADM-S05"],
  ["/admin/compliance-requests/new", "ADM-S06"],
  ["/admin/compliance-requests", "ADM-S07"],
  ["/admin/devices", "ADM-S08"],
  ["/admin/enforcement-recommendations", "ADM-S09"],
  ["/admin/gis", "ADM-S10"],
  ["/admin/gis/spatial", "ADM-S11"],
  ["/admin/integrations/factory-data", "ADM-S12"],
  ["/admin/integrations", "ADM-S13"],
  ["/admin/integrations/senai-data", "ADM-S14"],
  ["/admin/items/:id/runtime-preview", "ADM-S15"],
  ["/admin/items", "ADM-S16"],
  ["/admin/localization", "ADM-S17"],
  ["/admin/notifications", "ADM-S18"],
  ["/admin/operations", "ADM-S19"],
  ["/admin/packages", "ADM-S20"],
  ["/admin", "ADM-S21"],
  ["/admin/planning/expiry", "ADM-S22"],
  ["/admin/planning/lookups", "ADM-S23"],
  ["/admin/planning/status", "ADM-S24"],
  ["/admin/regulations/:id", "ADM-S25"],
  ["/admin/regulations", "ADM-S26"],
  ["/admin/risk/models", "ADM-S27"],
  ["/admin/risk", "ADM-S28"],
  ["/admin/security-access", "ADM-S29"],
  ["/admin/templates", "ADM-S30"],
  ["/admin/violations", "ADM-S31"],
  ["/admin/workflows", "ADM-S32"],
] as const;

function matchesRoute(pathname: string, route: string): boolean {
  if (!route.includes(":id")) return pathname === route;
  const parts = route.split("/");
  const candidate = pathname.split("/");
  return parts.length === candidate.length
    && parts.every((part, index) => part === ":id" ? candidate[index].length > 0 : part === candidate[index]);
}

export default function AdminScreenRegistry({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const screen = ADMIN_SCREENS.find(([route]) => route === pathname)
    ?? ADMIN_SCREENS.find(([route]) => matchesRoute(pathname, route));

  return (
    <div
      className="stack"
      data-saqeel-admin-screen={screen?.[1] ?? "ADM-UNMAPPED"}
      data-saqeel-admin-route={screen?.[0] ?? pathname}
    >
      {children}
    </div>
  );
}
