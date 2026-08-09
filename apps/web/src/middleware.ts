import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isInvalidRefreshToken } from "@/lib/auth/refresh-token-error";
import { DEFAULT_LOCALE, LOCALES, localeFromPathname, stripLocale, type Locale } from "@/lib/locale-path";
import { designRouteFor } from "@/lib/route-rewrites";

const PROTECTED_PAGE_PREFIXES = [
  "/dashboard",
  "/operations",
  "/factories",
  "/planning",
  "/execution",
  "/reviews",
  "/compliance",
  "/enforcement-library",
  "/analytics",
  "/admin",
  "/field",
  "/visits",
  "/launch",
  "/profile",
  "/reports",
];

function clearSupabaseAuthCookies(request: NextRequest, response: NextResponse): void {
  request.cookies.getAll()
    .filter(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"))
    .forEach(({ name }) => response.cookies.set(name, "", { path: "/", maxAge: 0 }));
}

function preferredLocale(request: NextRequest): Locale {
  const chosen = request.cookies.get("locale")?.value;
  if (LOCALES.some(locale => locale === chosen)) return chosen as Locale;
  const accept = request.headers.get("accept-language") ?? "";
  return /(^|,)\s*ar\b/i.test(accept) ? "ar" : DEFAULT_LOCALE;
}

function isLocalisable(pathname: string): boolean {
  if (pathname.startsWith("/api")) return false;
  if (pathname.startsWith("/_next")) return false;
  if (pathname.startsWith("/locale")) return false;
  return !pathname.includes(".");
}

function isProtectedPage(pathname: string): boolean {
  return PROTECTED_PAGE_PREFIXES.some(prefix =>
    pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

// TASK-WEB-CHANNEL-ACCESS-GATE-001 / M6-CD-023 reconciliation.
// The original middleware.ts sat at the package root, but this app uses src/ —
// Next only loads middleware from src/middleware.ts, so the root file never ran
// and the (app) layout's x-pathname read was always empty. An empty pathname
// fails isFieldPath, so a field-only persona was redirected off /field onto
// /field itself (ERR_TOO_MANY_REDIRECTS), which was the documented M5 blocker
// for the Inspector Immediate journey (M01-043 exception).
//
// Scope is deliberately narrower than the dead root file: it only propagates
// the resolved pathname to Server Components. Unauthenticated redirects are
// already owned by Shell/page-level guards (keeping /reset, print and API
// routes reachable), and the login locale preference is handled by the login
// flow itself — re-introducing a catch-all auth redirect here would change
// behaviour for public routes that currently work.
export async function middleware(request: NextRequest) {
  const requested = request.nextUrl.pathname;
  const localisable = isLocalisable(requested);
  const pathLocale = localisable ? localeFromPathname(requested) : null;
  const locale = pathLocale ?? preferredLocale(request);
  const pathname = pathLocale ? stripLocale(requested) : requested;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("x-locale", locale);
  const designRoute = designRouteFor(pathname, request.nextUrl.searchParams);
  const buildResponse = () => {
    const target = designRoute ?? pathname;
    if (target === requested) {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
    const rewritten = request.nextUrl.clone();
    rewritten.pathname = target;
    if (designRoute) rewritten.searchParams.set("__shellRoute", pathname);
    return NextResponse.rewrite(rewritten, { request: { headers: requestHeaders } });
  };
  let response = buildResponse();

  // Keep the browser and Server Components on the same Supabase session.
  // Without this refresh boundary, a client sign-in can render the first
  // destination but the next router.refresh() (used by locale switching)
  // reaches AppShell without a usable auth cookie and falls back to /login.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anonKey) {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = buildResponse();
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    let claimsError: unknown = null;
    try {
      const { error } = await supabase.auth.getClaims();
      claimsError = error;
    } catch (error) {
      claimsError = error;
    }

    if (isInvalidRefreshToken(claimsError)) {
      if (request.method === "GET" && isProtectedPage(pathname)) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = `/${locale}/login`;
        loginUrl.search = "";
        loginUrl.searchParams.set("next", `${requested}${request.nextUrl.search}`);
        loginUrl.searchParams.set("reason", "expired");
        response = NextResponse.redirect(loginUrl);
      } else {
        response = buildResponse();
      }
      clearSupabaseAuthCookies(request, response);
    }
  }

  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
