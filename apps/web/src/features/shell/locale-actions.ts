"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { switchLocaleHref, type Locale } from "@/lib/locale-path";

const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function switchLocale(next: Locale, search: string): Promise<void> {
  const store = await cookies();
  store.set("locale", next, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
  });
  const pathname = (await headers()).get("x-pathname") ?? "/";
  redirect(switchLocaleHref(next, pathname, search));
}
