"use client";

import { useMemo, useRef, useState } from "react";
import { compareReconstructions, completenessFor, reconstructAt, type ExpectedAuditEvent, type ReplayEvent } from "@/lib/audit-replay";

type Props = {
  locale: "en" | "ar"; mode: string; caseRef: string; query: string; at: string | null; vs: string | null;
  roles: string[]; authorized: boolean; partialScope: boolean; semanticUnavailable: boolean;
  sourceError: boolean; sourceErrorMessage: string; events: ReplayEvent[]; expected: ExpectedAuditEvent[]; ontologyLoaded: boolean; historyTruncated: boolean;
};

const labels = {
  en: { search:"Search events", case:"Case / object UUID", apply:"Apply", recorder:"Flight recorder", reconstruct:"Point in time", compare:"Compare", ledger:"Completeness", custody:"Custody", print:"Print-safe", unauthorized:"You are not authorized to read audit events.", zero:"No audit facts are visible in your current scope.", partial:"Results reflect only what you can currently read.", degraded:"Semantic replay contracts aren't applied in this environment. Generic events that can't be changed stay visible, and they aren't promoted to official facts.", detail:"Open provenance", close:"Close event detail", before:"Before", after:"After", payload:"Semantic payload", missing:"MISSING", needs:"NEEDS_CONTRACT", found:"FOUND", source:"Source", integrity:"Integrity", chain:"Chain", at:"Reconstruct at", vs:"Compare with", noEvent:"No event existed at this moment.", policy:"Operational view only. Export, reveal, redaction, retention, watermark, purge and legal-evidence claims are held by policy.", skip:"Skip to event chronology", title:"Inspection Flight Recorder", portfolio:"All cases in current scope", versions:"Versions", workflow:"Workflow", device:"Device / sync", evidence:"Evidence", dossier:"Point-in-time snapshot", governing:"Governing versions", correlation:"Correlation", legal:"Legal status", partialHistory:"PARTIAL HISTORY. The limited server read reached its safety cap. Reconstruction and completeness aren't confirmed for this result.", selectCase:"Select one case that isn't truncated, with a published ontology. Viewing all cases, or a partial page of events, never satisfies case completeness.", zeroDisclosure:"zero disclosure", modesLabel:"Audit replay modes", partialScopeTag:"PARTIAL SCOPE.", degradedTag:"DEGRADED.", policyHeldTag:"POLICY_HELD", conflictTag:"CONFLICT" },
  ar: { search:"بحث في الأحداث", case:"معرّف الحالة أو العنصر", apply:"تطبيق", recorder:"مسجل الرحلة", reconstruct:"حالة في لحظة", compare:"مقارنة", ledger:"الاكتمال", custody:"سلسلة الحيازة", print:"عرض آمن للطباعة", unauthorized:"غير مصرح لك بقراءة أحداث التدقيق.", zero:"لا توجد حقائق تدقيق مرئية ضمن نطاقك الحالي.", partial:"تعكس النتائج فقط ما يمكنك قراءته حاليًا.", degraded:"عقود الإعادة الدلالية غير مطبقة في هذه البيئة. تبقى الأحداث العامة غير القابلة للتغيير مرئية ولا تُرقّى إلى حقائق رسمية.", detail:"فتح المصدر", close:"إغلاق تفاصيل الحدث", before:"قبل", after:"بعد", payload:"الحمولة الدلالية", missing:"مفقود", needs:"يحتاج عقدًا", found:"موجود", source:"المصدر", integrity:"السلامة", chain:"السلسلة", at:"إعادة البناء عند", vs:"المقارنة مع", noEvent:"لم يوجد حدث عند هذه اللحظة.", policy:"عرض تشغيلي فقط. التصدير والكشف والحجب والاحتفاظ والعلامة المائية والحذف والحجية القانونية معلّقة بالسياسة.", skip:"الانتقال إلى التسلسل الزمني", title:"مسجل رحلة التفتيش", portfolio:"جميع الحالات ضمن النطاق الحالي", versions:"الإصدارات", workflow:"سير العمل", device:"الجهاز / المزامنة", evidence:"الأدلة", dossier:"لقطة في لحظة", governing:"الإصدارات الحاكمة", correlation:"الترابط", legal:"الحالة القانونية", partialHistory:"سجل جزئي. بلغ الاستعلام المحدود حد الأمان؛ لا تُعتمد إعادة البناء أو نتيجة الاكتمال.", selectCase:"اختر حالة واحدة غير مبتورة مع أنطولوجيا منشورة. لا تحقق أحداث جميع الحالات أو الصفحة الجزئية اكتمال الحالة.", zeroDisclosure:"بلا إفصاح", modesLabel:"أنماط إعادة تشغيل التدقيق", partialScopeTag:"نطاق جزئي.", degradedTag:"متدهور.", policyHeldTag:"محجوب بالسياسة", conflictTag:"تعارض" },
};

