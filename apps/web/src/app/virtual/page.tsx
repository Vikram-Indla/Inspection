import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import ScheduleForm, { type ScheduleFormStrings } from "./ScheduleForm";

export const dynamic = "force-dynamic";

export default async function VirtualList() {
  const { t } = await useT();
  const sb = await supabaseServer();
  const { data: sessions, error } = await sb.from("virtual_sessions")
    .select("id, state, appointment_at, visits(id, factories(name, factory_code), inspections(id, status))")
    .order("appointment_at");
  const { data: vvisits } = await sb.from("visits")
    .select("id, window_start, factories(name), virtual_sessions(id)")
    .eq("execution_mode", "virtual").eq("planning_status", "published");
  const rows = (sessions ?? [])
    .map(s => ({ s, v: s.visits as unknown as { id: string; factories: { name: string; factory_code: string } | null } | null }))
    .filter((r): r is { s: typeof r.s; v: NonNullable<typeof r.v> & { factories: NonNullable<NonNullable<typeof r.v>["factories"]> } } => { return !!r.v && !!r.v.factories; });
  // visits -> virtual_sessions is a TO-ONE embed (unique visit_id): object|null.
  const unscheduled = (vvisits ?? []).filter(v => {
    const s = v.virtual_sessions as unknown;
    return Array.isArray(s) ? s.length === 0 : !s;
  });
  const scheduleStrings: ScheduleFormStrings = {
    appointment: t("virtual.schedule.appointment", "Appointment"),
    repName: t("virtual.schedule.repName", "Factory representative"),
    repNamePh: t("virtual.schedule.repNamePh", "full name — OTP identity binds to this person"),
    submit: t("virtual.schedule.submit", "Schedule session"),
    working: t("virtual.schedule.working", "Scheduling…"),
  };
  return (
    <Shell current="/virtual" title={t("virtual.list.title", "Virtual inspections")}
      context={<span className="ax-lozenge ax-lozenge--info">{t("virtual.list.context", "SCR-VIR-700 · confirmed sessions only")}</span>}>
      {error && <div className="ax-banner ax-banner--critical"><div>{t("virtual.list.loadError", "Couldn’t load sessions. Try again or contact support.")}</div></div>}
      {!error && rows.length === 0 && (
        <div className="ax-surface"><div className="ax-state">
          <span className="ax-state__glyph">📹</span><h4>{t("virtual.list.empty", "No virtual sessions in scope")}</h4>
        </div></div>
      )}
      <div className="ax-tablewrap"><table className="ax-table">
        <thead><tr><th scope="col">{t("virtual.list.colSession", "Session")}</th><th scope="col">{t("virtual.list.colFactory", "Factory")}</th><th scope="col" className="ax-td-num">{t("virtual.list.colAppointment", "Appointment")}</th><th scope="col">{t("virtual.list.colState", "State")}</th><th scope="col"></th></tr></thead>
        <tbody>
          {rows.map(({ s, v }) => (
              <tr key={s.id}>
                <td className="ax-numeric"><strong>{s.id.slice(0, 8)}</strong></td>
                <td>{v.factories.name} <span className="ax-caption">{v.factories.factory_code}</span></td>
                <td className="ax-td-num ax-numeric">{new Date(s.appointment_at).toISOString().slice(0, 16).replace("T", " ")}</td>
                <td><span className={`ax-lozenge ax-lozenge--virtual ${s.state === "verified" ? "ax-lozenge--success" : "ax-lozenge--info"}`}>{t(`enum.${s.state}`, s.state.replace(/_/g, " "))}</span></td>
                <td><a className="ax-link" href={`/virtual/${s.id}`}>{t("virtual.list.openRoom", "open room →")}</a></td>
              </tr>
          ))}
        </tbody>
      </table></div>
      {unscheduled.length > 0 && (
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
          <h4>{t("virtual.list.scheduleHeading", "Schedule a session (M05-002)")}</h4>
          <p className="ax-caption">{t("virtual.list.scheduleHint", "Published virtual visits without a session. Scheduling creates the room, binds participants and notifies the inspector; the factory representative row records its SMS delivery state honestly (provider adapter pending).")}</p>
          {unscheduled.map(v => (
            <div key={v.id} className="ax-stack" style={{ gap: "var(--ax-space-100)" }}>
              <strong>{(v.factories as unknown as { name: string } | null)?.name}{" "}
                <span className="ax-caption ax-numeric">{new Date(v.window_start).toISOString().slice(0, 10)}</span></strong>
              <ScheduleForm visitId={v.id} strings={scheduleStrings} />
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}
