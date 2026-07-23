import { NextResponse, type NextRequest } from "next/server";

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
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
