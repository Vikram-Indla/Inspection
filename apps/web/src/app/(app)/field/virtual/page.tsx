import Link from "next/link";
import { redirect } from "next/navigation";
import FieldHeader from "@/components/field/FieldHeader";
import { formatDateTime } from "@/lib/dates";
import { useT } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import styles from "./virtual.module.css";

type SessionRow = {
  id: string;
  state: string;
  appointment_at: string;
  visits: {
    id: string;
    factories: { name: string; factory_code: string | null } | null;
    assignments: { inspector_id: string }[];
  } | null;
};

const STATE_LABELS: Record<string, { en: string; ar: string }> = {
  scheduled: { en: "Scheduled", ar: "مجدولة" },
  waiting: { en: "Waiting room", ar: "غرفة الانتظار" },
  joined: { en: "Joined", ar: "تم الانضمام" },
  verified: { en: "Verified", ar: "تم التحقق" },
  in_progress: { en: "In progress", ar: "قيد التنفيذ" },
  closed: { en: "Closed", ar: "مغلقة" },
};

export default async function FieldVirtualSessionsPage() {
  const [sb, { t, locale }] = await Promise.all([supabaseServer(), useT()]);
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login");
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const { data, error } = await sb.from("virtual_sessions")
    .select("id, state, appointment_at, visits(id, factories(name, factory_code), assignments(inspector_id))")
    .order("appointment_at");
  const sessions = ((data ?? []) as unknown as SessionRow[]).filter(
    session => session.visits?.assignments?.some(a => a.inspector_id === user.id),
  );
  const partial = sessions.some(session => !session.visits?.factories);

  return (
    <>
      <FieldHeader
        leading={<Link href="/field" className="btn btn-icon btn-ghost" aria-label={tr("common.back", "Back", "رجوع")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" data-directional><path d="M15 6l-6 6 6 6" /></svg>
        </Link>}
        title={tr("field.virtual.title", "Remote inspection sessions", "جلسات التفتيش عن بُعد")}
        subtitle={tr("field.virtual.subtitle", "Confirmed appointments assigned to you", "المواعيد المؤكدة المسندة إليك")}
        langHref={locale === "ar" ? "/locale?set=en" : "/locale?set=ar"}
        langLabel={locale === "ar" ? "EN" : "AR"}
      />
      <main className={styles.wrap}>
        {error ? (
          <div className={styles.alert} role="alert">
            {tr("field.virtual.loadError", "Sessions are temporarily unavailable. No appointment data was inferred.", "الجلسات غير متاحة مؤقتًا. لم يتم افتراض أي بيانات للمواعيد.")}
          </div>
        ) : sessions.length === 0 ? (
          <div className={styles.empty} role="status">
            <strong>{tr("field.virtual.empty", "No virtual sessions assigned", "لا توجد جلسات افتراضية مسندة")}</strong>
            <span>{tr("field.virtual.emptyBody", "A confirmed virtual appointment will appear here when it is assigned to you.", "سيظهر الموعد الافتراضي المؤكد هنا عند إسناده إليك.")}</span>
          </div>
        ) : (
          <>
            {partial && <div className={styles.alert} role="status">
              {tr("field.virtual.partial", "Some linked appointment details are unavailable. Missing values are left blank.", "بعض تفاصيل المواعيد المرتبطة غير متاحة. تُترك القيم الناقصة فارغة.")}
            </div>}
            <section className={styles.list} aria-label={tr("field.virtual.list", "Virtual sessions", "الجلسات الافتراضية")}>
              {sessions.map(session => {
                const label = STATE_LABELS[session.state];
                return (
                  <Link key={session.id} href={`/field/virtual/${session.id}`} className={styles.sessionRow}>
                    <span className={styles.videoIcon} aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="5" width="14" height="14" rx="2" /><path d="m16 9 6-3v12l-6-3" /></svg>
                    </span>
                    <span className={styles.sessionCopy}>
                      <strong>{session.visits?.factories?.name ?? null}</strong>
                      <span>
                        {session.visits?.factories?.factory_code ? <><bdi>{session.visits.factories.factory_code}</bdi> · </> : null}
                        {session.appointment_at ? formatDateTime(session.appointment_at, locale) : null}
                      </span>
                      <span className="id-code"><bdi>{session.id.slice(0, 8)}</bdi></span>
                    </span>
                    {label ? <span className="badge badge-info">{locale === "ar" ? label.ar : label.en}</span> : null}
                    <span aria-hidden="true">›</span>
                  </Link>
                );
              })}
            </section>
          </>
        )}
      </main>
    </>
  );
}
