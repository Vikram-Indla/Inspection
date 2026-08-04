import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { isTestFixtureEstablishment } from "@/lib/field/fixtures";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type ViolationRow = {
  id: string;
  mapping_version: string;
  invalidated_at: string | null;
  inspections: {
    id: string;
    status: string;
    started_at: string | null;
    submitted_at: string | null;
    visits: {
      id: string;
      factories: {
        id: string;
        name: string;
        factory_code: string | null;
        license_number: string | null;
        region: string | null;
        city: string | null;
      } | null;
      assignments: Array<{
        status: string;
        profiles: { full_name: string } | null;
      }>;
    } | null;
    action_forms: Array<{
      id: string;
      violation_id: string | null;
      form_type: string;
      status: string;
      due_at: string | null;
      owner_name: string | null;
      owner_role: string | null;
      required_correction: string | null;
      is_blocking: boolean;
    }>;
    evidence: Array<{
      id: string;
      linked_id: string;
      content_sha256: string | null;
    }>;
  } | null;
  violation_codes: {
    title: string;
    code: string;
    level: string;
    corrective_action: string | null;
  } | null;
};

type PenaltyRow = {
  violation_id: string;
  status: string;
  mapping_snapshot: {
    penalty_type?: string;
    penalty_ref?: string;
    mapping_version?: string;
  } | null;
};

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : "";

