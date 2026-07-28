import { NextResponse } from "next/server";

const COOKIE_OPTIONS = { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" as const };

function withLocaleCookies(response: NextResponse, locale: "ar" | "en") {
  response.cookies.set("locale", locale, COOKIE_OPTIONS);
  response.cookies.set("login_locale", locale, COOKIE_OPTIONS);
  return response;
}

// Language switch: /locale?set=ar|en — sets the cookie and returns whence you came.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const set = url.searchParams.get("set") === "ar" ? "ar" : "en";
  const back = request.headers.get("referer") ?? new URL("/", request.url).toString();
  return withLocaleCookies(NextResponse.redirect(back), set);
}

// The authenticated shell uses this mutation so changing language does not
// download and navigate through the same page twice.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { locale?: unknown };
  const locale = body.locale === "ar" ? "ar" : "en";
  return withLocaleCookies(new NextResponse(null, { status: 204 }), locale);
}
