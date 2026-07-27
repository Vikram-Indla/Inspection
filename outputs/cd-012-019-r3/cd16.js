/* CD-016 R2 · SCR-ADM-080 — Notification & SLA rules.
   PRESENT TRUTH: there is NO dedicated approved route. The primary frame is a
   BLOCKED CONCEPT BOUNDARY — an unavailable/hand-off surface. No live "Send
   test", "Activate", "Pause", counts, providers, queue, dedup, recipients,
   schedule, delivery or retry. A non-executable concept preview and the exact
   backend prerequisites are the content of this screen. */
(function () {
  "use strict";
  var C = window.CDM, esc = C.esc;

  var L = {
    en: { group: "Notification Configuration", title: "Notification & SLA rules", sub: "This destination is not available yet — it needs an approved route and backend contracts before any rule can exist",
      role: "Business Admin", crumbs: ["Admin", "Notification Configuration", "Rules"], searchPh: "Search (unavailable on this surface)…",
      mainT: "Notification & SLA rules are not available yet",
      mainD: "Today, notification behavior lives inside other flows (an in-app outbox exists; the bell shows in-app items). There is no rules surface: nothing here can be created, tested, activated or paused. What you see below is the proposed concept and the exact prerequisites, so the backend can be approved and built as its own slice.",
      seam: "HANDOFF_BLOCKED_ROUTE — no approved route/ownership for /admin/notifications",
      todayT: "What exists today", today: [["In-app outbox", "Notifications are queued internally; the bell reads them.", "PROVEN (outbox present)"], ["Email / SMS delivery", "No provider adapter is configured; nothing is sent externally.", "Not available"], ["Delivery receipts", "No receipt store; delivery can never be confirmed on any screen.", "Not available"]],
      conceptT: "Proposed rule studio — concept preview", conceptLbl: "NON-EXECUTABLE PREVIEW",
      rules: [["visit.submitted", "Reviewer L1 (role)", ["in-app", "email"]], ["review.sla_breach", "Reviewer L2 + Supervisor", ["in-app", "email"]], ["violation.recorded", "Factory contact", ["email", "sms"]]],
      tlT: "SLA timeline (concept)", tlEvents: [["0h", "event"], ["48h", "reminder"], ["72h", "breach → escalate"]],
      prereqT: "Backend prerequisites before an implementation slice",
      prereq: [
        ["Route & ownership", "Approved route, nav placement and owning role for the rules surface."],
        ["Rule schema", "Event, recipient rule, channels, template, timers, escalation — stored where, versioned how."],
        ["Recipient resolution", "How a rule resolves to people; behavior when it resolves to zero."],
        ["Provider configuration", "Email/SMS adapter contracts, credentials ownership, failure states."],
        ["Outbox → delivery contract", "Queue semantics, retries, and a delivery-receipt model."],
        ["Deduplication", "What happens when two rules match the same recipient and event."],
        ["Timing / calendar", "Work-calendar decision (DEC-003/007) for reminders and breach."],
        ["RLS, audit, failure states", "Who edits rules, which audit events exist, and every negative path."]],
      emptyNote: "There is intentionally no empty/loading/error family here — a surface that does not exist has exactly one honest state, plus this hand-off.",
      unavailable: "Unavailable" },
    ar: { group: "إعداد الإشعارات", title: "قواعد الإشعارات واتفاقيات الخدمة", sub: "هذه الوجهة غير متاحة بعد — تحتاج مسارًا معتمدًا وعقودًا خلفية قبل أن توجد أي قاعدة",
      role: "مشرف أعمال", crumbs: ["الإدارة", "إعداد الإشعارات", "القواعد"], searchPh: "البحث (غير متاح على هذا السطح)…",
      mainT: "قواعد الإشعارات واتفاقيات الخدمة غير متاحة بعد",
      mainD: "اليوم يعيش سلوك الإشعارات داخل تدفقات أخرى (يوجد صندوق صادر داخلي؛ ويعرض الجرس عناصر داخل التطبيق). لا يوجد سطح قواعد: لا شيء هنا يمكن إنشاؤه أو اختباره أو تفعيله أو إيقافه. ما تراه أدناه هو التصور المقترح والمتطلبات الدقيقة، ليُعتمد الخلفي ويُبنى كشريحة مستقلة.",
      seam: "HANDOFF_BLOCKED_ROUTE — لا مسار/ملكية معتمدة لـ /admin/notifications",
      todayT: "ما الموجود اليوم", today: [["صندوق صادر داخل التطبيق", "تُدرج الإشعارات داخليًا؛ ويقرؤها الجرس.", "مُثبت (الصندوق موجود)"], ["تسليم بريد / رسائل", "لا مُهايئ مزوّد مُهيّأ؛ لا يُرسل شيء خارجيًا.", "غير متاح"], ["إيصالات التسليم", "لا مخزن إيصالات؛ لا يمكن تأكيد التسليم في أي شاشة.", "غير متاح"]],
      conceptT: "استوديو القواعد المقترح — معاينة تصورية", conceptLbl: "معاينة غير قابلة للتنفيذ",
      rules: [["visit.submitted", "مراجع م١ (دور)", ["داخل التطبيق", "بريد"]], ["review.sla_breach", "مراجع م٢ + مشرف", ["داخل التطبيق", "بريد"]], ["violation.recorded", "جهة اتصال المنشأة", ["بريد", "رسائل"]]],
      tlT: "خط زمن الاتفاقية (تصور)", tlEvents: [["0س", "الحدث"], ["48س", "تذكير"], ["72س", "تجاوز ← تصعيد"]],
      prereqT: "متطلبات الخلفية قبل شريحة التنفيذ",
      prereq: [
        ["المسار والملكية", "مسار معتمد وموضع تنقل ودور مالك لسطح القواعد."],
        ["مخطط القاعدة", "الحدث وقاعدة المستلمين والقنوات والقالب والمؤقّتات والتصعيد — أين تُخزَّن وكيف تُصدَّر."],
        ["حلّ المستلمين", "كيف تُحلّ القاعدة إلى أشخاص؛ والسلوك عند الحلّ إلى صفر."],
        ["تهيئة المزوّدين", "عقود مُهايئات البريد/الرسائل وملكية بيانات الاعتماد وحالات الفشل."],
        ["عقد الصندوق ← التسليم", "دلالات الطابور وإعادة المحاولة ونموذج إيصالات التسليم."],
        ["إزالة التكرار", "ماذا يحدث عندما تطابق قاعدتان نفس المستلم والحدث."],
        ["التوقيت / التقويم", "قرار تقويم العمل (DEC-003/007) للتذكيرات والتجاوز."],
        ["RLS والتدقيق وحالات الفشل", "من يحرّر القواعد، وأي أحداث تدقيق توجد، وكل مسار سلبي."]],
      emptyNote: "لا توجد هنا عمدًا عائلة فارغ/تحميل/خطأ — سطحٌ غير موجود له حالة صادقة واحدة، إضافة إلى هذا التسليم.",
      unavailable: "غير متاح" }
  };

  function boundary(t, lang) {
    return '<div class="legacy-surface" style="padding:var(--legacy-space-400);display:flex;flex-direction:column;gap:var(--legacy-space-200);border-inline-start:3px solid var(--legacy-color-warning)">' +
      '<div class="legacy-row" style="gap:12px;flex-wrap:wrap"><span style="font-size:26px" aria-hidden="true">◔</span><h2 style="font:var(--legacy-text-heading)">' + esc(t.mainT) + '</h2><span class="nya__lbl">' + (lang === "ar" ? "غير متاح بعد" : "Not available yet") + '</span></div>' +
      '<p style="font:var(--legacy-text-body);line-height:1.6;max-inline-size:88ch;color:var(--legacy-color-text-secondary)">' + esc(t.mainD) + '</p>' +
      '<span class="nya__seam">' + esc(t.seam) + '</span></div>';
  }

  function today(t) {
    return '<div class="m-panel"><div class="m-panel__head"><h4>' + esc(t.todayT) + '</h4></div><dl class="m-kv">' +
      t.today.map(function (r) { return '<dt style="text-transform:none;font-size:11px">' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + ' ' + C.tt(/PROVEN|مُثبت/.test(r[2]) ? "proven" : "blocked", r[2]) + '</dd>'; }).join("") + '</dl></div>';
  }

  function concept(t, lang) {
    var pos = [6, 55, 94];
    return '<div class="qlane"><div class="qlane__head"><h3>' + esc(t.conceptT) + '</h3><span class="nya__lbl">' + esc(t.conceptLbl) + '</span></div>' +
      '<div style="display:flex;flex-direction:column;gap:10px">' + t.rules.map(function (r) {
        return '<div class="nt-rule" style="opacity:.75"><span class="nt-evt">' + r[0] + '</span>' +
          '<span style="display:flex;flex-direction:column;gap:4px"><span style="font:var(--legacy-text-body-strong)">' + esc(r[1]) + '</span>' +
          '<span style="display:flex;gap:6px;flex-wrap:wrap">' + r[2].map(function (ch) { return '<span class="nt-chan">' + esc(ch) + '</span>'; }).join("") + '</span></span>' +
          '<span class="roro">' + esc(t.unavailable) + '</span></div>';
      }).join("") + '</div>' +
      '<div class="m-panel" style="background:transparent"><div class="m-panel__head"><h4>' + esc(t.tlT) + '</h4></div>' +
      '<div class="nt-tl"><div class="nt-tl__axis"></div>' + t.tlEvents.map(function (e, i) {
        return '<div class="nt-tl__tick" style="inset-inline-start:' + pos[i] + '%"></div><div class="nt-tl__ev" style="inset-inline-start:' + pos[i] + '%;inset-block-start:2px"><span>' + esc(e[0]) + '</span><span class="nt-tl__dot' + (i === 2 ? ' nt-tl__dot--off' : '') + '"></span><span>' + esc(e[1]) + '</span></div>';
      }).join("") + '</div></div>' +
      '<div class="legacy-row" style="gap:8px"><button class="legacy-btn" tabindex="-1" aria-disabled="true">' + (lang === "ar" ? "إرسال اختبار" : "Send test") + '</button><button class="legacy-btn legacy-btn--secondary" tabindex="-1" aria-disabled="true">' + (lang === "ar" ? "تفعيل" : "Activate") + '</button><button class="legacy-btn legacy-btn--subtle" tabindex="-1" aria-disabled="true">' + (lang === "ar" ? "إيقاف مؤقت" : "Pause") + '</button></div>' +
      C.fixtureNote(lang) + '</div>';
  }

  function prereq(t) {
    return '<div class="m-panel"><div class="m-panel__head"><h4>' + esc(t.prereqT) + '</h4>' + C.tt("blocked", "NEEDS_APPROVED_CONTRACT") + '</div><dl class="m-kv">' +
      t.prereq.map(function (r) { return '<dt style="text-transform:none;font-size:11px">' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join("") + '</dl>' +
      '<p class="cd-sub">' + esc(t.emptyNote) + '</p></div>';
  }

  function frame(lang, t, main) {
    return C.frame(lang, C.nav(lang, t.group, [["◔", t.crumbs[2], true]]),
      C.pagehead(lang, { title: t.title, sub: t.sub, role: t.role, crumbs: t.crumbs, searchPh: t.searchPh }), main);
  }

  function render(state, lang) {
    var t = L[lang];
    var body;
    if (state === "unauthorized") body = C.content(C.stateUnauth(lang));
    else if (state === "concept") body = C.content(boundary(t, lang) + '<div class="m-split"><div>' + concept(t, lang) + '</div><div style="display:flex;flex-direction:column;gap:16px">' + today(t) + prereq(t) + '</div></div>');
    else /* blocked — primary */ body = C.content(boundary(t, lang) + '<div class="m-split"><div style="display:flex;flex-direction:column;gap:16px">' + today(t) + '</div>' + prereq(t) + '</div>');
    return frame(lang, t, body);
  }

  C.register("cd16", {
    id: "CD-016", screen: "SCR-ADM-080", title: { en: "Notification & SLA rules", ar: "قواعد الإشعارات والاتفاقيات" },
    states: [
      { id: "blocked", n: "S01", label: "Blocked concept boundary — primary (the honest state)" },
      { id: "concept", n: "S02", label: "Concept preview + prerequisites (non-executable, outlier)" },
      { id: "unauthorized", n: "S03", label: "Unauthorized" }
    ],
    outlier: "concept",
    render: render
  });
})();
