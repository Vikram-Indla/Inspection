"use client";

const COPY = {
  en: {
    heading: "Factory 360 is unavailable",
    body: "The authorized factory data could not be read. No record was changed.",
    retry: "Retry Factory 360",
  },
  ar: {
    heading: "المصنع 360 غير متاح",
    body: "تعذّرت قراءة بيانات المصنع المصرح بها. لم يتم تغيير أي سجل.",
    retry: "إعادة محاولة تحميل المصنع 360",
  },
};

export default function Factory360ErrorState({ reset }: { reset: () => void }) {
  const locale = typeof document !== "undefined" && document.cookie.includes("locale=ar") ? "ar" : "en";
  const copy = COPY[locale];
  return (
    <div className="sq-surface">
      <div className="sq-state" role="alert" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
        <span className="sq-state__glyph" aria-hidden="true">⚠</span>
        <h4>{copy.heading}</h4>
        <p className="sq-caption">{copy.body}</p>
        <button className="sq-btn sq-btn--secondary" type="button" onClick={reset}>{copy.retry}</button>
      </div>
    </div>
  );
}
