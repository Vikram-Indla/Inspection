"use client";

import { useMemo, useRef, useState } from "react";
import { compareReconstructions, completenessFor, reconstructAt, type ExpectedAuditEvent, type ReplayEvent } from "@/lib/audit-replay";
import { IconShieldCheck } from "@/app/icons";

type Props = {
  locale: "en" | "ar"; mode: string; caseRef: string; query: string; at: string | null; vs: string | null;
  roles: string[]; authorized: boolean; partialScope: boolean; semanticUnavailable: boolean;
  sourceError: boolean; sourceErrorMessage: string; events: ReplayEvent[]; expected: ExpectedAuditEvent[]; ontologyLoaded: boolean; historyTruncated: boolean;
};

const labels = {
  en: { search:"Search events", case:"Case / object UUID", apply:"Apply", recorder:"Flight recorder", reconstruct:"Point in time", compare:"Compare", ledger:"Completeness", custody:"Custody", print:"Print-safe", unauthorized:"You are not authorized to read audit events.", zero:"No audit facts are visible in your current scope.", partial:"Results reflect only your current RLS-readable scope.", degraded:"Semantic replay contracts are not applied in this environment. Generic immutable events remain visible and are not promoted to canonical facts.", detail:"Open provenance", close:"Close event detail", before:"Before", after:"After", payload:"Semantic payload", missing:"MISSING", needs:"NEEDS_CONTRACT", found:"FOUND", source:"Source", integrity:"Integrity", chain:"Chain", at:"Reconstruct at", vs:"Compare with", noEvent:"No event existed at this moment.", policy:"Operational view only. Export, reveal, redaction, retention, watermark, purge and legal-evidence claims remain policy-held.", skip:"Skip to event chronology", title:"Inspection Flight Recorder", portfolio:"Portfolio / current readable scope", versions:"Versions", workflow:"Workflow", device:"Device / sync", evidence:"Evidence", dossier:"Point-in-time snapshot", governing:"Governing versions", correlation:"Correlation", legal:"Legal status", partialHistory:"PARTIAL HISTORY. The bounded server read reached its safety cap. Reconstruction and completeness are not certified for this result.", selectCase:"Select one non-truncated case with a published ontology. Portfolio or partial-page events never satisfy case completeness.", zeroDisclosure:"zero disclosure", modesLabel:"Audit replay modes", partialScopeTag:"PARTIAL SCOPE.", degradedTag:"DEGRADED.", policyHeldTag:"POLICY_HELD", conflictTag:"CONFLICT" },
  ar: { search:"بحث في الأحداث", case:"معرّف الحالة أو العنصر", apply:"تطبيق", recorder:"مسجل الرحلة", reconstruct:"حالة في لحظة", compare:"مقارنة", ledger:"الاكتمال", custody:"سلسلة الحيازة", print:"عرض آمن للطباعة", unauthorized:"غير مصرح لك بقراءة أحداث التدقيق.", zero:"لا توجد حقائق تدقيق مرئية ضمن نطاقك الحالي.", partial:"تعكس النتائج نطاق RLS المقروء حاليًا فقط.", degraded:"عقود الإعادة الدلالية غير مطبقة في هذه البيئة. تبقى الأحداث العامة غير القابلة للتغيير مرئية ولا تُرقّى إلى حقائق معيارية.", detail:"فتح المصدر", close:"إغلاق تفاصيل الحدث", before:"قبل", after:"بعد", payload:"الحمولة الدلالية", missing:"مفقود", needs:"يحتاج عقدًا", found:"موجود", source:"المصدر", integrity:"السلامة", chain:"السلسلة", at:"إعادة البناء عند", vs:"المقارنة مع", noEvent:"لم يوجد حدث عند هذه اللحظة.", policy:"عرض تشغيلي فقط. التصدير والكشف والحجب والاحتفاظ والعلامة المائية والحذف والحجية القانونية معلقة بالسياسة.", skip:"الانتقال إلى التسلسل الزمني", title:"مسجل رحلة التفتيش", portfolio:"المحفظة / النطاق المقروء الحالي", versions:"الإصدارات", workflow:"سير العمل", device:"الجهاز / المزامنة", evidence:"الأدلة", dossier:"ملف الحالة في لحظة", governing:"الإصدارات الحاكمة", correlation:"الترابط", legal:"الحالة القانونية", partialHistory:"سجل جزئي. بلغ الاستعلام المحدود حد الأمان؛ لا تُعتمد إعادة البناء أو نتيجة الاكتمال.", selectCase:"اختر حالة واحدة غير مبتورة مع أنطولوجيا منشورة. لا تحقق أحداث المحفظة أو الصفحة الجزئية اكتمال الحالة.", zeroDisclosure:"بلا إفصاح", modesLabel:"أنماط إعادة تشغيل التدقيق", partialScopeTag:"نطاق جزئي.", degradedTag:"متدهور.", policyHeldTag:"محجوب بالسياسة", conflictTag:"تعارض" },
};

