import { type ReactNode } from "react";
import { AppShell } from "@/components/Shell";

// TASK-G11-REMEDIATION-PERFORMANCE-001 · K-001/K-004
// This layout owns authenticated application chrome. Next preserves it across
// child route transitions, so sidebar/topbar/bell state and their server data
// do not remount with every page. Public, auth, API and print routes remain
// outside this route group.
export default function AuthenticatedAppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
