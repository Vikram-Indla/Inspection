export const LOCALES = ["en", "ar"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export function localeFromPathname(pathname: string): Locale | null {
  const segment = pathname.split("/")[1];
  return LOCALES.find(locale => locale === segment) ?? null;
}

export function stripLocale(pathname: string): string {
  const locale = localeFromPathname(pathname);
  if (!locale) return pathname;
  const rest = pathname.slice(locale.length + 1);
  return rest.length > 0 ? rest : "/";
}

export function localeHref(locale: Locale, href: string): string {
  if (!href.startsWith("/")) return href;
  if (localeFromPathname(href)) return href;
  return `/${locale}${href === "/" ? "" : href}`;
}

export function switchLocaleHref(locale: Locale, pathname: string, search: string): string {
  return `${localeHref(locale, stripLocale(pathname))}${search}`;
}