export default async function EnforcementLibrary({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sb = await supabaseServer();
  const [sp, locale, verified] = await Promise.all([
    searchParams,
    getLocale(),
    getVerifiedUser(sb),
  ]);
  const copy = (en: string, ar: string) => locale === "ar" ? ar : en;
  const q = one(sp.q).trim().toLowerCase();
  const status = one(sp.status);
  const range = Number(one(sp.range) || 0);
  const region = one(sp.region);
  const selectedId = one(sp.violation);

  if (verified.error || !verified.data.user) {
    return (
      <Shell current="/enforcement-library" title={copy("Violations & Penalties", "المخالفات والعقوبات")}>
        <section className="sq-state" role="alert">
          <span className="sq-state__glyph" aria-hidden="true">🔒</span>
          <h1>{copy("Authorized access required", "يلزم وصول مصرح به")}</h1>
          <p>{copy("Sign in again. No enforcement record existence is disclosed.", "سجّل الدخول مرة أخرى. لا يتم الكشف عن وجود أي سجل إنفاذ.")}</p>
        </section>
      </Shell>
    );
  }

  const violationRead = await sb.from("violations")
    .select(`
      id,mapping_version,invalidated_at,
      violation_codes(title,code,level,corrective_action),
      inspections!inner(
        id,status,started_at,submitted_at,
        visits!inner(
          id,
          factories!inner(id,name,factory_code,license_number,region,city),
          assignments(status,profiles(full_name))
        ),
        action_forms(id,violation_id,form_type,status,due_at,owner_name,owner_role,required_correction,is_blocking),
        evidence(id,linked_id,content_sha256)
      )
    `)
    .order("id", { ascending: false })
    .limit(100);

  const allRows = ((violationRead.data ?? []) as unknown as ViolationRow[])
    .filter(row => !isTestFixtureEstablishment(row.inspections?.visits?.factories));
  const violationIds = allRows.map(row => row.id);
  const penaltyRead = violationIds.length
    ? await sb.from("inspection_penalties")
        .select("violation_id,status,mapping_snapshot")
        .in("violation_id", violationIds)
        .limit(500)
    : { data: [], error: null };
  const penalties = (penaltyRead.data ?? []) as unknown as PenaltyRow[];
  const regions = Array.from(new Set(
    allRows
      .map(row => row.inspections?.visits?.factories?.region)
      .filter((value): value is string => Boolean(value)),
  )).sort();
  const cutoff = range ? Date.now() - range * 86_400_000 : 0;

  const rows = allRows.filter(row => {
    const inspection = row.inspections;
    const factory = inspection?.visits?.factories;
    const code = row.violation_codes;
    const recordedAt = inspection?.submitted_at ?? inspection?.started_at;
    const recordStatus = row.invalidated_at ? "invalidated" : inspection?.status ?? "unavailable";
    const haystack = `${factory?.name ?? ""} ${factory?.license_number ?? ""} ${inspection?.id ?? ""} ${code?.title ?? ""} ${code?.code ?? ""}`.toLowerCase();
    return (!q || haystack.includes(q))
      && (!status || recordStatus === status)
      && (!region || factory?.region === region)
      && (!cutoff || Boolean(recordedAt) && new Date(recordedAt as string).getTime() >= cutoff);
  });

  const availableStatuses = Array.from(new Set(allRows.map(row =>
    row.invalidated_at ? "invalidated" : row.inspections?.status ?? "unavailable"
  ))).sort();
  const selected = allRows.find(row => row.id === selectedId) ?? null;
  const selectedInspection = selected?.inspections ?? null;
  const selectedFactory = selectedInspection?.visits?.factories ?? null;
  const selectedActionForms = (selectedInspection?.action_forms ?? [])
    .filter(form => form.violation_id === selected?.id);
  const selectedEvidence = (selectedInspection?.evidence ?? [])
    .filter(item => item.linked_id === selected?.id);
  const selectedPenalties = penalties.filter(item => item.violation_id === selected?.id);

  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (status) query.set("status", status);
  if (range) query.set("range", String(range));
  if (region) query.set("region", region);
  const listHref = `/enforcement-library${query.size ? `?${query}` : ""}`;
  const detailHref = (id: string) => {
    const next = new URLSearchParams(query);
    next.set("violation", id);
    return `/enforcement-library?${next}`;
  };

  const readError = violationRead.error || penaltyRead.error;
  const statusLabel = (value: string) => ({
    draft: copy("Draft", "مسودة"),
    in_progress: copy("In progress", "قيد التنفيذ"),
    executing: copy("Executing", "قيد التنفيذ"),
    submitted: copy("Submitted", "مُرسل"),
    under_review: copy("Under review", "قيد المراجعة"),
    approved: copy("Approved", "معتمد"),
    rejected: copy("Rejected", "مرفوض"),
    returned: copy("Returned", "مُعاد"),
    invalidated: copy("Invalidated", "مُبطل"),
    completed: copy("Completed", "مكتمل"),
    pending: copy("Pending", "قيد الانتظار"),
    unavailable: copy("Unavailable", "غير متاح"),
  }[value] ?? value.replaceAll("_", " "));
  const penaltyLabel = (linked: PenaltyRow[]) => {
    if (!linked.length) return copy("Not issued", "لم تصدر");
    if (linked.length > 1) return copy("Multiple linked records — review required", "سجلات مرتبطة متعددة — يلزم التحقق");
    return linked[0].mapping_snapshot?.penalty_type
      ?? linked[0].status
      ?? copy("Unavailable", "غير متاح");
  };

  return (
    <Shell
      current="/enforcement-library"
      title={copy("Violations & Penalties", "المخالفات والعقوبات")}
      context={<span className="badge badge-info">ENF-S01 · {copy("Read only", "للقراءة فقط")}</span>}
    >
      <h1 className="sq-sr-only">{copy("Violations & Penalties", "المخالفات والعقوبات")}</h1>

      <div className="alert alert-warning" role="note">
        <div>
          <strong>{copy("Enforcement policy: Not configured.", "سياسة الإنفاذ: غير مهيأة.")}</strong>{" "}
          {copy(
            "No measure, amount, escalation rule or legal wording is inferred. This library presents source records only.",
            "لا يتم استنتاج أي تدبير أو مبلغ أو قاعدة تصعيد أو صياغة قانونية. تعرض هذه المكتبة سجلات المصدر فقط.",
          )}
        </div>
      </div>

      <form className="grid-toolbar" method="get" action="/enforcement-library">
        <div className="input-affix">
          <input
            className="input"
            name="q"
            type="search"
            defaultValue={one(sp.q)}
            placeholder={copy("Search factory, licence, inspection…", "ابحث عن مصنع أو ترخيص أو تفتيش…")}
            aria-label={copy("Search enforcement", "البحث في الإنفاذ")}
          />
        </div>
        <select className="select filter-chip" name="status" defaultValue={status} aria-label={copy("Status", "الحالة")}>
          <option value="">{copy("All statuses", "جميع الحالات")}</option>
          {availableStatuses.map(value => <option key={value} value={value}>{statusLabel(value)}</option>)}
        </select>
        <select className="select filter-chip" name="range" defaultValue={range || ""} aria-label={copy("Date range", "النطاق الزمني")}>
          <option value="">{copy("Any date", "أي تاريخ")}</option>
          <option value="30">{copy("Last 30 days", "آخر 30 يوماً")}</option>
          <option value="90">{copy("Last 90 days", "آخر 90 يوماً")}</option>
          <option value="365">{copy("Last year", "العام الماضي")}</option>
        </select>
        <select className="select filter-chip" name="region" defaultValue={region} aria-label={copy("Region", "المنطقة")}>
          <option value="">{copy("All regions", "جميع المناطق")}</option>
          {regions.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
        <button className="btn btn-primary" type="submit">{copy("Apply", "تطبيق")}</button>
        <span className="grow" aria-hidden="true"></span>
        <a
          className="btn btn-secondary"
          href={`/enforcement-library/export?${query}`}
        >
          {copy("Export", "تصدير")}
        </a>
      </form>

      {readError ? (
        <div className="alert alert-critical" role="alert">
          <div>
            <strong>{copy("Violations & Penalties unavailable.", "المخالفات والعقوبات غير متاحة.")}</strong>{" "}
            {copy("No record count is claimed. Retry the page.", "لا يتم ادعاء أي عدد للسجلات. أعد تحميل الصفحة.")}
          </div>
        </div>
      ) : rows.length === 0 ? (
        <section className="sq-state" role="status">
          {/* INSP-734: "○" (plain circle) reads as the app's own loading
              glyph "◌" (dotted circle, used app-wide in loading.tsx files)
              at a glance — this state is fully resolved, not loading, so
              the glyph must not be confusable with that one. */}
          <span className="sq-state__glyph" aria-hidden="true">∅</span>
          <h2>{copy("No violation records visible to you", "لا توجد سجلات مخالفات ظاهرة لك")}</h2>
          <p>{copy("The read succeeded and returned zero matching records.", "نجحت القراءة ولم تُرجع سجلات مطابقة.")}</p>
        </section>
      ) : (
        <section className="table-wrap" aria-label={copy("Enforcement records", "سجلات الإنفاذ")}>
          <table className="table">
            <thead>
              <tr>
                <th scope="col">{copy("Factory", "المصنع")}</th>
                <th scope="col">{copy("Licence", "الترخيص")}</th>
                <th scope="col">{copy("Inspection", "التفتيش")}</th>
                <th scope="col">{copy("Violation", "المخالفة")}</th>
                <th scope="col">{copy("Penalty", "العقوبة")}</th>
                <th scope="col">{copy("Inspector", "المفتش")}</th>
                <th scope="col">{copy("Status", "الحالة")}</th>
                <th scope="col">{copy("Issue date", "تاريخ الإصدار")}</th>
                <th scope="col">{copy("Action form", "نموذج الإجراء")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const inspection = row.inspections;
                const visit = inspection?.visits;
                const factory = visit?.factories;
                const code = row.violation_codes;
                const linkedPenalties = penalties.filter(item => item.violation_id === row.id);
                const actionForms = (inspection?.action_forms ?? []).filter(form => form.violation_id === row.id);
                const assignment = (visit?.assignments ?? []).find(item => item.status !== "returned")
                  ?? visit?.assignments?.[0];
                const recordStatus = row.invalidated_at ? "invalidated" : inspection?.status ?? "unavailable";
                const recordedAt = inspection?.submitted_at ?? inspection?.started_at;
                return (
                  <tr key={row.id} className={selectedId === row.id ? "is-selected" : undefined}>
                    <th scope="row"><a href={detailHref(row.id)}>{factory?.name ?? copy("Unavailable", "غير متاح")}</a></th>
                    <td>{factory?.license_number ?? "—"}</td>
                    <td><span className="id-code">{inspection?.id.slice(0, 8) ?? "—"}</span></td>
                    <td>{code?.title ?? copy("Unavailable", "غير متاح")}</td>
                    <td>{penaltyLabel(linkedPenalties)}</td>
                    <td>{assignment?.profiles?.full_name ?? "—"}</td>
                    <td><span className="badge badge-info"><span className="dot" aria-hidden="true"></span>{statusLabel(recordStatus)}</span></td>
                    <td>{recordedAt?.slice(0, 10) ?? "—"}</td>
                    <td>{actionForms.length ? actionForms.map(form => form.form_type.replaceAll("_", " ")).join(", ") : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {selectedId && !selected && !readError ? (
        <div className="alert alert-warning" role="alert">
          {copy(
            "The requested enforcement record is not visible in your authorized scope.",
            "سجل الإنفاذ المطلوب غير ظاهر ضمن نطاقك المصرح به.",
          )}
        </div>
      ) : null}

      {selected && selectedInspection && selectedFactory ? (
        <>
          <a href={listHref} aria-label={copy("Close record detail", "إغلاق تفاصيل السجل")}></a>
          <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="enforcement-detail-title">
            <header className="drawer-header">
              <div>
                <h2 id="enforcement-detail-title">{selected.violation_codes?.title ?? copy("Violation", "مخالفة")}</h2>
                <span className="id-code">{selected.violation_codes?.code ?? selected.id}</span>
              </div>
              <a className="btn btn-secondary btn-icon" href={listHref} aria-label={copy("Close", "إغلاق")}>×</a>
            </header>
            <div className="drawer-body stack">
              <section className="panel">
                <header className="panel-header"><h3 className="panel-title">{copy("Factory", "المصنع")}</h3></header>
                <dl className="panel-body">
                  <dt>{copy("Name", "الاسم")}</dt><dd>{selectedFactory.name}</dd>
                  <dt>{copy("Licence", "الترخيص")}</dt><dd>{selectedFactory.license_number ?? "—"}</dd>
                  <dt>{copy("Region", "المنطقة")}</dt><dd>{selectedFactory.region ?? "—"}{selectedFactory.city ? ` · ${selectedFactory.city}` : ""}</dd>
                </dl>
              </section>
              <section className="panel">
                <header className="panel-header"><h3 className="panel-title">{copy("Inspection", "التفتيش")}</h3></header>
                <dl className="panel-body">
                  <dt>{copy("Reference", "المرجع")}</dt><dd><span className="id-code">{selectedInspection.id}</span></dd>
                  <dt>{copy("Status", "الحالة")}</dt><dd>{statusLabel(selected.invalidated_at ? "invalidated" : selectedInspection.status)}</dd>
                  <dt>{copy("Submitted", "تم الإرسال")}</dt><dd>{selectedInspection.submitted_at ?? copy("Not submitted", "لم يتم الإرسال")}</dd>
                </dl>
              </section>
              <section className="panel">
                <header className="panel-header"><h3 className="panel-title">{copy("Penalty", "العقوبة")}</h3></header>
                <div className="panel-body">
                  {!selectedPenalties.length ? <p>{copy("Not issued", "لم تصدر")}</p> : (
                    <ul>
                      {selectedPenalties.map((penalty, index) => (
                        <li key={`${penalty.violation_id}-${index}`}>
                          {penalty.mapping_snapshot?.penalty_type ?? copy("Type unavailable", "النوع غير متاح")} · {statusLabel(penalty.status)}
                          {penalty.mapping_snapshot?.mapping_version ? ` · ${penalty.mapping_snapshot.mapping_version}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
              <section className="panel">
                <header className="panel-header"><h3 className="panel-title">{copy("Action forms", "نماذج الإجراء")}</h3></header>
                <div className="panel-body">
                  {!selectedActionForms.length ? <p>{copy("No linked action form", "لا يوجد نموذج إجراء مرتبط")}</p> : (
                    <ul>
                      {selectedActionForms.map(form => {
                        const complete = !form.is_blocking || Boolean(
                          form.owner_name?.trim()
                          && form.owner_role?.trim()
                          && form.due_at
                          && form.required_correction?.trim()
                        );
                        return <li key={form.id}>{form.form_type.replaceAll("_", " ")} · {form.status} · {complete ? copy("required fields complete", "الحقول المطلوبة مكتملة") : copy("blocking fields incomplete", "الحقول الإلزامية غير مكتملة")}</li>;
                      })}
                    </ul>
                  )}
                </div>
              </section>
              <section className="panel">
                <header className="panel-header"><h3 className="panel-title">{copy("Evidence and custody", "الأدلة وسلسلة الحيازة")}</h3></header>
                <div className="panel-body">
                  <p>{copy("Linked attachments", "المرفقات المرتبطة")}: {selectedEvidence.length}</p>
                  <p>{selectedEvidence.length > 0 && selectedEvidence.every(item => Boolean(item.content_sha256))
                    ? copy("Content hashes recorded", "تم تسجيل بصمات المحتوى")
                    : copy("Hash record incomplete", "سجل البصمة غير مكتمل")}</p>
                </div>
              </section>
              <section className="panel">
                <header className="panel-header"><h3 className="panel-title">{copy("Audit", "التدقيق")}</h3></header>
                <dl className="panel-body">
                  <dt>{copy("Final mapping version", "إصدار الربط النهائي")}</dt>
                  <dd><span className="id-code">{selected.mapping_version}</span></dd>
                  <dt>{copy("Source violation", "مخالفة المصدر")}</dt>
                  <dd><span className="id-code">{selected.id}</span></dd>
                </dl>
              </section>
              <a className="btn btn-primary btn-lg btn-touch" href={`/factories/${selectedFactory.id}`}>
                {copy("Open Factory 360", "فتح ملف المنشأة 360")}
              </a>
            </div>
          </aside>
        </>
      ) : null}
    </Shell>
  );
}
