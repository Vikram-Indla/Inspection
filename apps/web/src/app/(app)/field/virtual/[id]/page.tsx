import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import FieldHeader from "@/components/field/FieldHeader";
import { useT } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import VirtualSessionClient, { type FieldVirtualSession } from "./VirtualSessionClient";

const STATE_LABELS: Record<string, { en: string; ar: string }> = {
  scheduled: { en: "Scheduled", ar: "مجدولة" },
  waiting: { en: "Waiting room", ar: "غرفة الانتظار" },
  joined: { en: "Joined", ar: "تم الانضمام" },
  verified: { en: "Verified", ar: "تم التحقق" },
  in_progress: { en: "In progress", ar: "قيد التنفيذ" },
  closed: { en: "Closed", ar: "مغلقة" },
};

export default async function FieldVirtualSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [sb, { t, locale }] = await Promise.all([supabaseServer(), useT()]);
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login");
  const { data, error } = await sb.from("virtual_sessions")
    .select("id, state, appointment_at, timeline, visit_id, visits(id, package_versions(version_label, packages(code)), factories(name, factory_code), assignments(inspector_id), inspections(id, status)), virtual_participants(id, display_name, role, joined_at, verified_at)")
    .eq("id", id).single();
  if (error || !data) notFound();
  const session = data as unknown as FieldVirtualSession;
  if (!session.visits?.assignments?.some(a => a.inspector_id === user.id)) notFound();
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const stateLabel = STATE_LABELS[session.state];

  return (
    <>
      <FieldHeader
        leading={<Link href="/field/virtual" className="btn btn-icon btn-ghost" aria-label={tr("common.back", "Back", "رجوع")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" data-directional><path d="M15 6l-6 6 6 6" /></svg>
        </Link>}
        title={tr("field.virtual.sessionTitle", "Remote inspection session", "جلسة تفتيش عن بُعد")}
        subtitle={<>{session.visits.factories?.name} · <span className="id-code"><bdi>{session.id.slice(0, 8)}</bdi></span></>}
        right={stateLabel ? <span className="badge badge-info">{locale === "ar" ? stateLabel.ar : stateLabel.en}</span> : null}
        langHref={locale === "ar" ? "/locale?set=en" : "/locale?set=ar"}
        langLabel={locale === "ar" ? "EN" : "AR"}
      />
      <VirtualSessionClient session={session} locale={locale === "ar" ? "ar" : "en"} userId={user.id} />
    </>
  );
}
