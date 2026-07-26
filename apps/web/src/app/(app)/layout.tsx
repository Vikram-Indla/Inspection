import { type ReactNode } from "react";
import { AppShell } from "@/components/Shell";

// TASK-G11-REMEDIATION-PERFORMANCE-001 · K-001/K-004
// This layout owns authenticated application chrome. Next preserves it across
// child route transitions, so sidebar/topbar/bell state and their server data
// do not remount with every page. Public, auth, API and print routes remain
// outside this route group.

export default async function AuthenticatedAppLayout({ children }: { children: ReactNode }) {
  // CC-SAQEEL-RESPONSIVE-REVAMP-001: every authenticated route now owns the
  // same persistent shell. Visibility is not authorization; destination pages,
  // server actions and RLS retain their guards.
  return <AppShell>{children}</AppShell>;
}