const json = (value: unknown) => value == null ? "∅" : JSON.stringify(value, null, 2);

export default function AuditReplayWorkspace(props: Props) {
  const L = labels[props.locale];
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

  if (!props.authorized) return <section className="ax-surface ar-denied" role="alert"><IconShieldCheck size={20} /><h2>{L.unauthorized}</h2><p>{"RBAC / RLS · "}{L.zeroDisclosure}</p></section>;

  return <div className="ar-workspace" dir={props.locale === "ar" ? "rtl" : "ltr"}>
    <a className="ax-shell__skip" href="#audit-chronology">{L.skip}</a>
    <section className="ar-casehead ax-surface">
      <div><span className="ax-caption">MVP2-CD-031-M2-05</span><h2>{L.title}</h2><p className="ax-caption">{props.caseRef || L.portfolio} · {props.events.length} · {completenessAvailable ? `${completeness.found}/${completeness.expected}` : L.ledger}</p></div>
      <div className="ar-status"><span className="ax-lozenge ax-lozenge--success">append-only</span><span className="ax-lozenge ax-lozenge--info">{props.roles.join(" · ")}</span></div>
    </section>
    <form method="get" className="ar-filter ax-surface">
      <label className="ax-field"><span className="ax-field__label">{L.case}</span><input className="ax-input" name="case" defaultValue={props.caseRef}/></label>
      <label className="ax-field"><span className="ax-field__label">{L.search}</span><input className="ax-input" name="q" defaultValue={props.query}/></label>
      <input type="hidden" name="view" value={props.mode}/><button className="ax-btn ax-btn--prominent" type="submit">{L.apply}</button>
    </form>
    <nav className="ar-modes" aria-label={L.modesLabel}>{modes.map(([id,label]) => <a key={id} className={`ax-btn ${props.mode === id ? "ax-btn--prominent" : "ax-btn--secondary"}`} aria-current={props.mode === id ? "page" : undefined} href={`?view=${id}&case=${encodeURIComponent(props.caseRef)}&q=${encodeURIComponent(props.query)}`}>{label}</a>)}</nav>
    {props.partialScope && <div className="ax-banner" role="status"><div><strong>{L.partialScopeTag}</strong> {L.partial}</div></div>}
    {props.semanticUnavailable && <div className="ax-banner ax-banner--warning" role="status"><div><strong>{L.degradedTag}</strong> {L.degraded}</div></div>}
    {props.historyTruncated && <div className="ax-banner ax-banner--warning" role="status"><div>{L.partialHistory}</div></div>}
    {props.sourceError && <div className="ax-banner ax-banner--critical" role="alert"><div>{props.sourceErrorMessage}</div></div>}
    {!props.sourceError && props.events.length === 0 && <section className="ax-surface ar-empty"><span aria-hidden="true">⌕</span><h3>{L.zero}</h3></section>}

    {props.mode === "recorder" && props.events.length > 0 && <section id="audit-chronology" className="ar-recorder">
      <div className="ar-lanes ax-surface" aria-label={L.recorder}><div className="ar-lane ar-lane--version">{L.versions}</div><div className="ar-lane ar-lane--workflow">{L.workflow}</div><div className="ar-lane ar-lane--device">{L.device}</div><div className="ar-lane ar-lane--evidence">{L.evidence}</div></div>
      <ol className="ar-spine ax-surface">{props.events.map(event => <li key={event.id} className={`ar-event ar-event--${event.provenance}`}>
        <time dateTime={event.occurredAt}>{new Date(event.occurredAt).toLocaleString(props.locale === "ar" ? "ar-SA" : "en-GB")}</time>
        <div><strong>{event.eventType}</strong><p>{event.aggregateType} · <bdi>{event.aggregateId ?? "—"}</bdi></p><span className={`ax-lozenge ${event.provenance === "semantic" ? "ax-lozenge--success" : "ax-lozenge--warning"}`}>{event.provenance === "semantic" ? "RECORDED SEMANTIC" : "GENERIC ONLY"}</span></div>
        <button ref={el => { if (el) triggerRefs.current.set(event.id,el); }} className="ax-btn ax-btn--subtle" type="button" onClick={() => open(event.id)}>{L.detail}</button>
      </li>)}</ol>
      <aside className="ar-dossier ax-surface"><h3>{L.dossier}</h3><p>{atState.length ? String(atState.length) : L.noEvent}</p><dl><dt>{L.governing}</dt><dd>{L.missing}</dd><dt>{L.correlation}</dt><dd>{props.events.some(e => e.correlationId) ? "PARTIAL" : L.missing}</dd><dt>{L.legal}</dt><dd>{L.policyHeldTag}{" · DEC-006 / DEC2-009"}</dd></dl></aside>
    </section>}

    {props.mode === "reconstruct" && <section className="ax-surface ar-modepanel"><form method="get"><input type="hidden" name="view" value="reconstruct"/><input type="hidden" name="case" value={props.caseRef}/><label className="ax-field"><span className="ax-field__label">{L.at}</span><input className="ax-input" type="datetime-local" name="at" defaultValue={props.at?.slice(0,16)}/></label><button className="ax-btn ax-btn--prominent">{L.apply}</button></form><h3>{atState.length} reconstructed aggregate states</h3>{atState.map(row => <article key={row.key} className="ar-custody"><strong>{row.key}</strong><span>{row.eventIds.length} source events · last {row.lastOccurredAt}</span>{row.conflicts.length > 0 && <span className="ax-lozenge ax-lozenge--critical">{L.conflictTag}</span>}<pre>{json(row.state)}</pre></article>)}</section>}
    {props.mode === "compare" && <section className="ax-surface ar-modepanel"><form method="get" className="ar-compareform"><input type="hidden" name="view" value="compare"/><input type="hidden" name="case" value={props.caseRef}/><label className="ax-field"><span className="ax-field__label">{L.at}</span><input className="ax-input" type="datetime-local" name="at" defaultValue={props.at?.slice(0,16)}/></label><label className="ax-field"><span className="ax-field__label">{L.vs}</span><input className="ax-input" type="datetime-local" name="vs" defaultValue={props.vs?.slice(0,16)}/></label><button className="ax-btn ax-btn--prominent">{L.apply}</button></form>{comparison.map(row => <article key={row.key}><h3>{row.key} · {row.changed ? "CHANGED" : "UNCHANGED"}</h3><div className="ar-diff"><div><h4>{L.before}</h4><pre>{json(row.before?.state)}</pre></div><div><h4>{L.after}</h4><pre>{json(row.after?.state)}</pre></div></div></article>)}</section>}
    {props.mode === "ledger" && <section className="ax-surface ar-modepanel"><h3>{L.ledger} · {completenessAvailable ? `${completeness.found}/${completeness.expected}` : L.missing}</h3>{!completenessAvailable && <div className="ax-banner ax-banner--warning"><div>{L.selectCase}</div></div>}<div className="ar-ledger">{completeness.rows.map(row => <div key={row.requirementId} className="ar-ledgerrow"><bdi>{row.requirementId}</bdi><strong>{row.eventType}</strong><span className={`ax-lozenge ${row.found ? "ax-lozenge--success" : row.defaultStatus === "needs_contract" ? "ax-lozenge--warning" : "ax-lozenge--critical"}`}>{row.found ? L.found : row.defaultStatus === "needs_contract" ? L.needs : L.missing}</span></div>)}</div></section>}
    {props.mode === "custody" && <section className="ax-surface ar-modepanel"><h3>{L.custody}</h3>{props.events.map(event => <div className="ar-custody" key={event.id}><bdi>{event.id}</bdi><span>{event.eventType}</span><span>{L.integrity}: {event.integrityStatus}</span><span>{L.chain}: {event.chainStatus}</span></div>)}</section>}
    {props.mode === "print" && <section className="ax-surface ar-modepanel ar-print"><h3>{L.print}</h3><p role="note">{L.policy}</p>{props.events.map(event => <p key={event.id}><time>{event.occurredAt}</time> · {event.eventType} · {event.provenance} · {event.integrityStatus}</p>)}</section>}

    <div className="ax-banner" role="note"><div>{L.policy}</div></div>
    {selected && <div className="ar-dialogbackdrop" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}><aside className="ar-dialog ax-surface" role="dialog" aria-modal="true" aria-labelledby="audit-event-title" onKeyDown={event => { if (event.key === "Escape") close(); if (event.key === "Tab") { event.preventDefault(); closeRef.current?.focus(); } }}>
      <button ref={closeRef} className="ax-btn ax-btn--subtle ar-dialogclose" type="button" onClick={close} aria-label={L.close}>×</button><h2 id="audit-event-title">{selected.eventType}</h2><dl><dt>{L.source}</dt><dd>{selected.provenance}</dd><dt>{L.integrity}</dt><dd>{selected.integrityStatus}</dd><dt>{L.chain}</dt><dd>{selected.chainStatus}</dd><dt>{L.correlation}</dt><dd><bdi>{selected.correlationId ?? "MISSING"}</bdi></dd></dl><div className="ar-diff"><div><h3>{L.before}</h3><pre>{json(selected.beforeState)}</pre></div><div><h3>{L.after}</h3><pre>{json(selected.afterState)}</pre></div></div><h3>{L.payload}</h3><pre>{json(selected.payload)}</pre>
    </aside></div>}
  </div>;
}
