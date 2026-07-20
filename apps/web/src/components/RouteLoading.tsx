import { getLocale } from "@/lib/i18n";
import EmptyState from "@/components/EmptyState";

// Shared route-segment loading state (K-017) — matches the existing
// dashboard/loading.tsx pattern: chrome-consistent content region, busy/live
// semantics, bilingual. Segment loading.tsx files pass only their label.
export default async function RouteLoading({ en, ar, bodyEn, bodyAr }: {
  en: string; ar: string; bodyEn?: string; bodyAr?: string;
}) {
  const locale = await getLocale();
  const isAr = locale === "ar";
  return (
    <main className="ax-content" aria-busy="true" aria-live="polite">
      <EmptyState glyph="◫" title={isAr ? ar : en}
        body={isAr ? (bodyAr ?? "جارٍ تحميل البيانات المقيّدة حسب صلاحيات الصفوف.") : (bodyEn ?? "Loading RLS-scoped data.")} />
    </main>
  );
}
