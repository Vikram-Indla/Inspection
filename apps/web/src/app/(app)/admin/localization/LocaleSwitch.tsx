"use client";

export default function LocaleSwitch({ locale }: { locale: "en" | "ar" }) {
  const nextLocale = locale === "ar" ? "en" : "ar";
  const label = locale === "ar" ? "English" : "العربية";

  return (
    <button
      type="button"
      className="sq-link"
      lang={nextLocale}
      aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
      onClick={() => window.location.assign(`/locale?set=${nextLocale}`)}
      style={{ padding: 0, border: 0, background: "transparent", font: "inherit", cursor: "pointer" }}
    >
      {label}
    </button>
  );
}
