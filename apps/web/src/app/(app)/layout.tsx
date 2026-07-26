import { type ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/Shell";
import { getServerUser } from "@/lib/supabase-server";
import { getUserRoles } from "@/lib/persona";
import { isAdminOnlyPersona, isFieldOnlyPersona } from "@/lib/shell-navigation";
import { homeForRoles } from "@/lib/role-home";

// TASK-G11-REMEDIATION-PERFORMANCE-001 · K-001/K-004
// This layout owns authenticated application chrome. Next preserves it across
// child route transitions, so sidebar/topbar/bell state and their server data
// do not remount with every page. Public, auth, API and print routes remain
// outside this route group.

// TASK-WEB-CHANNEL-ACCESS-GATE-001 — channel enforcement (rbac_matrix.csv).
// A field-only persona (RBAC-009/010: Inspector = iPad channel) is redirected
// off every web-portal route to its field home. RLS remains the write/read
// authority; this only keeps a field persona out of chrome that isn't theirs.
// Cost note: getServerUser and getUserRoles are both cache()-wrapped and are
// already read by the shared Shell in this same render, so the guard adds no
// extra auth or database round-trip (perf-neutral vs the P0 remediation).
const isFieldPath = (pathname: string) =>
  pathname === "/field" || pathname.startsWith("/field/");

const isBusinessOnlyPath = (pathname: string) => [
  "/dashboard",
  "/operations",
  "/factories",
  "/planning",
  "/reviews",
  "/ai",
].some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));

async function enforceChannelAccess() {
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (isFieldPath(pathname)) return;

  const { data: { user } } = await getServerUser();
  if (!user) return; // Unauthenticated: Shell/middleware own the /login redirect.

  const { data, error } = await getUserRoles(user.id);
  if (error) return; // Fail open to chrome; every destination still enforces RLS.
  const roleKeys = (data ?? []).map(row => row.role_key);

  if (isFieldOnlyPersona(roleKeys)) {
    // M6/CD-023 reconciliation: /planning/immediate is the documented M01-043
    // exception — inspector-persona immediate creation is preserved. Allow only
    // that single planning route; every other non-field path still redirects.
    if (pathname === "/planning/immediate") return;
    redirect(homeForRoles(roleKeys) ?? "/field");
  }

  // ADMIN-SHELL-PERSONA-001 — mirror the navigation projection at a server
  // boundary so a copied business URL cannot bypass the admin-only channel.
  // Governed admin deep links retain their route-specific RBAC/RLS guards.
  if (isAdminOnlyPersona(roleKeys) && isBusinessOnlyPath(pathname)) {
    redirect(homeForRoles(roleKeys) ?? "/admin");
  }
}

export default async function AuthenticatedAppLayout({ children }: { children: ReactNode }) {
  await enforceChannelAccess();
  // The field (inspector iPad) channel renders its OWN self-contained chrome
  // from the SAQEEL field design system — each screen has its own header and a
  // shared design bottom-nav (see (app)/field/layout.tsx). It deliberately does
  // NOT sit inside the global AppShell topbar/sidebar, which the design has no
  // equivalent for; wrapping it would double the navigation. Auth is enforced
  // per field page (getVerifiedUser → /login) and by middleware.
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (isFieldPath(pathname)) return <>{children}</>;
  return <AppShell>{children}</AppShell>;
}
