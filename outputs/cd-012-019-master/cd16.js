/* CD-016 · SCR-ADM-080 — Notification and SLA rules (event-to-outcome studio).
   NO dedicated route exists today (consolidated /admin surface) — the whole
   screen carries HANDOFF_BLOCKED_ROUTE. Provider adapters are open: only the
   outbox is present, so delivery is NEVER shown as succeeded. Timeline simulator
   over DEC-003/007 work calendar is design intent. */
(function () {
  "use strict";
  var C = window.CDM, esc = C.esc;

  var L = {
    en: { group: "Notification Configuration", title: "Notification & SLA rules", sub: "Event-to-outcome rule studio: timing, recipients and delivery-provider truth tested before activation — the SLA timeline stays visible at all times",
      role: "Business Admin", crumbs: ["Admin", "Notification Configuration", "Rules"], searchPh: "Search events and rules…",
      routeT: "No dedicated route exists", routeD: "Notification rules currently live on the consolidated /admin surface; this studio is a proposed route. Everything on this screen is design intent until a governed contract authorizes the destination — HANDOFF_BLOCKED_ROUTE.",
      rules: "Rules", tl: "SLA timeline preview — visit review (72h)", tlTag: "design intent — work calendar DEC-003/007",
      test: "Send test", activate: "Activate rule", pause: "Pause", deactivate: "Deactivate", newRule: "New rule",
      evCat: "Event catalogue", recipients: "Recipients", channels: "Channels", template: "Template", escalation: "Escalation",
      ruleRows: [
        ["visit.submitted", "Reviewer L1 (role)", ["in-app", "email"], "active"],
        ["review.sla_reminder", "Assigned reviewer", ["in-app"], "active"],
        ["review.sla_breach", "Reviewer L2 + Supervisor", ["in-app", "email"], "active"],
        ["violation.recorded", "Factory contact", ["email", "sms"], "draft"],
        ["package.published", "All inspectors (scope)", ["in-app"], "paused"]],
      tlEvents: [["0h", "event", ""], ["48h", "reminder", "warn"], ["66h", "reminder 2", "warn"], ["72h", "breach → escalate", "crit"]],
      provT: "Provider truth", prov: [["In-app (internal)", "outbox present — delivery internal", "proven", "outbox"], ["Email provider", "no adapter contract located", "blocked", "HANDOFF_BLOCKED_EMAIL_PROVIDER"], ["SMS provider", "no adapter contract located", "blocked", "HANDOFF_BLOCKED_SMS_PROVIDER"], ["Delivery receipts", "no receipt store located", "blocked", "HANDOFF_BLOCKED_DELIVERY_RECEIPTS"]],
      invalidT: "Invalid recipient rule", invalidD: "“Factory contact” resolves to zero recipients for 41 factories with no registered contact. Activation is blocked until a fallback recipient or exclusion is defined — silent no-delivery is not acceptable.",
      provPendT: "Provider pending", provPendD: "Email adapter is not configured. The rule can be saved as draft; activation of email/SMS channels stays disabled — only in-app (outbox) can activate.",
      testSentT: "Test queued to outbox", testSentD: "The test notification is written to the outbox (proven). Whether it is delivered cannot be shown — no provider receipt exists. This is queue truth, not delivery truth.",
      testFailT: "Test failed — template error", testFailD: "Placeholder {{factory_name}} is not available on event review.sla_breach. The template compiler rejects the rule; fix the placeholder before testing again.",
      breachT: "SLA breached — escalation fired (intent)", breachD: "Preview of the breach path: reminder at 48h and 66h, breach at 72h escalates to Reviewer L2 + Supervisor. Calendar pausing during correction windows needs DEC-007 confirmation.",
      pausedT: "Rule paused", pausedD: "package.published is paused — no notifications queue while paused; SLA timers continue unless the workflow pauses them (separate concern).",
      duplT: "Duplicate suppression undefined", duplD: "Two rules match visit.submitted for the same recipient. No dedup contract is located — HANDOFF_BLOCKED_DEDUP; the conflict is surfaced, not silently merged.",
      deactT: "Rule deactivated", deactD: "violation.recorded is deactivated with history preserved; reactivation follows the same approval grammar.",
      emptyT: "No rules configured", emptyD: "Create the first notification rule from the event catalogue.", loading: "Loading rules…",
      kRules: "Rules", kActive: "Active", kDraft: "Draft", kProv: "Providers configured" },
    ar: { group: "إعداد الإشعارات", title: "قواعد الإشعارات واتفاقيات الخدمة", sub: "استوديو قواعد من الحدث إلى الأثر: التوقيت والمستلمون وحقيقة مزوّد التسليم تُختبر قبل التفعيل — ويبقى خط زمن الاتفاقية مرئيًا دائمًا",
      role: "مشرف أعمال", crumbs: ["الإدارة", "إعداد الإشعارات", "القواعد"], searchPh: "ابحث في الأحداث والقواعد…",
      routeT: "لا يوجد مسار مخصص", routeD: "قواعد الإشعارات تعيش حاليًا على سطح /admin المُجمَّع؛ هذا الاستوديو مسار مقترح. كل ما في هذه الشاشة نيّة تصميمية حتى يُخوَّل الوجهةَ عقدٌ محكوم — HANDOFF_BLOCKED_ROUTE.",
      rules: "القواعد", tl: "معاينة خط زمن الاتفاقية — مراجعة الزيارة (٧٢ ساعة)", tlTag: "نيّة تصميمية — تقويم العمل DEC-003/007",
      test: "إرسال اختبار", activate: "تفعيل القاعدة", pause: "إيقاف مؤقت", deactivate: "إلغاء التفعيل", newRule: "قاعدة جديدة",
      evCat: "فهرس الأحداث", recipients: "المستلمون", channels: "القنوات", template: "القالب", escalation: "التصعيد",
      ruleRows: [
        ["visit.submitted", "مراجع م١ (دور)", ["داخل التطبيق", "بريد"], "active"],
        ["review.sla_reminder", "المراجع المُكلَّف", ["داخل التطبيق"], "active"],
        ["review.sla_breach", "مراجع م٢ + مشرف", ["داخل التطبيق", "بريد"], "active"],
        ["violation.recorded", "جهة اتصال المنشأة", ["بريد", "رسائل نصية"], "draft"],
        ["package.published", "جميع المفتّشين (نطاق)", ["داخل التطبيق"], "paused"]],
      tlEvents: [["0س", "الحدث", ""], ["48س", "تذكير", "warn"], ["66س", "تذكير ٢", "warn"], ["72س", "تجاوز ← تصعيد", "crit"]],
      provT: "حقيقة المزوّد", prov: [["داخل التطبيق (داخلي)", "صندوق صادر موجود — التسليم داخلي", "proven", "outbox"], ["مزوّد البريد", "لا عقد مُهايئ مُثبت", "blocked", "HANDOFF_BLOCKED_EMAIL_PROVIDER"], ["مزوّد الرسائل النصية", "لا عقد مُهايئ مُثبت", "blocked", "HANDOFF_BLOCKED_SMS_PROVIDER"], ["إيصالات التسليم", "لا مخزن إيصالات مُثبت", "blocked", "HANDOFF_BLOCKED_DELIVERY_RECEIPTS"]],
      invalidT: "قاعدة مستلمين غير صالحة", invalidD: "«جهة اتصال المنشأة» تُحلّ إلى صفر مستلمين لـ 41 منشأة بلا جهة اتصال مسجلة. يُحجب التفعيل حتى يُعرَّف مستلم بديل أو استثناء — عدم التسليم الصامت غير مقبول.",
      provPendT: "المزوّد قيد الانتظار", provPendD: "مُهايئ البريد غير مُهيّأ. يمكن حفظ القاعدة كمسودة؛ ويبقى تفعيل قنوات البريد/الرسائل معطّلًا — يمكن تفعيل داخل التطبيق (الصندوق الصادر) فقط.",
      testSentT: "الاختبار أُدرج في الصندوق الصادر", testSentD: "كُتب إشعار الاختبار في الصندوق الصادر (مُثبت). أما وصوله فلا يمكن عرضه — لا يوجد إيصال مزوّد. هذه حقيقة الطابور لا حقيقة التسليم.",
      testFailT: "فشل الاختبار — خطأ قالب", testFailD: "المتغيّر {{factory_name}} غير متاح على الحدث review.sla_breach. يرفض مُجمّع القوالب القاعدة؛ صحّح المتغيّر قبل إعادة الاختبار.",
      breachT: "تجاوز الاتفاقية — انطلق التصعيد (نيّة)", breachD: "معاينة مسار التجاوز: تذكير عند 48س و66س، وتجاوز عند 72س يُصعِّد إلى مراجع م٢ + مشرف. إيقاف التقويم أثناء نوافذ التصحيح يحتاج تأكيد DEC-007.",
      pausedT: "القاعدة موقوفة مؤقتًا", pausedD: "package.published موقوفة — لا تُدرج إشعارات أثناء الإيقاف؛ وتستمر مؤقّتات الاتفاقية ما لم يوقفها سير العمل (شأن منفصل).",
      duplT: "إزالة التكرار غير معرّفة", duplD: "قاعدتان تطابقان visit.submitted لنفس المستلم. لا عقد إزالة تكرار مُثبت — HANDOFF_BLOCKED_DEDUP؛ يُعرض التعارض ولا يُدمج صامتًا.",
      deactT: "أُلغي تفعيل القاعدة", deactD: "أُلغي تفعيل violation.recorded مع حفظ السجل؛ وإعادة التفعيل تتبع نفس قواعد الاعتماد.",
      emptyT: "لا قواعد مُهيّأة", emptyD: "أنشئ أول قاعدة إشعار من فهرس الأحداث.", loading: "جارٍ تحميل القواعد…",
      kRules: "قواعد", kActive: "فعّالة", kDraft: "مسودات", kProv: "مزوّدون مُهيّؤون" }
  };

  function ruleList(t, lang, opts) {
    opts = opts || {};
    var c = C.COM[lang];
    var stMap = { active: ["success", c.stActive], draft: ["warning", c.stDraft], paused: ["none", c.stPaused] };
    return '<div style="display:flex;flex-direction:column;gap:10px">' + t.ruleRows.map(function (r, i) {
      var st = stMap[r[3]];
      var conflict = opts.dup && i === 0;
      return '<div class="nt-rule' + (opts.expand === i ? ' nt-rule--expanded' : '') + '"' + (conflict ? ' style="border-color:var(--legacy-color-critical)"' : '') + '>' +
        '<span class="nt-evt">' + r[0] + '</span>' +
        '<span style="display:flex;flex-direction:column;gap:4px;min-inline-size:0"><span style="font:var(--legacy-text-body-strong)">' + esc(r[1]) + '</span>' +
        '<span style="display:flex;gap:6px;flex-wrap:wrap">' + r[2].map(function (ch) {
          var blockedCh = (ch === "email" || ch === "sms" || ch === "بريد" || ch === "رسائل نصية") && opts.provPend;
          return '<span class="nt-chan' + (blockedCh ? ' nt-chan--blocked' : '') + '">' + esc(ch) + '</span>';
        }).join("") + (conflict ? ' ' + C.tt("blocked", "HANDOFF_BLOCKED_DEDUP") : '') + '</span></span>' +
        C.loz(st[0], st[1]) + '</div>';
    }).join("") + '</div>';
  }

  function timeline(t, breach) {
    var pos = [4, 62, 84, 96];
    return '<div class="m-panel"><div class="m-panel__head"><h4>' + esc(t.tl) + '</h4>' + C.tt("computed", t.tlTag) + '</div>' +
      '<div class="nt-tl"><div class="nt-tl__axis"></div>' +
      t.tlEvents.map(function (e, i) {
        var mod = e[2] === "warn" ? " nt-tl__dot--warn" : e[2] === "crit" ? (breach ? " nt-tl__dot--crit" : " nt-tl__dot--off") : "";
        return '<div class="nt-tl__tick" style="inset-inline-start:' + pos[i] + '%"></div>' +
          '<div class="nt-tl__ev" style="inset-inline-start:' + pos[i] + '%;inset-block-start:2px"><span>' + esc(e[0]) + '</span><span class="nt-tl__dot' + mod + '"></span><span>' + esc(e[1]) + '</span></div>';
      }).join("") + '</div></div>';
  }

  function providers(t) {
    return '<div class="m-panel"><div class="m-panel__head"><h4>' + esc(t.provT) + '</h4></div><dl class="m-kv">' +
      t.prov.map(function (r) { return '<dt style="text-transform:none;font-size:11px">' + esc(r[0]) + '</dt><dd>' + (r[2] === "proven" ? esc(r[1]) : '<span class="wf-ph">' + esc(r[1]) + '</span>') + ' ' + C.tt(r[2], r[3]) + '</dd>'; }).join("") + '</dl></div>';
  }

  function bar(t, opts) {
    opts = opts || {};
    return '<div class="legacy-commandbar"><button class="legacy-btn legacy-btn--secondary">' + esc(t.test) + '</button>' +
      '<button class="legacy-btn"' + (opts.noAct ? ' disabled aria-disabled="true"' : '') + '>' + esc(t.activate) + '</button>' +
      '<button class="legacy-btn legacy-btn--subtle legacy-btn--sm">' + esc(t.pause) + '</button>' +
      '<span class="legacy-commandbar__spacer"></span><button class="legacy-btn legacy-btn--secondary">＋ ' + esc(t.newRule) + '</button></div>';
  }

  function routeBanner(t) { return C.banner("warning", "⚑", t.routeT, t.routeD); }

  function grid(t, lang, opts) {
    return '<div class="m-split"><div style="display:flex;flex-direction:column;gap:16px">' + ruleList(t, lang, opts) + '</div>' +
      '<div style="display:flex;flex-direction:column;gap:16px">' + timeline(t, opts && opts.breach) + providers(t) + '</div></div>';
  }

  function frame(lang, t, main) {
    return C.frame(lang, C.nav(lang, t.group, [["◔", t.crumbs[2], true]]),
      C.pagehead(lang, { title: t.title, sub: t.sub, role: t.role, crumbs: t.crumbs, searchPh: t.searchPh }), main);
  }

  function render(state, lang) {
    var t = L[lang];
    var body;
    if (state === "empty") body = C.content(routeBanner(t) + C.stateEmpty(lang, "◔", t.emptyT, t.emptyD, t.newRule));
    else if (state === "loading") body = C.content(C.skeleton(lang, t.loading));
    else if (state === "unauthorized") body = C.content(C.stateUnauth(lang));
    else if (state === "offline") body = C.content(C.stateOffline(lang, "◔"));
    else if (state === "invalid-recipient") body = C.content(routeBanner(t) + bar(t, { noAct: true }) + C.guard(t.invalidT, t.invalidD) + C.legend(lang) + grid(t, lang, { expand: 3 }));
    else if (state === "provider-pending") body = C.content(routeBanner(t) + bar(t, { noAct: true }) + C.banner("warning", "◌", t.provPendT, t.provPendD) + C.legend(lang) + grid(t, lang, { provPend: true }));
    else if (state === "test-sent") body = C.content(routeBanner(t) + bar(t, {}) + '<div class="legacy-banner"><span>⇥</span><div><strong>' + esc(t.testSentT) + '</strong><div class="cd-sub">' + esc(t.testSentD) + '</div></div></div>' + C.legend(lang) + grid(t, lang, {}));
    else if (state === "test-failed") body = C.content(routeBanner(t) + bar(t, { noAct: true }) + C.guard(t.testFailT, t.testFailD) + C.legend(lang) + grid(t, lang, { expand: 2 }));
    else if (state === "breached") body = C.content(routeBanner(t) + bar(t, {}) + C.banner("warning", "⚠", t.breachT, t.breachD) + C.legend(lang) + grid(t, lang, { breach: true, expand: 2 }));
    else if (state === "paused") body = C.content(routeBanner(t) + bar(t, {}) + C.banner("warning", "⏸", t.pausedT, t.pausedD) + C.legend(lang) + grid(t, lang, { expand: 4 }));
    else if (state === "duplicate") body = C.content(routeBanner(t) + bar(t, { noAct: true }) + C.guard(t.duplT, t.duplD) + C.legend(lang) + grid(t, lang, { dup: true }));
    else if (state === "deactivated") body = C.content(routeBanner(t) + bar(t, {}) + '<div class="legacy-banner"><span>◇</span><div><strong>' + esc(t.deactT) + '</strong><div class="cd-sub">' + esc(t.deactD) + '</div></div></div>' + C.legend(lang) + grid(t, lang, {}));
    else /* active — primary */ body = C.content(routeBanner(t) + bar(t, {}) +
      C.kpis([{ v: 5, l: t.kRules, tier: "computed", tierLabel: "intent" }, { v: 3, l: t.kActive, tier: "computed", tierLabel: "intent" }, { v: 1, l: t.kDraft, tier: "computed", tierLabel: "intent" }, { v: "1/4", l: t.kProv, tier: "blocked", tierLabel: "providers" }]) +
      C.legend(lang) + grid(t, lang, { expand: 2 }));
    return frame(lang, t, body);
  }

  C.register("cd16", {
    id: "CD-016", screen: "SCR-ADM-080", title: { en: "Notification & SLA rules", ar: "قواعد الإشعارات والاتفاقيات" },
    states: [
      { id: "active", n: "S01", label: "Active rules — primary (route blocked banner)" },
      { id: "invalid-recipient", n: "S02", label: "Invalid recipient — activation blocked (outlier)" },
      { id: "provider-pending", n: "S03", label: "Provider pending — channels disabled" },
      { id: "test-sent", n: "S04", label: "Test queued — outbox truth only" },
      { id: "test-failed", n: "S05", label: "Test failed — template error" },
      { id: "breached", n: "S06", label: "SLA breached — escalation preview (intent)" },
      { id: "paused", n: "S07", label: "Rule paused" },
      { id: "duplicate", n: "S08", label: "Duplicate rule — dedup blocked" },
      { id: "deactivated", n: "S09", label: "Deactivated with history" },
      { id: "empty", n: "S10", label: "Empty — no rules" },
      { id: "loading", n: "S11", label: "Loading" },
      { id: "unauthorized", n: "S12", label: "Unauthorized" },
      { id: "offline", n: "S13", label: "Offline" }
    ],
    outlier: "invalid-recipient",
    render: render
  });
})();
