/* CD-019 R2 · ADM-AUDIT — Audit trail browser.
   PRESENT TRUTH: the real append-only audit_events reader — filters,
   pagination, RLS-scoped visibility, before/after JSON detail. NO fake event/
   correlation totals, masked-reveal, export, delivery receipts, hash-chain or
   retention/timezone claims. The proposed correlation/timeline view is a
   fixture-labelled concept; reveal/export are plain-language boundaries. */
(function () {
  "use strict";
  var C = window.CDM, esc = C.esc;

  var L = {
    en: { group: "Administration", title: "Audit trail", sub: "The append-only audit_events reader: filter, page through events, and open any event's before/after JSON — visibility is RLS-scoped",
      role: "Auditor", crumbs: ["Admin", "Administration", "Audit trail"], searchPh: "Filter by actor, object, action…",
      filters: ["Object: VIS-2026-04182", "Actor: any", "Action: any", "Last 7 days"],
      pageLbl: "Page 1 · 25 per page", prev: "Previous", next: "Next",
      countNote: "This page shows the events returned for the current filter and page. Totals across the store are not computed by the current reader.",
      events: [
        ["2026-07-14 16:42:08", "review.approved", "Khalid Al-Dossari (Reviewer L2)", "Visit VIS-2026-04182 approved at L2", "runtime"],
        ["2026-07-14 14:03:19", "visit.submitted", "Faisal Al-Harbi (Inspector)", "Visit VIS-2026-04182 submitted from field device", "runtime"],
        ["2026-07-12 09:15:44", "workflow.draft_proposed", "Sara Al-Otaibi (Workflow Admin)", "proposeWorkflowDraft → INSPECTION_VISIT_LIFECYCLE v8", "config"],
        ["2026-07-11 11:02:31", "settings.updated", "Noura Al-Qahtani (Security Admin)", "engine_settings risk_model saved", "config"],
        ["2026-07-10 08:44:02", "geofence.radius_updated", "Sara Al-Otaibi (GIS Admin)", "updateGeofenceRadius FAC-08841 → 150 m", "config"]],
      diffT: "Event detail — before / after JSON", diffBefore: "BEFORE", diffAfter: "AFTER",
      diffNote: "The stored before/after images for the selected event, verbatim.",
      rlsNote: "You see events your role is allowed to read. Events outside your scope are absent, not redacted rows.",
      corrT: "Correlation / timeline view", corrD: "Grouping events by a shared correlation across objects is a proposed read model — the current reader has no correlation column to group on. The sketch in the evidence pack is fixture-only.",
      corrSeam: "NEEDS_APPROVED_CONTRACT — correlation read model",
      revealT: "Sensitive reveal & export", revealD: "Revealing masked payload fields and exporting event sets need privacy, retention and audit contracts first. Neither action exists on this screen today.",
      revealSeam: "BLOCKED_BY_DECISION — privacy / retention",
      degradedT: "Query timed out", degradedD: "The current filter scanned too many rows and the read was cut short. Narrow the date range or add an object filter and run it again — the store itself is unaffected.",
      partialT: "Older event, smaller payload", partialD: "This event predates the current payload shape, so its before-image is absent by history. The gap is shown as-is, never back-filled.",
      emptyT: "No events for this filter", emptyD: "Widen the date range or clear the actor/object filters.",
      noneT: "No events yet", noneD: "No audit events exist in your visible scope.",
      loading: "Loading audit events…" },
    ar: { group: "الإدارة العامة", title: "سجل التدقيق", sub: "قارئ audit_events الإلحاقي فقط: رشّح وتصفّح الأحداث وافتح JSON قبل/بعد لأي حدث — والرؤية بنطاق سياسات RLS",
      role: "مدقّق", crumbs: ["الإدارة", "الإدارة العامة", "سجل التدقيق"], searchPh: "رشّح بالمُنفّذ أو الكائن أو الإجراء…",
      filters: ["الكائن: VIS-2026-04182", "المُنفّذ: أي", "الإجراء: أي", "آخر ٧ أيام"],
      pageLbl: "صفحة 1 · 25 لكل صفحة", prev: "السابق", next: "التالي",
      countNote: "تعرض هذه الصفحة الأحداث المُعادة للمرشّح والصفحة الحاليين. لا يحسب القارئ الحالي مجاميع عبر المخزن.",
      events: [
        ["2026-07-14 16:42:08", "review.approved", "خالد الدوسري (مراجع م٢)", "اعتُمدت الزيارة VIS-2026-04182 في م٢", "runtime"],
        ["2026-07-14 14:03:19", "visit.submitted", "فيصل الحربي (مفتّش)", "قُدّمت الزيارة VIS-2026-04182 من الجهاز الميداني", "runtime"],
        ["2026-07-12 09:15:44", "workflow.draft_proposed", "سارة العتيبي (مشرفة سير العمل)", "proposeWorkflowDraft ← INSPECTION_VISIT_LIFECYCLE v8", "config"],
        ["2026-07-11 11:02:31", "settings.updated", "نورة القحطاني (مشرفة أمنية)", "حُفظ engine_settings risk_model", "config"],
        ["2026-07-10 08:44:02", "geofence.radius_updated", "سارة العتيبي (مشرفة نظم جغرافية)", "updateGeofenceRadius FAC-08841 ← 150 م", "config"]],
      diffT: "تفصيل الحدث — JSON قبل / بعد", diffBefore: "قبل", diffAfter: "بعد",
      diffNote: "صورتا قبل/بعد المخزَّنتان للحدث المحدد، حرفيًا.",
      rlsNote: "ترى الأحداث المسموح لدورك قراءتها. الأحداث خارج نطاقك غائبة، لا صفوفًا محجوبة.",
      corrT: "عرض الارتباط / خط الزمن", corrD: "تجميع الأحداث بارتباط مشترك عبر الكائنات نموذج قراءة مقترح — لا يملك القارئ الحالي عمود ارتباط للتجميع عليه. الرسم في حزمة الأدلة نموذج تصميمي فقط.",
      corrSeam: "NEEDS_APPROVED_CONTRACT — نموذج قراءة الارتباط",
      revealT: "كشف الحساس والتصدير", revealD: "كشف حقول الحمولة المحجوبة وتصدير مجموعات الأحداث يحتاجان أولًا عقود خصوصية واحتفاظ وتدقيق. لا يوجد أيٌّ من الإجراءين في هذه الشاشة اليوم.",
      revealSeam: "BLOCKED_BY_DECISION — الخصوصية / الاحتفاظ",
      degradedT: "انتهت مهلة الاستعلام", degradedD: "مسح المرشّح الحالي صفوفًا كثيرة جدًا وقُطعت القراءة. ضيّق نطاق التاريخ أو أضف مرشّح كائن وأعد التشغيل — المخزن نفسه غير متأثر.",
      partialT: "حدث أقدم بحمولة أصغر", partialD: "يسبق هذا الحدث شكل الحمولة الحالي، فصورة «قبل» غائبة تاريخيًا. تُعرض الفجوة كما هي ولا تُملأ رجعيًا.",
      emptyT: "لا أحداث لهذا المرشّح", emptyD: "وسّع نطاق التاريخ أو امسح مرشّحات المُنفّذ/الكائن.",
      noneT: "لا أحداث بعد", noneD: "لا توجد أحداث تدقيق في نطاقك المرئي.",
      loading: "جارٍ تحميل أحداث التدقيق…" }
  };

  function stream(t, opts) {
    opts = opts || {};
    return '<div class="m-panel"><div class="m-panel__head"><h4>audit_events</h4>' + C.tt("proven", "append-only reader") + '</div><div class="au-stream">' +
      t.events.map(function (e, i) {
        return '<div class="au-ev au-ev--' + e[4] + '">' +
          '<span class="au-ev__ts">' + e[0] + '</span><span class="au-ev__dot"></span>' +
          '<span class="au-ev__body"><span class="au-ev__t"><b>' + e[1] + '</b>' + C.loz(e[4] === "config" ? "info" : "none", e[4]) + (opts.partial && i === 4 ? ' ' + C.loz("warning", t.partialT) : '') + '</span>' +
          '<span>' + esc(e[3]) + '</span><span class="cd-sub">' + esc(e[2]) + '</span></span></div>';
      }).join("") + '</div>' +
      '<div class="legacy-row" style="justify-content:space-between;flex-wrap:wrap;gap:10px"><span class="cd-sub">' + esc(t.pageLbl) + '</span>' +
      '<span style="display:flex;gap:6px"><button class="legacy-btn legacy-btn--subtle legacy-btn--sm" disabled aria-disabled="true">' + esc(t.prev) + '</button><button class="legacy-btn legacy-btn--secondary legacy-btn--sm">' + esc(t.next) + '</button></span></div>' +
      '<p class="cd-sub">' + esc(t.countNote) + ' ' + esc(t.rlsNote) + '</p></div>';
  }

  function diff(t, partial) {
    return '<div class="m-panel"><div class="m-panel__head"><h4>' + esc(t.diffT) + '</h4>' + C.tt("proven", "stored images") + '</div>' +
      '<div class="au-diff"><div class="au-diff__before"><b>' + esc(t.diffBefore) + '</b><br><br>' +
      (partial ? '<span style="color:var(--legacy-color-text-secondary)">— ' + esc(t.partialD) + '</span>' : '"radius_m": <del>150</del>') + '</div>' +
      '<div class="au-diff__after"><b>' + esc(t.diffAfter) + '</b><br><br>"radius_m": <ins>175</ins>,<br>"updated_by": "sara",<br>"updated_at": "2026-07-10T08:44:02Z"</div></div>' +
      '<p class="cd-sub">' + esc(t.diffNote) + '</p></div>';
  }

  function boundaries(t, lang) {
    return C.notYet(lang, t.corrT, t.corrD, t.corrSeam) + C.notYet(lang, t.revealT, t.revealD, t.revealSeam);
  }

  function bar(t) {
    return '<div class="legacy-commandbar">' + t.filters.map(function (f, i) { return '<button class="legacy-filterchip' + (i === 0 ? ' is-active' : '') + '">' + esc(f) + '</button>'; }).join("") + '<span class="legacy-commandbar__spacer"></span></div>';
  }

  function frame(lang, t, main) {
    return C.frame(lang, C.nav(lang, t.group, [["文", lang === "ar" ? "التعريب" : "Localization", false], ["⛬", t.crumbs[2], true]]),
      C.pagehead(lang, { title: t.title, sub: t.sub, role: t.role, crumbs: t.crumbs, searchPh: t.searchPh }), main);
  }

  function grid(t, lang, opts) {
    return '<div class="m-split"><div>' + stream(t, opts) + '</div><div style="display:flex;flex-direction:column;gap:16px">' + diff(t, opts && opts.partial) + boundaries(t, lang) + '</div></div>';
  }

  function render(state, lang) {
    var t = L[lang];
    var body;
    if (state === "no-events") body = C.content(bar(t) + C.stateEmpty(lang, "⛬", t.noneT, t.noneD));
    else if (state === "filtered-empty") body = C.content(bar(t) + C.stateEmpty(lang, "⌕", t.emptyT, t.emptyD));
    else if (state === "loading") body = C.content(C.skeleton(lang, t.loading));
    else if (state === "unauthorized") body = C.content(C.stateUnauth(lang));
    else if (state === "offline") body = C.content(C.stateOffline(lang, "⛬"));
    else if (state === "partial-payload") body = C.content(bar(t) + C.banner("warning", "◧", t.partialT, t.partialD) + C.legend(lang) + grid(t, lang, { partial: true }));
    else if (state === "degraded") body = C.content(bar(t) + C.banner("warning", "⚠", t.degradedT, t.degradedD) + C.legend(lang) + grid(t, lang, {}));
    else /* stream — primary */ body = C.content(bar(t) + C.legend(lang) + grid(t, lang, {}));
    return frame(lang, t, body);
  }

  C.register("cd19", {
    id: "CD-019", screen: "ADM-AUDIT", title: { en: "Audit trail", ar: "سجل التدقيق" },
    states: [
      { id: "stream", n: "S01", label: "Reader — primary (filters + pagination + diff)" },
      { id: "partial-payload", n: "S02", label: "Historical gap in payload (outlier)" },
      { id: "degraded", n: "S03", label: "Query timed out — narrow and retry" },
      { id: "filtered-empty", n: "S04", label: "Filtered empty" },
      { id: "no-events", n: "S05", label: "No events in scope" },
      { id: "loading", n: "S06", label: "Loading" },
      { id: "unauthorized", n: "S07", label: "Unauthorized" },
      { id: "offline", n: "S08", label: "Offline" }
    ],
    outlier: "partial-payload",
    render: render
  });
})();
