/* CD-019 · ADM-AUDIT — Audit trail browser (append-only event explorer).
   audit_events table (stated-by-contract). Three linked views over the SAME
   audit identity: event stream, object timeline, before/after diff. Read-only;
   no editable rows; retention/masking/tamper-evidence surfaced as open seams. */
(function () {
  "use strict";
  var C = window.CDM, esc = C.esc;

  var L = {
    en: { group: "Administration", title: "Audit trail browser", sub: "Append-only event explorer that reads as a case narrative: who changed what, when, why and under which version — stream, object timeline and diff share one audit identity",
      role: "Auditor", crumbs: ["Admin", "Administration", "Audit trail"], searchPh: "Search actor, object, action, correlation id…",
      viewStream: "Event stream", viewTimeline: "Object timeline", viewDiff: "Before / after",
      exportBtn: "Export (policy pending)", filters: ["Actor: any", "Object: VIS-2026-04182", "Action: any", "Last 7 days"],
      integrity: "Integrity", integrityD: "Append-only at the UI: no edit or delete affordance exists. The UI cannot prove backend immutability — tamper evidence is an open seam (HANDOFF_BLOCKED_TAMPER_EVIDENCE).",
      corr: "Correlation", ver: "config version",
      events: [
        ["2026-07-14 16:42:08", "review.approved", "Khalid Al-Dossari (Reviewer L2)", "Visit VIS-2026-04182 approved at L2", "runtime", "wf v7", "COR-88412"],
        ["2026-07-14 16:41:55", "review.guard_evaluated", "system", "Guard assignment.active = true passed", "runtime", "wf v7", "COR-88412"],
        ["2026-07-14 14:03:19", "visit.submitted", "Faisal Al-Harbi (Inspector)", "Visit VIS-2026-04182 submitted from field device", "runtime", "wf v7", "COR-88412"],
        ["2026-07-12 09:15:44", "workflow.draft_proposed", "Sara Al-Otaibi (Workflow Admin)", "proposeWorkflowDraft → INSPECTION_VISIT_LIFECYCLE v8", "config", "wf v8", "COR-88104"],
        ["2026-07-11 11:02:31", "permissions.published", "Noura Al-Qahtani (Security Admin)", "Matrix v12 published (checker: Omar Al-Ghamdi)", "config", "rbac v12", "COR-87990"]],
      diffTitle: "workflow.draft_proposed — payload diff", diffBefore: "BEFORE (v7 published)", diffAfter: "AFTER (v8 draft)",
      tlTitle: "Object timeline — VIS-2026-04182",
      redactT: "Sensitive payload redacted", redactD: "Field values marked sensitive (contact phone, GPS trace) render as █ MASKED for the Auditor role; Security Admin sees a reveal action that is itself audited. Masking rules are policy-pending (HANDOFF_BLOCKED_PRIVACY_MASKING).",
      partialT: "Partial payload", partialD: "Event COR-87455 was written before payload schema v2 — the before-image is absent by history, not by failure. The gap is labelled, never back-filled.",
      degradedT: "Audit read degraded", degradedD: "The event query timed out at 2.4M rows; results are truncated to the newest 200. Narrow the date or object filter — nothing is missing from the store, only from this page.",
      noDelivT: "External delivery unconfirmed", noDelivD: "notification.queued exists for COR-88412, but no delivery receipt store is located — delivery is shown as unknown, not failed (HANDOFF_BLOCKED_DELIVERY_RECEIPTS).",
      blkTitle: "Open audit seams", blk: [["Retention / export policy", "no retention contract located", "blocked", "HANDOFF_BLOCKED_RETENTION_POLICY"], ["Privacy masking rules", "masking policy pending", "computed", "HANDOFF_BLOCKED_PRIVACY_MASKING"], ["Tamper evidence (hash chain)", "no mechanism located", "blocked", "HANDOFF_BLOCKED_TAMPER_EVIDENCE"], ["Timestamp timezone contract", "display TZ pending decision", "computed", "HANDOFF_BLOCKED_TZ_CONTRACT"]],
      emptyT: "No events", emptyD: "No audit events exist for this scope yet.", filteredT: "No events match", filteredD: "Widen the date range or clear the actor/object filters.",
      loading: "Loading audit events…", kEvents: "Events (7d)", kActors: "Actors", kObjects: "Objects", kCorr: "Correlations" },
    ar: { group: "الإدارة العامة", title: "متصفح سجل التدقيق", sub: "مستكشف أحداث إلحاقي فقط يُقرأ كسرد للحالة: من غيّر ماذا ومتى ولماذا وتحت أي إصدار — التدفق وخط زمن الكائن والفرق تتشارك هوية تدقيق واحدة",
      role: "مدقّق", crumbs: ["الإدارة", "الإدارة العامة", "سجل التدقيق"], searchPh: "ابحث بالمُنفّذ أو الكائن أو الإجراء أو معرّف الارتباط…",
      viewStream: "تدفق الأحداث", viewTimeline: "خط زمن الكائن", viewDiff: "قبل / بعد",
      exportBtn: "تصدير (السياسة معلّقة)", filters: ["المُنفّذ: أي", "الكائن: VIS-2026-04182", "الإجراء: أي", "آخر ٧ أيام"],
      integrity: "السلامة", integrityD: "إلحاقي فقط في الواجهة: لا وسيلة تعديل أو حذف. لا تستطيع الواجهة إثبات عدم قابلية التغيير في الخادم — دليل العبث فاصل مفتوح (HANDOFF_BLOCKED_TAMPER_EVIDENCE).",
      corr: "الارتباط", ver: "إصدار الإعداد",
      events: [
        ["2026-07-14 16:42:08", "review.approved", "خالد الدوسري (مراجع م٢)", "اعتُمدت الزيارة VIS-2026-04182 في م٢", "runtime", "wf v7", "COR-88412"],
        ["2026-07-14 16:41:55", "review.guard_evaluated", "النظام", "الشرط assignment.active = true اجتاز", "runtime", "wf v7", "COR-88412"],
        ["2026-07-14 14:03:19", "visit.submitted", "فيصل الحربي (مفتّش)", "قُدّمت الزيارة VIS-2026-04182 من الجهاز الميداني", "runtime", "wf v7", "COR-88412"],
        ["2026-07-12 09:15:44", "workflow.draft_proposed", "سارة العتيبي (مشرفة سير العمل)", "proposeWorkflowDraft ← INSPECTION_VISIT_LIFECYCLE v8", "config", "wf v8", "COR-88104"],
        ["2026-07-11 11:02:31", "permissions.published", "نورة القحطاني (مشرفة أمنية)", "نُشرت المصفوفة v12 (المدقّق: عمر الغامدي)", "config", "rbac v12", "COR-87990"]],
      diffTitle: "workflow.draft_proposed — فرق الحمولة", diffBefore: "قبل (v7 منشور)", diffAfter: "بعد (v8 مسودة)",
      tlTitle: "خط زمن الكائن — VIS-2026-04182",
      redactT: "حمولة حسّاسة محجوبة", redactD: "القيم المعلَّمة حسّاسة (هاتف جهة الاتصال، مسار GPS) تُعرض █ محجوبة لدور المدقّق؛ ويرى المشرف الأمني إجراء كشف يُدقَّق هو نفسه. قواعد الحجب معلّقة سياسيًا (HANDOFF_BLOCKED_PRIVACY_MASKING).",
      partialT: "حمولة جزئية", partialD: "كُتب الحدث COR-87455 قبل مخطط الحمولة v2 — صورة «قبل» غائبة تاريخيًا لا فشلًا. تُعلَّم الفجوة ولا تُملأ رجعيًا أبدًا.",
      degradedT: "قراءة التدقيق متدهورة", degradedD: "انتهت مهلة الاستعلام عند 2.4 مليون صف؛ اقتُطعت النتائج لأحدث 200. ضيّق مرشّح التاريخ أو الكائن — لا شيء مفقود من المخزن، بل من هذه الصفحة فقط.",
      noDelivT: "التسليم الخارجي غير مؤكَّد", noDelivD: "يوجد notification.queued للارتباط COR-88412، لكن لا مخزن إيصالات تسليم مُثبت — يُعرض التسليم «غير معروف» لا «فاشل» (HANDOFF_BLOCKED_DELIVERY_RECEIPTS).",
      blkTitle: "فواصل تدقيق مفتوحة", blk: [["سياسة الاحتفاظ / التصدير", "لا عقد احتفاظ مُثبت", "blocked", "HANDOFF_BLOCKED_RETENTION_POLICY"], ["قواعد حجب الخصوصية", "سياسة الحجب معلّقة", "computed", "HANDOFF_BLOCKED_PRIVACY_MASKING"], ["دليل العبث (سلسلة تجزئة)", "لا آلية مُثبتة", "blocked", "HANDOFF_BLOCKED_TAMPER_EVIDENCE"], ["عقد المنطقة الزمنية", "منطقة العرض بانتظار قرار", "computed", "HANDOFF_BLOCKED_TZ_CONTRACT"]],
      emptyT: "لا أحداث", emptyD: "لا توجد أحداث تدقيق لهذا النطاق بعد.", filteredT: "لا أحداث مطابقة", filteredD: "وسّع نطاق التاريخ أو امسح مرشّحات المُنفّذ/الكائن.",
      loading: "جارٍ تحميل أحداث التدقيق…", kEvents: "أحداث (٧ أيام)", kActors: "مُنفّذون", kObjects: "كائنات", kCorr: "ارتباطات" }
  };

  function stream(t, opts) {
    opts = opts || {};
    return '<div class="m-panel"><div class="m-panel__head"><h4>' + esc(t.viewStream) + '</h4>' + C.tt("proven", "audit_events (stated)") + '</div><div class="au-stream">' +
      t.events.map(function (e, i) {
        var redact = opts.redact && i === 2;
        return '<div class="au-ev au-ev--' + e[4] + '">' +
          '<span class="au-ev__ts">' + e[0] + '</span><span class="au-ev__dot"></span>' +
          '<span class="au-ev__body"><span class="au-ev__t"><b>' + e[1] + '</b>' + C.loz(e[4] === "config" ? "info" : "none", e[4]) + '<span class="au-corr">' + e[6] + '</span><span class="au-corr">' + e[5] + '</span></span>' +
          '<span>' + esc(e[3]) + (redact ? ' · GPS ' + '<span class="au-redact">█ MASKED</span>' : '') + '</span>' +
          '<span class="cd-sub">' + esc(e[2]) + '</span></span></div>';
      }).join("") + '</div></div>';
  }

  function diff(t) {
    return '<div class="m-panel"><div class="m-panel__head"><h4>' + esc(t.diffTitle) + '</h4><span class="au-corr">COR-88104</span></div>' +
      '<div class="au-diff"><div class="au-diff__before"><b>' + esc(t.diffBefore) + '</b><br><br>"sla_hours": <del>72</del>,<br>"states": 6,<br>"transitions": [<br>&nbsp;&nbsp;"submit", "review",<br>&nbsp;&nbsp;"approve", "close"<br>]</div>' +
      '<div class="au-diff__after"><b>' + esc(t.diffAfter) + '</b><br><br>"sla_hours": <ins>96</ins>,<br>"states": <ins>7</ins>,<br>"transitions": [<br>&nbsp;&nbsp;"submit", "review",<br>&nbsp;&nbsp;"approve", <ins>"return"</ins>, "close"<br>]</div></div></div>';
  }

  function integrity(t) {
    return '<div class="m-panel"><div class="m-panel__head"><h4>' + esc(t.integrity) + '</h4>' + C.tt("computed", "append-only at UI") + '</div><p class="cd-sub" style="line-height:1.55">' + esc(t.integrityD) + '</p></div>';
  }

  function bar(t) {
    return '<div class="ax-commandbar">' + t.filters.map(function (f, i) { return '<button class="ax-filterchip' + (i === 1 ? ' is-active' : '') + '">' + esc(f) + '</button>'; }).join("") +
      '<span class="ax-commandbar__spacer"></span>' +
      '<div class="wf-mode" role="group" aria-label="View"><a href="#" aria-current="page">' + esc(t.viewStream) + '</a><a href="#">' + esc(t.viewTimeline) + '</a><a href="#">' + esc(t.viewDiff) + '</a></div>' +
      '<button class="ax-btn ax-btn--secondary ax-btn--sm" disabled aria-disabled="true">' + esc(t.exportBtn) + '</button></div>';
  }

  function kpis(t) {
    return C.kpis([{ v: "12,408", l: t.kEvents, tier: "proven" }, { v: 87, l: t.kActors, tier: "proven" }, { v: "1,932", l: t.kObjects, tier: "proven" }, { v: "4,551", l: t.kCorr, tier: "proven" }]);
  }

  function grid(t, opts) {
    return '<div class="m-split"><div>' + stream(t, opts) + '</div><div style="display:flex;flex-direction:column;gap:16px">' + diff(t) + integrity(t) + C.blocked(t.blkTitle, t.blk) + '</div></div>';
  }

  function frame(lang, t, main) {
    return C.frame(lang, C.nav(lang, t.group, [["文", lang === "ar" ? "التعريب" : "Localization", false], ["⛬", t.crumbs[2], true]]),
      C.pagehead(lang, { title: t.title, sub: t.sub, role: t.role, crumbs: t.crumbs, searchPh: t.searchPh }), main);
  }

  function render(state, lang) {
    var t = L[lang];
    var body;
    if (state === "no-events") body = C.content(bar(t) + C.stateEmpty(lang, "⛬", t.emptyT, t.emptyD));
    else if (state === "filtered-empty") body = C.content(bar(t) + C.stateEmpty(lang, "⌕", t.filteredT, t.filteredD));
    else if (state === "loading") body = C.content(C.skeleton(lang, t.loading));
    else if (state === "unauthorized") body = C.content(C.stateUnauth(lang));
    else if (state === "offline") body = C.content(C.stateOffline(lang, "⛬"));
    else if (state === "redaction") body = C.content(bar(t) + C.banner("warning", "▓", t.redactT, t.redactD) + C.legend(lang) + grid(t, { redact: true }));
    else if (state === "partial-payload") body = C.content(bar(t) + C.banner("warning", "◧", t.partialT, t.partialD) + C.legend(lang) + grid(t, {}));
    else if (state === "degraded") body = C.content(bar(t) + C.banner("warning", "⚠", t.degradedT, t.degradedD) + C.legend(lang) + grid(t, {}));
    else if (state === "delivery-unknown") body = C.content(bar(t) + C.banner("warning", "?", t.noDelivT, t.noDelivD) + C.legend(lang) + grid(t, {}));
    else /* stream — primary */ body = C.content(bar(t) + C.legend(lang) + kpis(t) + grid(t, {}));
    return frame(lang, t, body);
  }

  C.register("cd19", {
    id: "CD-019", screen: "ADM-AUDIT", title: { en: "Audit trail browser", ar: "متصفح سجل التدقيق" },
    states: [
      { id: "stream", n: "S01", label: "Event stream — primary (narrative + diff)" },
      { id: "redaction", n: "S02", label: "Sensitive redaction (outlier)" },
      { id: "partial-payload", n: "S03", label: "Partial payload — historical gap" },
      { id: "degraded", n: "S04", label: "Service degraded — truncated read" },
      { id: "delivery-unknown", n: "S05", label: "External delivery unconfirmed" },
      { id: "filtered-empty", n: "S06", label: "Filtered empty" },
      { id: "no-events", n: "S07", label: "No events" },
      { id: "loading", n: "S08", label: "Loading" },
      { id: "unauthorized", n: "S09", label: "Unauthorized" },
      { id: "offline", n: "S10", label: "Offline" }
    ],
    outlier: "redaction",
    render: render
  });
})();
