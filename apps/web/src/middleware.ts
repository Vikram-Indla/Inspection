import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

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
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  const designRoute =
    request.nextUrl.pathname === "/admin/regulations" && !request.nextUrl.searchParams.has("id")
      ? "/compliance"
      : request.nextUrl.pathname === "/admin/compliance-approvals"
        ? "/compliance/approvals"
        : request.nextUrl.pathname === "/admin/violations" && !request.nextUrl.searchParams.has("mode")
          ? "/enforcement-library"
          : null;
  const buildResponse = () => {
    if (!designRoute) return NextResponse.next({ request: { headers: requestHeaders } });
    const rewritten = request.nextUrl.clone();
    rewritten.pathname = designRoute;
    rewritten.searchParams.set("__shellRoute", request.nextUrl.pathname);
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
    await supabase.auth.getClaims();
  }

  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