const json = (value: unknown) => value == null ? "∅" : JSON.stringify(value, null, 2);

export default function AuditReplayWorkspace(props: Props) {
  const L = labels[props.locale];
  const auditTerms = props.locale === "ar" ? {
    appendOnly: "إضافة فقط",
    semantic: "دلالي مسجل",
    generic: "عام فقط",
    partial: "جزئي",
    changed: "متغير",
    unchanged: "غير متغير",
    reconstructedStates: "حالات مجمعة أعيد بناؤها",
    sourceEvents: "أحداث مصدر",
    last: "آخر حدث",
  } : {
    appendOnly: "Append-only",
    semantic: "Recorded semantic",
    generic: "Generic only",
    partial: "Partial",
    changed: "Changed",
    unchanged: "Unchanged",
    reconstructedStates: "reconstructed aggregate states",
    sourceEvents: "source events",
    last: "last",
  };
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>());
  const selected = props.events.find(event => event.id === selectedId) ?? null;
  const atState = useMemo(() => reconstructAt(props.events, props.at), [props.events, props.at]);
  const vsState = useMemo(() => reconstructAt(props.events, props.vs), [props.events, props.vs]);
  const comparison = useMemo(() => compareReconstructions(vsState, atState), [vsState, atState]);
  const completenessAvailable = props.ontologyLoaded && Boolean(props.caseRef) && !props.historyTruncated;
  const completeness = useMemo(() => completenessFor(props.events, completenessAvailable ? props.expected : []), [props.events, props.expected, completenessAvailable]);
  const open = (id: string) => { setSelectedId(id); requestAnimationFrame(() => closeRef.current?.focus()); };
  const close = () => { const id = selectedId; setSelectedId(null); requestAnimationFrame(() => id && triggerRefs.current.get(id)?.focus()); };
  const modes = [["recorder",L.recorder],["reconstruct",L.reconstruct],["compare",L.compare],["ledger",L.ledger],["custody",L.custody],["print",L.print]];

  if (!props.authorized) return <section className="panel ar-denied" role="alert"><span aria-hidden="true">🛡</span><h2>{L.unauthorized}</h2><p>{L.zeroDisclosure}</p></section>;

  return <div className="ar-workspace" dir={props.locale === "ar" ? "rtl" : "ltr"}>
    <a className="sq-shell__skip" href="#audit-chronology">{L.skip}</a>
    <section className="ar-casehead panel">
      <div><span className="t-caption">MVP2--M2-05</span><h2>{L.title}</h2><p className="t-caption">{props.caseRef || L.portfolio} · {props.events.length} · {completenessAvailable ? `${completeness.found}/${completeness.expected}` : L.ledger}</p></div>
      <div className="ar-status"><span className="badge badge-compliant">{auditTerms.appendOnly}</span><span className="badge badge-info">{props.roles.join(" · ")}</span></div>
    </section>
    <div className="sq-banner sq-banner--warning" role="note"><div><strong>{L.policyHeldTag}</strong>{" · "}{L.policy}</div></div>
    <form method="get" className="ar-filter panel">
      <label className="sq-field"><span className="sq-field__label">{L.case}</span><input className="sq-input" name="case" defaultValue={props.caseRef}/></label>
      <label className="sq-field"><span className="sq-field__label">{L.search}</span><input className="sq-input" name="q" defaultValue={props.query}/></label>
      <input type="hidden" name="view" value={props.mode}/><button className="btn btn-primary btn-lg btn-touch" type="submit">{L.apply}</button>
    </form>
    <nav className="ar-modes" aria-label={L.modesLabel}>{modes.map(([id,label]) => <a key={id} className={`btn btn-touch ${props.mode === id ? "btn-primary btn-lg" : "btn-secondary"}`} aria-current={props.mode === id ? "page" : undefined} href={`?view=${id}&case=${encodeURIComponent(props.caseRef)}&q=${encodeURIComponent(props.query)}`}>{label}</a>)}</nav>
    {props.partialScope && <div className="sq-banner" role="status"><div><strong>{L.partialScopeTag}</strong> {L.partial}</div></div>}
    {props.semanticUnavailable && <div className="sq-banner sq-banner--warning" role="status"><div><strong>{L.degradedTag}</strong> {L.degraded}</div></div>}
    {props.historyTruncated && <div className="sq-banner sq-banner--warning" role="status"><div>{L.partialHistory}</div></div>}
    {props.sourceError && <div className="sq-banner sq-banner--critical" role="alert"><div>{props.sourceErrorMessage}</div></div>}
    {!props.sourceError && props.events.length === 0 && <section className="panel ar-empty"><span aria-hidden="true">⌕</span><h3>{L.zero}</h3></section>}

    {props.mode === "recorder" && props.events.length > 0 && <section id="audit-chronology" className="ar-recorder">
      <div className="ar-lanes panel" aria-label={L.recorder}><div className="ar-lane ar-lane--version">{L.versions}</div><div className="ar-lane ar-lane--workflow">{L.workflow}</div><div className="ar-lane ar-lane--device">{L.device}</div><div className="ar-lane ar-lane--evidence">{L.evidence}</div></div>
      <ol className="ar-spine panel">{props.events.map(event => <li key={event.id} className={`ar-event ar-event--${event.provenance}`}>
        <time dateTime={event.occurredAt}>{new Date(event.occurredAt).toLocaleString(props.locale === "ar" ? "ar-SA" : "en-GB")}</time>
        <div><strong>{event.eventType}</strong><p>{event.aggregateType} · <bdi>{event.aggregateId ?? "—"}</bdi></p><span className={`sq-lozenge ${event.provenance === "semantic" ? "sq-lozenge--success" : "sq-lozenge--warning"}`}>{event.provenance === "semantic" ? auditTerms.semantic : auditTerms.generic}</span></div>
        <button ref={el => { if (el) triggerRefs.current.set(event.id,el); }} className="btn btn-ghost btn-touch" type="button" onClick={() => open(event.id)}>{L.detail}</button>
      </li>)}</ol>
      <aside className="ar-dossier panel"><h3>{L.dossier}</h3><p>{atState.length ? String(atState.length) : L.noEvent}</p><dl><dt>{L.governing}</dt><dd>{L.missing}</dd><dt>{L.correlation}</dt><dd>{props.events.some(e => e.correlationId) ? auditTerms.partial : L.missing}</dd><dt>{L.legal}</dt><dd>{L.policyHeldTag}</dd></dl></aside>
    </section>}

    {props.mode === "reconstruct" && <section className="panel ar-modepanel"><form method="get"><input type="hidden" name="view" value="reconstruct"/><input type="hidden" name="case" value={props.caseRef}/><label className="sq-field"><span className="sq-field__label">{L.at}</span><input className="sq-input" type="datetime-local" name="at" defaultValue={props.at?.slice(0,16)}/></label><button className="btn btn-primary btn-lg btn-touch">{L.apply}</button></form><h3>{atState.length} {auditTerms.reconstructedStates}</h3>{atState.map(row => <article key={row.key} className="ar-custody"><strong>{row.key}</strong><span>{row.eventIds.length} {auditTerms.sourceEvents} · {auditTerms.last} {row.lastOccurredAt}</span>{row.conflicts.length > 0 && <span className="badge badge-critical">{L.conflictTag}</span>}<pre>{json(row.state)}</pre></article>)}</section>}
    {props.mode === "compare" && <section className="panel ar-modepanel"><form method="get" className="ar-compareform"><input type="hidden" name="view" value="compare"/><input type="hidden" name="case" value={props.caseRef}/><label className="sq-field"><span className="sq-field__label">{L.at}</span><input className="sq-input" type="datetime-local" name="at" defaultValue={props.at?.slice(0,16)}/></label><label className="sq-field"><span className="sq-field__label">{L.vs}</span><input className="sq-input" type="datetime-local" name="vs" defaultValue={props.vs?.slice(0,16)}/></label><button className="btn btn-primary btn-lg btn-touch">{L.apply}</button></form>{comparison.map(row => <article key={row.key}><h3>{row.key} · {row.changed ? auditTerms.changed : auditTerms.unchanged}</h3><div className="ar-diff"><div><h4>{L.before}</h4><pre>{json(row.before?.state)}</pre></div><div><h4>{L.after}</h4><pre>{json(row.after?.state)}</pre></div></div></article>)}</section>}
    {props.mode === "ledger" && <section className="panel ar-modepanel"><h3>{L.ledger} · {completenessAvailable ? `${completeness.found}/${completeness.expected}` : L.missing}</h3>{!completenessAvailable && <div className="sq-banner sq-banner--warning"><div>{L.selectCase}</div></div>}<div className="ar-ledger">{completeness.rows.map(row => <div key={row.requirementId} className="ar-ledgerrow"><bdi>{row.requirementId}</bdi><strong>{row.eventType}</strong><span className={`sq-lozenge ${row.found ? "sq-lozenge--success" : row.defaultStatus === "needs_contract" ? "sq-lozenge--warning" : "sq-lozenge--critical"}`}>{row.found ? L.found : row.defaultStatus === "needs_contract" ? L.needs : L.missing}</span></div>)}</div></section>}
    {props.mode === "custody" && <section className="panel ar-modepanel"><h3>{L.custody}</h3>{props.events.map(event => <div className="ar-custody" key={event.id}><bdi>{event.id}</bdi><span>{event.eventType}</span><span>{L.integrity}: {event.integrityStatus}</span><span>{L.chain}: {event.chainStatus}</span></div>)}</section>}
    {props.mode === "print" && <section className="panel ar-modepanel ar-print"><h3>{L.print}</h3><p role="note">{L.policy}</p>{props.events.map(event => <p key={event.id}><time>{event.occurredAt}</time> · {event.eventType} · {event.provenance} · {event.integrityStatus}</p>)}</section>}

    {selected && <div className="ar-dialogbackdrop" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}><aside className="ar-dialog panel" role="dialog" aria-modal="true" aria-labelledby="audit-event-title" onKeyDown={event => { if (event.key === "Escape") close(); if (event.key === "Tab") { event.preventDefault(); closeRef.current?.focus(); } }}>
      <button ref={closeRef} className="btn btn-ghost ar-dialogclose btn-touch" type="button" onClick={close} aria-label={L.close}>×</button><h2 id="audit-event-title">{selected.eventType}</h2><dl><dt>{L.source}</dt><dd>{selected.provenance}</dd><dt>{L.integrity}</dt><dd>{selected.integrityStatus}</dd><dt>{L.chain}</dt><dd>{selected.chainStatus}</dd><dt>{L.correlation}</dt><dd><bdi>{selected.correlationId ?? "MISSING"}</bdi></dd></dl><div className="ar-diff"><div><h3>{L.before}</h3><pre>{json(selected.beforeState)}</pre></div><div><h3>{L.after}</h3><pre>{json(selected.afterState)}</pre></div></div><h3>{L.payload}</h3><pre>{json(selected.payload)}</pre>
    </aside></div>}
  </div>;
}
