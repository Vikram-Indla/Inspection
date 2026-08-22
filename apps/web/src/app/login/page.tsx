import "./login.css";
import { cookies, headers } from "next/headers";
import { getMessages } from "@/i18n/messages";
import FieldLoginClient from "./field/FieldLoginClient";
import StoryPanel from "./StoryPanel";

export const dynamic = "force-dynamic";

type Locale = "ar" | "en";

async function resolveLocale(): Promise<Locale> {
  const headerBag = await headers();
  const fromPath = headerBag.get("x-locale");
  if (fromPath === "ar" || fromPath === "en") return fromPath;
  const chosen = (await cookies()).get("login_locale")?.value;
  if (chosen === "ar" || chosen === "en") return chosen;
  const accept = headerBag.get("accept-language")?.toLowerCase() ?? "";
  return /(^|[,\s])ar\b/.test(accept) ? "ar" : "en";
}

export default async function Login({ searchParams }: {
  searchParams: Promise<{ next?: string; reason?: string }>;
}) {
  const sp = await searchParams;
  const locale = await resolveLocale();
  const { login } = getMessages(locale);
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <div className="lg-page lg-page--split" dir={dir} lang={locale}>
      <FieldLoginClient s={login} dir={dir} lang={locale}
        localeHref={locale === "ar" ? "/locale?set=en" : "/locale?set=ar"}
        returnTo={sp.next} reason={sp.reason} />
      <StoryPanel strings={login.atlas} locale={locale} />
    </div>
  );
}
