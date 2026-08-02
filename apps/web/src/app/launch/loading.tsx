import "../login/login.css";
import { useT } from "@/lib/i18n";

// CD-003 frame 1a/1b — the resolving state. Next.js shows this Suspense
// fallback only while the async Launch server component (session + role
// query) is genuinely still awaiting — there is no artificial delay, and
// successful routing is never held up for it. No nav, no Shell, no role or
// destination is named (the redirect target is only known once resolution
// completes, at which point this never renders again).
export default async function Loading() {
  const { t, dir, locale } = await useT();
  return (
    <div className="lg-page" dir={dir} lang={locale}>
      <main className="lg-center">
        <div className="lg-card lg-waiting" role="status" aria-busy="true">
          <div className="lg-waiting__spinner" aria-hidden="true" />
          <p className="lg-card__sub">{t("launch.preparing", "Getting things ready…")}</p>
        </div>
      </main>
    </div>
  );
}
