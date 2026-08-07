import { cache } from "react";
import { headers } from "next/headers";
import { useT } from "@/lib/i18n";
import { getRoleTitles, getShellRegions, getUserProfile, getUserRoles } from "@/lib/persona";
import { getServerUser } from "@/lib/supabase-server";
import {
  buildShellNavigation,
  isFieldOnlyPersona,
  shellScopeForRoute,
} from "@/lib/shell-navigation";
import { toRoleTitles, toShellIdentity, toShellNavGroups } from "./mappers";
import type { ShellView } from "./types";

export const getShellPathname = cache(async (): Promise<string> => {
  const requestHeaders = await headers();
  return requestHeaders.get("x-pathname") || "/";
});

const getShellRoles = cache(async (userId: string): Promise<readonly string[]> => {
  const { data } = await getUserRoles(userId);
  return Array.from(new Set((data ?? []).map(row => row.role_key))).sort();
});

const getShellRegionNames = cache(async (): Promise<readonly string[]> => {
  const { data, error } = await getShellRegions();
  if (error) return [];
  return Array.from(
    new Set((data ?? [])
      .map(row => row.region)
      .filter((value): value is string => !!value)),
  ).sort();
});

export const getShellView = cache(async (): Promise<ShellView | null> => {
  const [{ t, locale }, { data: { user } }, pathname] = await Promise.all([
    useT(),
    getServerUser(),
    getShellPathname(),
  ]);
  if (!user) return null;

  const email = user.email ?? user.id;
  const roles = await getShellRoles(user.id);
  const [regions, profileRead, titleRead] = await Promise.all([
    getShellRegionNames(),
    getUserProfile(user.id),
    getRoleTitles(),
  ]);

  const roleTitles = toRoleTitles(roles, titleRead.data ?? []);
  const profile = profileRead.data ?? null;

  return {
    locale,
    pathname,
    groups: toShellNavGroups(buildShellNavigation(roles), locale, t),
    identity: toShellIdentity({
      email,
      fullName: profile?.full_name ?? null,
      region: profile?.region ?? null,
      roles,
      roleTitles,
    }),
    regions,
    roles,
    isFieldOnly: isFieldOnlyPersona(roles),
    isAdminWorkspace: pathname === "/admin" || pathname.startsWith("/admin/"),
    scope: shellScopeForRoute(pathname),
  };
});
