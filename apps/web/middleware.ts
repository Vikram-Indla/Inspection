import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const isLogin = request.nextUrl.pathname.startsWith("/login");
  // The public access journey has its own locale preference. Fresh visits are
  // Arabic-first; an explicit English switch remains sticky. Mirror it into
  // the shared locale cookie before rendering so <html lang/dir> and the
  // login component can never disagree.
  let loginLocale: "ar" | "en" | null = null;
  if (isLogin) {
    loginLocale = request.cookies.get("login_locale")?.value === "en" ? "en" : "ar";
    request.cookies.set("login_locale", loginLocale);
    request.cookies.set("locale", loginLocale);
  }
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !isLogin) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (isLogin && loginLocale) {
    const options = { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" as const };
    response.cookies.set("login_locale", loginLocale, options);
    response.cookies.set("locale", loginLocale, options);
  }
  return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
