import { NextResponse } from "next/server";

// Language switch: /locale?set=ar|en — sets the cookie and returns whence you came.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const set = url.searchParams.get("set") === "ar" ? "ar" : "en";
  const back = request.headers.get("referer") ?? new URL("/", request.url).toString();
  const res = NextResponse.redirect(back);
  const options = { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" as const };
  res.cookies.set("locale", set, options);
  res.cookies.set("login_locale", set, options);
  return res;
}
