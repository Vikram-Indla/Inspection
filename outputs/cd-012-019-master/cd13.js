/* CD-013 · SCR-ADM-051 — Workflow designer (state-machine studio).
   Same route + config_versions maker-checker spine as CD-012. Canvas/inspector
   render the draft payload (stated-by-contract). Scenario simulation, guard/
   side-effect testing and graph analysis are DESIGN INTENT — HANDOFF_BLOCKED_*
   until located in source; simulated frames are visibly tagged as intent. */
(function () {
  "use strict";
  var C = window.CDM, esc = C.esc;

  var L = {
    en: { group: "Workflow Configuration", nav: [["⚙", "Workflow library"], ["▦", "Rules"], ["◈", "Packages"]],
      title: "Workflow designer — INSPECTION_VISIT_LIFECYCLE v8", sub: "State-machine studio: model canvas, transition inspector and scenario replay share one truth — the draft config_versions payload",
      role: "Workflow Admin (maker)", crumbs: ["Admin", "Workflow Configuration", "Workflow designer"],
      modeLib: "Library", modeDesigner: "Designer", searchPh: "Search states and transitions…",
      canvas: "State canvas", inspector: "Transition inspector", sim: "Scenario replay", simTag: "design intent",
      states: "States", transitions: "Transitions", saveDraft: "Save draft (saveWorkflowDraft)", submit: "Submit for approval", approve: "Approve & publish (approvePublishWorkflow)",
      from: "From", to: "To", actor: "Actor role", guard: "Guard", required: "Required fields", side: "Side effects", sla: "SLA timer",
      guardVal: "assignment.active = true", sideVal: "notify: NOT LOCATED — blocked", slaVal: "72h (calendar: NOT LOCATED)",
      invalidEdge: "Invalid transition", invalidEdgeD: "“Submitted → Closed” skips review — the accepted state machine has no such edge. saveWorkflowDraft will reject this definition.",
      unreach: "Unreachable state", unreachD: "“Supervisor review” has no incoming transition — no case can arrive there. Fix before submitting.",
      unreachTag: "COMPUTED — needs graph analysis (HANDOFF_BLOCKED_GRAPH_ANALYSIS)",
      simSteps: [["Case VIS-2026-04182 enters Draft", "ok"], ["submitVisit → Submitted (actor: Inspector)", "ok"], ["review → Under review (actor: Reviewer L1)", "ok"], ["approve blocked — guard assignment.active=false", "fail"]],
      simPassSteps: [["Case VIS-2026-04182 enters Draft", "ok"], ["submitVisit → Submitted (actor: Inspector)", "ok"], ["review → Under review (actor: Reviewer L1)", "ok"], ["approve → Approved (actor: Reviewer L2)", "ok"], ["close → Closed (terminal)", "ok"]],
      simBlocked: "Replay is a design-intent preview over the draft payload. No simulation engine, test store or case fixture source is located — HANDOFF_BLOCKED_SIMULATION. Nothing here is runtime evidence.",
      lockedT: "Published v7 is locked", lockedD: "You are viewing the published version read-only. Editing requires proposing a new draft (proposeWorkflowDraft).",
      submittedT: "v8 submitted — immutable while awaiting approval", submittedD: "The draft is frozen for checker review. It can be approved & published or returned; it cannot be edited.",
      approvedT: "Approved — pending publish effect", approvedD: "approvePublishWorkflow moves draft → published in one governed action; there is no separate approved-but-unpublished store located. Shown as the moment of transition.",
      emptyT: "No draft open", emptyD: "Open a workflow from the library or propose a new draft to start designing.", emptyCta: "Propose draft",
      loading: "Loading draft definition…",
      valT: "Cannot save draft", valD: "saveWorkflowDraft input validation:", valItems: ["Transition “approve” needs an actor role.", "State “Under review” label missing Arabic.", "Guard expression is not parseable."],
      nodes: { draft: "Draft", submitted: "Submitted", review: "Under review", approved: "Approved", closed: "Closed", returned: "Returned to inspector", sup: "Supervisor review" } },
    ar: { group: "إعداد سير العمل", nav: [["⚙", "مكتبة سير العمل"], ["▦", "القواعد"], ["◈", "الحزم"]],
      title: "مُصمّم سير العمل — INSPECTION_VISIT_LIFECYCLE v8", sub: "استوديو آلة الحالات: اللوحة ومُفتّش الانتقالات وإعادة تشغيل السيناريو تتشارك حقيقة واحدة — حمولة مسودة config_versions",
      role: "مشرف سير العمل (صانع)", crumbs: ["الإدارة", "إعداد سير العمل", "مُصمّم سير العمل"],
      modeLib: "المكتبة", modeDesigner: "المُصمّم", searchPh: "ابحث في الحالات والانتقالات…",
      canvas: "لوحة الحالات", inspector: "مُفتّش الانتقال", sim: "إعادة تشغيل السيناريو", simTag: "نيّة تصميمية",
      states: "حالة", transitions: "انتقال", saveDraft: "حفظ المسودة (saveWorkflowDraft)", submit: "تقديم للاعتماد", approve: "اعتماد ونشر (approvePublishWorkflow)",
      from: "من", to: "إلى", actor: "دور المُنفّذ", guard: "الشرط الحارس", required: "الحقول المطلوبة", side: "الآثار الجانبية", sla: "مؤقّت الاتفاقية",
      guardVal: "assignment.active = true", sideVal: "إشعار: غير مُثبت — محجوب", slaVal: "٧٢ ساعة (التقويم: غير مُثبت)",
      invalidEdge: "انتقال غير صالح", invalidEdgeD: "«مُقدَّم ← مُغلق» يتجاوز المراجعة — لا يوجد هذا الانتقال في آلة الحالات المعتمدة. سيرفض saveWorkflowDraft هذا التعريف.",
      unreach: "حالة غير قابلة للوصول", unreachD: "«مراجعة المشرف» بلا انتقال وارد — لن تصل أي حالة إليها. صحّح قبل التقديم.",
      unreachTag: "محسوب — يلزمه تحليل الرسم (HANDOFF_BLOCKED_GRAPH_ANALYSIS)",
      simSteps: [["الحالة VIS-2026-04182 تدخل «مسودة»", "ok"], ["submitVisit ← «مُقدَّم» (المُنفّذ: مفتّش)", "ok"], ["review ← «قيد المراجعة» (المُنفّذ: مراجع م١)", "ok"], ["approve محجوب — الشرط assignment.active=false", "fail"]],
      simPassSteps: [["الحالة VIS-2026-04182 تدخل «مسودة»", "ok"], ["submitVisit ← «مُقدَّم»", "ok"], ["review ← «قيد المراجعة»", "ok"], ["approve ← «معتمد» (مراجع م٢)", "ok"], ["close ← «مُغلق» (نهائية)", "ok"]],
      simBlocked: "إعادة التشغيل معاينة نيّة تصميمية فوق حمولة المسودة. لا يوجد محرّك محاكاة أو مخزن اختبارات أو مصدر حالات مُثبت — HANDOFF_BLOCKED_SIMULATION. لا شيء هنا دليل تشغيل.",
      lockedT: "الإصدار المنشور v7 مقفول", lockedD: "أنت تعرض الإصدار المنشور للقراءة فقط. التعديل يتطلب اقتراح مسودة جديدة (proposeWorkflowDraft).",
      submittedT: "v8 مُقدَّم — غير قابل للتغيير أثناء انتظار الاعتماد", submittedD: "المسودة مجمّدة لمراجعة المدقّق. تُعتمد وتُنشر أو تُعاد؛ ولا تُعدَّل.",
      approvedT: "معتمد — بانتظار أثر النشر", approvedD: "approvePublishWorkflow ينقل المسودة إلى منشور في إجراء محكوم واحد؛ لا يوجد مخزن «معتمد غير منشور» مُثبت. يُعرض كلحظة الانتقال.",
      emptyT: "لا مسودة مفتوحة", emptyD: "افتح سير عمل من المكتبة أو اقترح مسودة جديدة لبدء التصميم.", emptyCta: "اقتراح مسودة",
      loading: "جارٍ تحميل تعريف المسودة…",
      valT: "لا يمكن حفظ المسودة", valD: "تحقق مدخلات saveWorkflowDraft:", valItems: ["انتقال «approve» يحتاج دور مُنفّذ.", "تسمية «قيد المراجعة» تنقصها العربية.", "تعبير الشرط الحارس غير قابل للتحليل."],
      nodes: { draft: "مسودة", submitted: "مُقدَّم", review: "قيد المراجعة", approved: "معتمد", closed: "مُغلق", returned: "مُعاد إلى المفتّش", sup: "مراجعة المشرف" } }
  };

  function canvas(t, opts) {
    opts = opts || {};
    var N = t.nodes;
    function node(x, y, label, key, mods) {
      return '<div class="dz-node' + (mods || "") + '" style="inset-inline-start:' + x + 'px;inset-block-start:' + y + 'px"><b>' + esc(label) + '</b><small>' + key + '</small></div>';
    }
    var edges =
      '<svg class="dz-edges" width="100%" height="100%"><defs><marker id="dzArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="var(--ax-color-border-strong)"/></marker></defs>' +
      '<path class="dz-edge' + (opts.replay ? " dz-edge--replay" : "") + '" d="M150 60 C 200 60 210 60 250 60"/>' +
      '<path class="dz-edge' + (opts.replay ? " dz-edge--replay" : "") + '" d="M380 60 C 430 60 440 60 480 60"/>' +
      '<path class="dz-edge" d="M600 60 C 650 60 660 60 700 60"/>' +
      '<path class="dz-edge" d="M820 60 C 870 60 880 60 920 60"/>' +
      '<path class="dz-edge" d="M540 90 C 480 170 350 190 260 120"/>' +
      (opts.invalidEdge ? '<path class="dz-edge dz-edge--invalid" d="M320 90 C 500 230 800 200 950 95"/>' : '') +
      '</svg>';
    return '<div class="dz-canvas">' + edges +
      node(30, 36, N.draft, "initial", " dz-node--initial" + (opts.replay ? " dz-node--selected" : "")) +
      node(252, 36, N.submitted, "state", opts.invalidEdge ? " dz-node--invalid" : "") +
      node(482, 36, N.review, "state", opts.selected ? " dz-node--selected" : "") +
      node(702, 36, N.approved, "state") +
      node(922, 36, N.closed, "terminal", " dz-node--terminal") +
      node(180, 190, N.returned, "loop") +
      (opts.unreach ? node(650, 190, N.sup, "no inbound", " dz-node--invalid") : '') +
      (opts.unreach ? '<span class="dz-badge" style="inset-inline-start:650px;inset-block-start:250px;color:var(--ax-color-critical-strong)">' + esc(t.unreach) + '</span>' : '') +
      '<span class="dz-badge" style="inset-inline-start:14px;inset-block-end:12px;inset-block-start:auto">7 ' + esc(t.states) + ' · 8 ' + esc(t.transitions) + ' · ' + C.tt("proven", "config_versions draft") + '</span>' +
      '</div>';
  }

  function inspector(t, lang) {
    return '<div class="m-panel"><div class="m-panel__head"><h4>' + esc(t.inspector) + '</h4>' + C.tt("proven", "draft payload") + '</div>' +
      '<dl class="m-kv">' +
      '<dt>' + esc(t.from) + '</dt><dd>' + esc(t.nodes.review) + '</dd>' +
      '<dt>' + esc(t.to) + '</dt><dd>' + esc(t.nodes.approved) + '</dd>' +
      '<dt>' + esc(t.actor) + '</dt><dd>Reviewer L2</dd>' +
      '<dt>' + esc(t.guard) + '</dt><dd class="m-mono">' + esc(t.guardVal) + '</dd>' +
      '<dt>' + esc(t.required) + '</dt><dd class="m-mono">findings[], evidence_refs[]</dd>' +
      '<dt>' + esc(t.side) + '</dt><dd><span class="wf-ph">' + esc(t.sideVal) + '</span> ' + C.tt("blocked", "HANDOFF_BLOCKED_PUBLISH_NOTIFICATION") + '</dd>' +
      '<dt>' + esc(t.sla) + '</dt><dd><span class="wf-ph">' + esc(t.slaVal) + '</span> ' + C.tt("blocked", "HANDOFF_BLOCKED_SLA_CALENDAR") + '</dd>' +
      '</dl></div>';
  }

  function simulator(t, steps, verdictFail) {
    return '<div class="m-panel"><div class="m-panel__head"><h4>' + esc(t.sim) + '</h4>' + C.tt("computed", t.simTag + " — HANDOFF_BLOCKED_SIMULATION") + '</div>' +
      (steps ? steps.map(function (s, i) {
        return '<div class="dz-step' + (s[1] === "fail" ? " dz-step--fail" : "") + '"><span class="dz-step__n">' + (i + 1) + '</span><span>' + esc(s[0]) + '</span></div>';
      }).join("") : '') +
      '<p class="cd-sub" style="line-height:1.5">' + esc(t.simBlocked) + '</p></div>';
  }

  function actionsBar(t, opts) {
    opts = opts || {};
    return '<div class="ax-commandbar">' +
      '<button class="ax-btn ax-btn--secondary"' + (opts.noSave ? ' disabled aria-disabled="true"' : '') + '>' + esc(t.saveDraft) + '</button>' +
      '<button class="ax-btn ax-btn--secondary"' + (opts.noSubmit ? ' disabled aria-disabled="true"' : '') + '>' + esc(t.submit) + '</button>' +
      '<button class="ax-btn"' + (opts.noApprove ? ' disabled aria-disabled="true"' : '') + '>' + esc(t.approve) + '</button>' +
      '<span class="ax-commandbar__spacer"></span>' + C.tt("proven", "actions: propose/save/approvePublish") + '</div>';
  }

  function frame(lang, t, main) {
    return C.frame(lang,
      C.nav(lang, t.group, [[t.nav[0][0], t.nav[0][1], false], ["✎", t.title.split(" — ")[0], true], t.nav[1], t.nav[2]]),
      C.pagehead(lang, { title: t.title, sub: t.sub, role: t.role, crumbs: t.crumbs, searchPh: t.searchPh, mode: [[t.modeLib, false], [t.modeDesigner, true]] }),
      main);
  }

  function render(state, lang) {
    var t = L[lang], c = C.COM[lang];
    var body;
    if (state === "empty") body = C.content(C.stateEmpty(lang, "✎", t.emptyT, t.emptyD, t.emptyCta));
    else if (state === "loading") body = C.content(C.skeleton(lang, t.loading));
    else if (state === "unauthorized") body = C.content(C.stateUnauth(lang));
    else if (state === "offline") body = C.content(C.stateOffline(lang, "✎"));
    else if (state === "invalid-edge") body = C.content(actionsBar(t, { noSubmit: true, noApprove: true }) + C.legend(lang) +
      C.guard(t.invalidEdge, t.invalidEdgeD) +
      '<div class="m-split"><div>' + canvas(t, { invalidEdge: true }) + '</div><div style="display:flex;flex-direction:column;gap:16px">' + inspector(t, lang) + simulator(t, null) + '</div></div>');
    else if (state === "unreachable") body = C.content(actionsBar(t, { noSubmit: true, noApprove: true }) + C.legend(lang) +
      '<div class="ax-banner ax-banner--warning"><span>◇</span><div><strong>' + esc(t.unreach) + '</strong><div class="cd-sub">' + esc(t.unreachD) + ' · ' + esc(t.unreachTag) + '</div></div></div>' +
      '<div class="m-split"><div>' + canvas(t, { unreach: true }) + '</div><div style="display:flex;flex-direction:column;gap:16px">' + inspector(t, lang) + simulator(t, null) + '</div></div>');
    else if (state === "sim-fail") body = C.content(actionsBar(t, { noApprove: true }) + C.legend(lang) +
      '<div class="m-split"><div>' + canvas(t, { replay: true, selected: true }) + '</div><div style="display:flex;flex-direction:column;gap:16px">' + simulator(t, t.simSteps, true) + inspector(t, lang) + '</div></div>');
    else if (state === "sim-pass") body = C.content(actionsBar(t, {}) + C.legend(lang) +
      '<div class="m-split"><div>' + canvas(t, { replay: true }) + '</div><div style="display:flex;flex-direction:column;gap:16px">' + simulator(t, t.simPassSteps) + inspector(t, lang) + '</div></div>');
    else if (state === "validation") body = C.content(actionsBar(t, { noSubmit: true, noApprove: true }) +
      '<div class="ax-validation"><strong style="font:var(--ax-text-body-strong)">' + esc(t.valT) + '</strong><div class="cd-sub" style="margin-block:4px">' + esc(t.valD) + '</div><ul>' + t.valItems.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join("") + '</ul></div>' +
      C.legend(lang) + '<div class="m-split"><div>' + canvas(t, {}) + '</div>' + inspector(t, lang) + '</div>');
    else if (state === "submitted") body = C.content(C.banner("immutable", "▣", t.submittedT, t.submittedD) + C.legend(lang) +
      actionsBar(t, { noSave: true, noSubmit: true }) + '<div class="m-split"><div>' + canvas(t, {}) + '</div>' + inspector(t, lang) + '</div>');
    else if (state === "approved") body = C.content(C.banner("immutable", "◆", t.approvedT, t.approvedD) + C.legend(lang) +
      '<div class="m-split"><div>' + canvas(t, {}) + '</div>' + inspector(t, lang) + '</div>');
    else if (state === "published-locked") body = C.content(C.banner("immutable", "◆", t.lockedT, t.lockedD) + C.legend(lang) +
      actionsBar(t, { noSave: true, noSubmit: true, noApprove: true }) + '<div class="m-split"><div>' + canvas(t, {}) + '</div>' + inspector(t, lang) + '</div>');
    else /* draft — primary */ body = C.content(actionsBar(t, {}) + C.legend(lang) +
      '<div class="m-split"><div>' + canvas(t, { selected: true }) + '</div><div style="display:flex;flex-direction:column;gap:16px">' + inspector(t, lang) + simulator(t, null) + '</div></div>');
    return frame(lang, t, body);
  }

  C.register("cd13", {
    id: "CD-013", screen: "SCR-ADM-051", title: { en: "Workflow designer", ar: "مُصمّم سير العمل" },
    states: [
      { id: "draft", n: "S01", label: "Draft — primary (canvas + inspector + replay)" },
      { id: "invalid-edge", n: "S02", label: "Invalid edge — save rejected (outlier)" },
      { id: "unreachable", n: "S03", label: "Unreachable state (computed/blocked)" },
      { id: "sim-fail", n: "S04", label: "Scenario replay — guard fails (intent)" },
      { id: "sim-pass", n: "S05", label: "Scenario replay — passed (intent)" },
      { id: "validation", n: "S06", label: "Validation — cannot save draft" },
      { id: "submitted", n: "S07", label: "Submitted — immutable" },
      { id: "approved", n: "S08", label: "Approved — publish moment" },
      { id: "published-locked", n: "S09", label: "Published v7 — locked read-only" },
      { id: "empty", n: "S10", label: "Empty — no draft open" },
      { id: "loading", n: "S11", label: "Loading" },
      { id: "unauthorized", n: "S12", label: "Unauthorized" },
      { id: "offline", n: "S13", label: "Offline" }
    ],
    outlier: "invalid-edge",
    render: render
  });
})();
