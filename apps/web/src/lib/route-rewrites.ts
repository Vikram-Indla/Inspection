/**
 * The three routes that are typed by the user under one path and rendered by
 * another.
 *
 * `alias` is what the navigation links to and what the address bar shows.
 * `design` is the segment that actually renders. `keepAliasWhen` names a query
 * parameter whose presence cancels the rewrite, because that variant has its
 * own screen.
 *
 * This lived inline in `middleware.ts`, which meant the shell had no way to
 * know a path had been rewritten — the two spaces drifted and the rail
 * disagreed with itself between server and client (WEB task T-039).
 */
export type RouteRewrite = {
  readonly alias: string;
  readonly design: string;
  readonly keepAliasWhen?: string;
};

export const ROUTE_REWRITES: readonly RouteRewrite[] = [
  { alias: "/admin/regulations", design: "/compliance", keepAliasWhen: "id" },
  { alias: "/admin/compliance-approvals", design: "/compliance/approvals" },
  { alias: "/admin/violations", design: "/enforcement-library", keepAliasWhen: "mode" },
];

/** The segment that renders `pathname`, or `null` when it renders itself. */
export function designRouteFor(pathname: string, searchParams: URLSearchParams): string | null {
  const rewrite = ROUTE_REWRITES.find(entry => entry.alias === pathname);
  if (!rewrite) return null;
  if (rewrite.keepAliasWhen && searchParams.has(rewrite.keepAliasWhen)) return null;
  return rewrite.design;
}

/**
 * The path the navigation is expressed in.
 *
 * Navigation hrefs are all in alias space, so a design route has to be mapped
 * back before it can be compared against one. Applying this to **both** the
 * server-resolved pathname and the client's `usePathname()` makes the two agree
 * whichever space each of them happens to report — which is what stops the rail
 * from claiming one thing in the server HTML and another at hydration.
 */
export function shellRouteOf(pathname: string): string {
  return ROUTE_REWRITES.find(entry => entry.design === pathname)?.alias ?? pathname;
}
