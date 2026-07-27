/* CD-013 R2 · SCR-ADM-051 — Workflow designer.
   PRESENT TRUTH: the current implementation is a JSON draft payload editor on
   /admin/workflows (same config_versions spine as CD-012; actions
   proposeWorkflowDraft / saveWorkflowDraft / approvePublishWorkflow).
   Canvas editing, graph validation, invalid-edge prevention, scenario replay,
   test store, SLA calendar and publish notification are NOT established — they
   live in a visibly non-executable QUARANTINED FUTURE-CONTRACT LANE. */
(function () {
  "use strict";
  var C = window.CDM, esc = C.esc;

  var L = {
    en: { group: "Workflow Configuration", title: "Workflow draft editor — INSPECTION_VISIT_LIFECYCLE v8", sub: "Edit the draft config_versions payload. The visual designer below is a proposed future contract — nothing in it executes today",
      role: "Workflow Admin (maker)", crumbs: ["Admin", "Workflow Configuration", "Workflow draft editor"], searchPh: "Search within the draft payload…",
      modeLib: "Library", modeEditor: "Draft editor",
      edTitle: "Draft payload — v8 (JSON)", edMeta: "proposed by Sara Al-Otaibi · 2026-07-12 · draft",
      save: "Save draft", saveAct: "saveWorkflowDraft", approve: "Approve & publish", approveAct: "approvePublishWorkflow", propose: "Propose new draft",
      structT: "Transition structure (read from this payload)", structNote: "Derived by reading the JSON above — a rendering of the draft, not a validator.",
      qTitle: "Proposed visual designer — future contract", qLbl: "NON-EXECUTABLE PREVIEW",
      qIntro: "What a governed designer would add, and what each part needs before it can be built:",
      qItems: [
        ["Canvas editing", "Drag states and draw transitions instead of editing JSON.", "Needs: canvas↔payload mapping spec, keyboard/RTL interaction contract.", "NEEDS_APPROVED_CONTRACT"],
        ["Graph validation (unreachable / cycles / invalid edges)", "Save would warn before a broken graph is submitted.", "Needs: named algorithm, where it runs, failure behavior.", "HANDOFF_BLOCKED_GRAPH_ANALYSIS"],
        ["Scenario replay", "Step a sample case through guards before publishing.", "Needs: simulation engine, case fixture source, result persistence, audit.", "HANDOFF_BLOCKED_SIMULATION"],
        ["SLA timers & publish notification", "Timers and notify-on-publish attached to transitions.", "Needs: work-calendar decision (DEC-003/007), notification route + providers.", "HANDOFF_BLOCKED_SLA_CALENDAR"]],
      sepT: "You cannot approve this draft", sepD: "Approving and publishing requires a different checker than the maker. This draft was proposed by you.",
      immT: "Published v7 is read-only", immD: "Published versions are immutable. To change the workflow, propose a new draft — the editor below opens on the copy, never on v7.",
      valT: "Draft not saved", valD: "saveWorkflowDraft rejected the payload:", valItems: ["JSON parse error at line 14 (trailing comma).", "transitions[2].to references undefined state \"supervisor_review\".", "states must include exactly one initial: true."],
      submittedT: "v8 submitted — frozen for review", submittedD: "The payload is read-only while awaiting the checker. It can be approved & published or returned; it cannot be edited.",
      savedT: "Draft saved", savedD: "saveWorkflowDraft wrote the payload to config_versions v8 (draft). Nothing reaches runtime until a checker approves & publishes.",
      emptyT: "No draft open", emptyD: "Open a workflow from the library or propose a new draft.", emptyCta: "Propose new draft",
      loading: "Loading draft payload…" },
    ar: { group: "إعداد سير العمل", title: "محرّر مسودة سير العمل — INSPECTION_VISIT_LIFECYCLE v8", sub: "حرّر حمولة مسودة config_versions. المُصمّم المرئي أدناه عقد مستقبلي مقترح — لا شيء فيه يعمل اليوم",
      role: "مشرف سير العمل (صانع)", crumbs: ["الإدارة", "إعداد سير العمل", "محرّر مسودة سير العمل"], searchPh: "ابحث داخل حمولة المسودة…",
      modeLib: "المكتبة", modeEditor: "محرّر المسودة",
      edTitle: "حمولة المسودة — v8 (JSON)", edMeta: "اقترحتها سارة العتيبي · 2026-07-12 · مسودة",
      save: "حفظ المسودة", saveAct: "saveWorkflowDraft", approve: "اعتماد ونشر", approveAct: "approvePublishWorkflow", propose: "اقتراح مسودة جديدة",
      structT: "بنية الانتقالات (مقروءة من هذه الحمولة)", structNote: "مشتقة من قراءة JSON أعلاه — عرضٌ للمسودة وليس مُدقّقًا.",
      qTitle: "المُصمّم المرئي المقترح — عقد مستقبلي", qLbl: "معاينة غير قابلة للتنفيذ",
      qIntro: "ما الذي سيضيفه مُصمّم محكوم، وما يحتاجه كل جزء قبل بنائه:",
      qItems: [
        ["تحرير اللوحة", "سحب الحالات ورسم الانتقالات بدل تحرير JSON.", "يلزم: مواصفة ربط اللوحة بالحمولة، وعقد تفاعل لوحة المفاتيح وRTL.", "NEEDS_APPROVED_CONTRACT"],
        ["التحقق من الرسم (وصولية / دورات / أضلاع غير صالحة)", "سيحذّر الحفظ قبل تقديم رسم مكسور.", "يلزم: خوارزمية مسماة، ومكان تشغيلها، وسلوك الفشل.", "HANDOFF_BLOCKED_GRAPH_ANALYSIS"],
        ["إعادة تشغيل السيناريو", "تمرير حالة نموذجية عبر الشروط قبل النشر.", "يلزم: محرّك محاكاة، ومصدر حالات، وحفظ للنتائج، وتدقيق.", "HANDOFF_BLOCKED_SIMULATION"],
        ["مؤقّتات الاتفاقية وإشعار النشر", "مؤقّتات وإشعار-عند-النشر على الانتقالات.", "يلزم: قرار تقويم العمل (DEC-003/007)، ومسار إشعارات ومزوّدون.", "HANDOFF_BLOCKED_SLA_CALENDAR"]],
      sepT: "لا يمكنك اعتماد هذه المسودة", sepD: "الاعتماد والنشر يتطلبان مدقّقًا مختلفًا عن الصانع. هذه المسودة اقترحتَها أنت.",
      immT: "الإصدار المنشور v7 للقراءة فقط", immD: "الإصدارات المنشورة غير قابلة للتغيير. لتغيير سير العمل اقترح مسودة جديدة — يفتح المحرّر على النسخة لا على v7.",
      valT: "لم تُحفظ المسودة", valD: "رفض saveWorkflowDraft الحمولة:", valItems: ["خطأ تحليل JSON في السطر 14 (فاصلة زائدة).", "transitions[2].to يشير إلى حالة غير معرّفة \"supervisor_review\".", "يجب أن تتضمن states حالة واحدة بالضبط بـ initial: true."],
      submittedT: "v8 مُقدَّم — مجمّد للمراجعة", submittedD: "الحمولة للقراءة فقط بانتظار المدقّق. تُعتمد وتُنشر أو تُعاد؛ ولا تُحرَّر.",
      savedT: "حُفظت المسودة", savedD: "كتب saveWorkflowDraft الحمولة في config_versions v8 (مسودة). لا شيء يصل لبيئة التشغيل حتى يعتمدها مدقّق وينشرها.",
      emptyT: "لا مسودة مفتوحة", emptyD: "افتح سير عمل من المكتبة أو اقترح مسودة جديدة.", emptyCta: "اقتراح مسودة جديدة",
      loading: "جارٍ تحميل حمولة المسودة…" }
  };

  function editor(t, opts) {
    opts = opts || {};
    var err = opts.parseError;
    var code =
'{\n  <span class="k">"key"</span>: <span class="s">"INSPECTION_VISIT_LIFECYCLE"</span>,\n  <span class="k">"version"</span>: <span class="n">8</span>,\n  <span class="k">"states"</span>: [\n    { <span class="k">"id"</span>: <span class="s">"draft"</span>, <span class="k">"initial"</span>: <span class="n">true</span> },\n    { <span class="k">"id"</span>: <span class="s">"submitted"</span> },\n    { <span class="k">"id"</span>: <span class="s">"under_review"</span> },\n    { <span class="k">"id"</span>: <span class="s">"approved"</span> },\n    { <span class="k">"id"</span>: <span class="s">"returned"</span> },\n    { <span class="k">"id"</span>: <span class="s">"closed"</span>, <span class="k">"terminal"</span>: <span class="n">true</span> }\n  ],\n  <span class="k">"transitions"</span>: [\n    { <span class="k">"id"</span>: <span class="s">"submit"</span>, <span class="k">"from"</span>: <span class="s">"draft"</span>, <span class="k">"to"</span>: <span class="s">"submitted"</span>, <span class="k">"actor"</span>: <span class="s">"inspector"</span> }' + (err ? '<span class="err">,</span>' : ',') + '\n    { <span class="k">"id"</span>: <span class="s">"review"</span>, <span class="k">"from"</span>: <span class="s">"submitted"</span>, <span class="k">"to"</span>: <span class="s">"under_review"</span>, <span class="k">"actor"</span>: <span class="s">"reviewer_l1"</span> },\n    { <span class="k">"id"</span>: <span class="s">"approve"</span>, <span class="k">"from"</span>: <span class="s">"under_review"</span>, <span class="k">"to"</span>: ' + (opts.badRef ? '<span class="err"><span class="s">"supervisor_review"</span></span>' : '<span class="s">"approved"</span>') + ', <span class="k">"actor"</span>: <span class="s">"reviewer_l2"</span> },\n    { <span class="k">"id"</span>: <span class="s">"return"</span>, <span class="k">"from"</span>: <span class="s">"under_review"</span>, <span class="k">"to"</span>: <span class="s">"returned"</span> },\n    { <span class="k">"id"</span>: <span class="s">"close"</span>, <span class="k">"from"</span>: <span class="s">"approved"</span>, <span class="k">"to"</span>: <span class="s">"closed"</span> }\n  ]\n}';
    return '<div class="jed"><div class="jed__bar"><b style="font:var(--legacy-text-body-strong)">' + esc(t.edTitle) + '</b><span class="cd-sub">' + esc(t.edMeta) + '</span><span style="margin-inline-start:auto">' + C.tt("proven", "config_versions v8 payload") + '</span></div>' +
      '<pre class="jed__code" ' + (opts.readonly ? 'aria-readonly="true" style="opacity:.75"' : 'contenteditable="false"') + '>' + code + '</pre></div>';
  }

  function structure(t) {
    var rows = [["submit", "draft → submitted", "inspector"], ["review", "submitted → under_review", "reviewer_l1"], ["approve", "under_review → approved", "reviewer_l2"], ["return", "under_review → returned", "—"], ["close", "approved → closed (terminal)", "—"]];
    return '<div class="m-panel"><div class="m-panel__head"><h4>' + esc(t.structT) + '</h4>' + C.tt("computed", "COMPUTED_FROM_DRAFT_PAYLOAD") + '</div>' +
      '<dl class="m-kv">' + rows.map(function (r) { return '<dt>' + r[0] + '</dt><dd class="m-mono">' + r[1] + (r[2] !== "—" ? ' · ' + r[2] : '') + '</dd>'; }).join("") + '</dl>' +
      '<p class="cd-sub">' + esc(t.structNote) + '</p></div>';
  }

  function qlane(t, lang) {
    return '<div class="qlane"><div class="qlane__head"><h3>' + esc(t.qTitle) + '</h3><span class="nya__lbl">' + esc(t.qLbl) + '</span></div>' +
      '<p class="cd-sub" style="max-inline-size:80ch">' + esc(t.qIntro) + '</p>' +
      '<div class="m-split">' + t.qItems.map(function (q) {
        return '<div class="nya" style="border-inline-start-color:var(--legacy-color-border-strong)"><div class="nya__head"><b>' + esc(q[0]) + '</b></div><p class="nya__body">' + esc(q[1]) + ' ' + esc(q[2]) + '</p><span class="nya__seam">' + esc(q[3]) + '</span></div>';
      }).join("") + '</div>' +
      '<div class="legacy-row" style="gap:8px"><button class="legacy-btn legacy-btn--secondary" tabindex="-1" aria-disabled="true">' + (lang === "ar" ? "فتح اللوحة" : "Open canvas") + '</button><button class="legacy-btn legacy-btn--secondary" tabindex="-1" aria-disabled="true">' + (lang === "ar" ? "إعادة تشغيل سيناريو" : "Run replay") + '</button></div></div>';
  }

  function bar(t, opts) {
    opts = opts || {};
    return '<div class="legacy-commandbar">' +
      '<button class="legacy-btn"' + (opts.noSave ? ' disabled aria-disabled="true"' : '') + '>' + esc(t.save) + '</button>' +
      '<button class="legacy-btn legacy-btn--secondary"' + (opts.noApprove ? ' disabled aria-disabled="true"' : '') + '>' + esc(t.approve) + '</button>' +
      '<button class="legacy-btn legacy-btn--subtle">' + esc(t.propose) + '</button>' +
      '<span class="legacy-commandbar__spacer"></span><span class="cd-sub m-mono" dir="ltr">' + t.saveAct + ' · ' + t.approveAct + '</span></div>';
  }

  function frame(lang, t, main) {
    return C.frame(lang,
      C.nav(lang, t.group, [["⚙", lang === "ar" ? "مكتبة سير العمل" : "Workflow library", false], ["✎", t.crumbs[2], true]]),
      C.pagehead(lang, { title: t.title, sub: t.sub, role: t.role, crumbs: t.crumbs, searchPh: t.searchPh, mode: [[t.modeLib, false], [t.modeEditor, true]] }),
      main);
  }

  function grid(t, lang, opts) {
    return '<div class="m-split"><div>' + editor(t, opts) + '</div><div style="display:flex;flex-direction:column;gap:16px">' + structure(t) + '</div></div>' + qlane(t, lang);
  }

  function render(state, lang) {
    var t = L[lang];
    var body;
    if (state === "empty") body = C.content(C.stateEmpty(lang, "✎", t.emptyT, t.emptyD, t.emptyCta));
    else if (state === "loading") body = C.content(C.skeleton(lang, t.loading));
    else if (state === "unauthorized") body = C.content(C.stateUnauth(lang));
    else if (state === "offline") body = C.content(C.stateOffline(lang, "✎"));
    else if (state === "validation") body = C.content(bar(t, { noApprove: true }) +
      '<div class="legacy-validation"><strong style="font:var(--legacy-text-body-strong)">' + esc(t.valT) + '</strong><div class="cd-sub" style="margin-block:4px">' + esc(t.valD) + '</div><ul>' + t.valItems.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join("") + '</ul></div>' +
      C.legend(lang) + grid(t, lang, { parseError: true, badRef: true }));
    else if (state === "saved") body = C.content(bar(t, { noApprove: true }) + '<div class="legacy-banner"><span>✓</span><div><strong>' + esc(t.savedT) + '</strong><div class="cd-sub">' + esc(t.savedD) + '</div></div></div>' + C.legend(lang) + grid(t, lang, {}));
    else if (state === "own-draft") body = C.content(bar(t, { noApprove: true }) + C.guard(t.sepT, t.sepD) + C.legend(lang) + grid(t, lang, {}));
    else if (state === "submitted") body = C.content(bar(t, { noSave: true }) + C.banner("immutable", "▣", t.submittedT, t.submittedD) + C.legend(lang) + grid(t, lang, { readonly: true }));
    else if (state === "published-locked") body = C.content(bar(t, { noSave: true, noApprove: true }) + C.banner("immutable", "◆", t.immT, t.immD) + C.legend(lang) + grid(t, lang, { readonly: true }));
    else /* draft — primary */ body = C.content(bar(t, {}) + C.legend(lang) + grid(t, lang, {}));
    return frame(lang, t, body);
  }

  C.register("cd13", {
    id: "CD-013", screen: "SCR-ADM-051", title: { en: "Workflow draft editor", ar: "محرّر مسودة سير العمل" },
    states: [
      { id: "draft", n: "S01", label: "Draft — primary (payload editor + quarantined designer lane)" },
      { id: "validation", n: "S02", label: "Save rejected — parse error + bad reference (outlier)" },
      { id: "saved", n: "S03", label: "Draft saved (saveWorkflowDraft)" },
      { id: "own-draft", n: "S04", label: "Own draft — approve disabled (SoD)" },
      { id: "submitted", n: "S05", label: "Submitted — frozen for review" },
      { id: "published-locked", n: "S06", label: "Published v7 — read-only" },
      { id: "empty", n: "S07", label: "Empty — no draft open" },
      { id: "loading", n: "S08", label: "Loading" },
      { id: "unauthorized", n: "S09", label: "Unauthorized" },
      { id: "offline", n: "S10", label: "Offline" }
    ],
    outlier: "validation",
    render: render
  });
})();
