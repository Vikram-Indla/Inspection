/* CD-014 · SCR-ADM-060 — Risk configuration (reproducibility workspace).
   DEC-001 interim owner-revisable values are the ONLY source of drivers/weights/
   thresholds (stated-by-contract). The calculation trace renders the accepted
   formula line by line. Source freshness, external registries and any automated
   recompute are HANDOFF_BLOCKED_* unless located. No black-box score, no gauge. */
(function () {
  "use strict";
  var C = window.CDM, esc = C.esc;

  var L = {
    en: { group: "Risk Configuration", title: "Risk configuration — model v3 (DEC-001 interim)", sub: "Reproducibility workspace: version, drivers, weights, thresholds, sources and a line-by-line sample calculation on one screen",
      role: "Risk Owner", crumbs: ["Admin", "Risk Configuration", "Risk model"], searchPh: "Search factories to test…",
      drivers: "Drivers & weights", thresholds: "Risk bands (thresholds)", trace: "Why this factory? — calculation trace", sources: "Input sources",
      validate: "Validate model", publish: "Approve & publish", compare: "Compare v2 → v3", saveDraft: "Save draft",
      factory: "Sample factory", fName: "Al-Riyadh Polymers Co. — FAC-08841", band: "Band", score: "Score",
      d1: "Violation history (24m)", d2: "Complaint volume", d3: "Production category hazard", d4: "Time since last inspection", d5: "Self-assessment status",
      w: "Weight", input: "Input", contrib: "Contribution",
      bands: [["Low", "0–39", "var(--ax-color-success)"], ["Medium", "40–69", "var(--ax-color-warning)"], ["High", "70–100", "var(--ax-color-critical)"]],
      traceRows: [["violations_24m = 3", "0.30", "3 → norm 0.60", "18.0"], ["complaints_12m = 1", "0.15", "1 → norm 0.20", "3.0"], ["category = PLASTICS-B", "0.25", "hazard 0.70", "17.5"], ["days_since_insp = 412", "0.20", "412d → norm 0.90", "18.0"], ["self_assess = expired", "0.10", "expired → 1.00", "10.0"]],
      total: "Total score", denom: "Denominator: Σ weights = 1.00 · model v3 · DEC-001 interim values (owner-revisable)",
      missingT: "Missing source input", missingD: "complaints_12m has no value for FAC-02219 — the accepted rule scores the driver at 0 and flags the factory; it does NOT impute. The trace shows the gap explicitly.",
      staleT: "Stale input", staleD: "self_assess for FAC-08841 was last refreshed 2025-11-02. No freshness contract is located — staleness display is design intent (HANDOFF_BLOCKED_SOURCE_FRESHNESS); the value itself is proven payload.",
      edgeT: "Threshold-edge factory", edgeD: "Score 69.4 sits 0.6 below the High band. Banding is deterministic (≥70 = High); the edge marker prevents misreading proximity as High.",
      passT: "Model validation passed", passD: "All weights sum to 1.00; every driver has a source column; thresholds are contiguous and non-overlapping. Input-shape validation only — no scoring backtest store is located (HANDOFF_BLOCKED_BACKTEST).",
      failT: "Model validation failed", failD: "Σ weights = 0.90 (must equal 1.00); band boundary 40 appears in both Low and Medium. Fix before submitting.",
      draftT: "Draft v4 — not used by planning", draftD: "Draft edits never affect live targeting. Publishing follows the maker-checker grammar; planning consumes only the published version.",
      pubT: "Published v3 is immutable", pubD: "Change weights by proposing a draft v4. Version history preserves every published model for audit replay.",
      srcRows: [["violations_24m", "violations table (internal)", "proven"], ["complaints_12m", "complaints table (internal)", "proven"], ["category", "factories.category (internal)", "proven"], ["days_since_insp", "visits table (internal)", "proven"], ["self_assess", "submissions (internal)", "proven"]],
      blkTitle: "Blocked model inputs", blk: [["External registry sync", "no external provider contract located", "blocked", "HANDOFF_BLOCKED_EXTERNAL_REGISTRY"], ["Automated recompute schedule", "no scheduler located", "blocked", "HANDOFF_BLOCKED_RECOMPUTE"], ["Source freshness metadata", "no freshness contract located", "computed", "HANDOFF_BLOCKED_SOURCE_FRESHNESS"], ["Scoring backtest", "no backtest store located", "blocked", "HANDOFF_BLOCKED_BACKTEST"]],
      emptyT: "No risk model", emptyD: "Propose the first model draft from DEC-001 values.", loading: "Loading risk model…", kDrivers: "Drivers", kVer: "Model version", kBands: "Bands", kFactories: "Factories scored" },
    ar: { group: "إعداد المخاطر", title: "إعداد المخاطر — النموذج v3 (قيم DEC-001 المؤقتة)", sub: "مساحة قابلية إعادة الإنتاج: الإصدار والمحرّكات والأوزان والعتبات والمصادر وحساب عيّنة سطرًا بسطر في شاشة واحدة",
      role: "مالك المخاطر", crumbs: ["الإدارة", "إعداد المخاطر", "نموذج المخاطر"], searchPh: "ابحث عن منشأة للاختبار…",
      drivers: "المحرّكات والأوزان", thresholds: "نطاقات الخطورة (العتبات)", trace: "لماذا هذه المنشأة؟ — أثر الحساب", sources: "مصادر المدخلات",
      validate: "التحقق من النموذج", publish: "اعتماد ونشر", compare: "مقارنة v2 ← v3", saveDraft: "حفظ المسودة",
      factory: "منشأة العيّنة", fName: "شركة الرياض للبوليمرات — FAC-08841", band: "النطاق", score: "الدرجة",
      d1: "سجل المخالفات (٢٤ شهرًا)", d2: "حجم الشكاوى", d3: "خطورة فئة الإنتاج", d4: "الزمن منذ آخر تفتيش", d5: "حالة التقييم الذاتي",
      w: "الوزن", input: "المدخل", contrib: "المساهمة",
      bands: [["منخفض", "0–39", "var(--ax-color-success)"], ["متوسط", "40–69", "var(--ax-color-warning)"], ["مرتفع", "70–100", "var(--ax-color-critical)"]],
      traceRows: [["violations_24m = 3", "0.30", "3 ← معياري 0.60", "18.0"], ["complaints_12m = 1", "0.15", "1 ← معياري 0.20", "3.0"], ["category = PLASTICS-B", "0.25", "خطورة 0.70", "17.5"], ["days_since_insp = 412", "0.20", "412 يومًا ← معياري 0.90", "18.0"], ["self_assess = منتهٍ", "0.10", "منتهٍ ← 1.00", "10.0"]],
      total: "الدرجة الكلية", denom: "المقام: مجموع الأوزان = 1.00 · النموذج v3 · قيم DEC-001 مؤقتة (قابلة للمراجعة من المالك)",
      missingT: "مدخل مصدر مفقود", missingD: "complaints_12m بلا قيمة للمنشأة FAC-02219 — القاعدة المعتمدة تُقيّم المحرّك بصفر وتُعلّم المنشأة؛ ولا تُقدّر القيمة. يُظهر الأثر الفجوة صراحةً.",
      staleT: "مدخل قديم", staleD: "آخر تحديث لـ self_assess للمنشأة FAC-08841 في 2025-11-02. لا يوجد عقد نضارة مُثبت — عرض القِدَم نيّة تصميمية (HANDOFF_BLOCKED_SOURCE_FRESHNESS)؛ أما القيمة فمُثبتة من البيانات.",
      edgeT: "منشأة على حافة العتبة", edgeD: "الدرجة 69.4 أدنى من نطاق «مرتفع» بـ 0.6. التصنيف حتمي (≥70 = مرتفع)؛ مؤشر الحافة يمنع قراءة القرب على أنه «مرتفع».",
      passT: "نجح التحقق من النموذج", passD: "مجموع الأوزان 1.00؛ لكل محرّك عمود مصدر؛ العتبات متصلة وغير متداخلة. تحقق من شكل المدخلات فقط — لا يوجد مخزن اختبار رجعي مُثبت (HANDOFF_BLOCKED_BACKTEST).",
      failT: "فشل التحقق من النموذج", failD: "مجموع الأوزان 0.90 (يجب أن يساوي 1.00)؛ الحد 40 يظهر في «منخفض» و«متوسط» معًا. صحّح قبل التقديم.",
      draftT: "مسودة v4 — لا تُستخدم في التخطيط", draftD: "تعديلات المسودة لا تمس الاستهداف الحي. يتبع النشر قواعد الصانع/المدقّق؛ ويستهلك التخطيط الإصدار المنشور فقط.",
      pubT: "الإصدار المنشور v3 غير قابل للتغيير", pubD: "غيّر الأوزان باقتراح مسودة v4. يحفظ سجل الإصدارات كل نموذج منشور لإعادة التدقيق.",
      srcRows: [["violations_24m", "جدول المخالفات (داخلي)", "proven"], ["complaints_12m", "جدول الشكاوى (داخلي)", "proven"], ["category", "factories.category (داخلي)", "proven"], ["days_since_insp", "جدول الزيارات (داخلي)", "proven"], ["self_assess", "التقارير الذاتية (داخلي)", "proven"]],
      blkTitle: "مدخلات نموذج محجوبة", blk: [["مزامنة سجل خارجي", "لا عقد مزوّد خارجي مُثبت", "blocked", "HANDOFF_BLOCKED_EXTERNAL_REGISTRY"], ["جدولة إعادة الحساب", "لا مُجدوِل مُثبت", "blocked", "HANDOFF_BLOCKED_RECOMPUTE"], ["بيانات نضارة المصادر", "لا عقد نضارة مُثبت", "computed", "HANDOFF_BLOCKED_SOURCE_FRESHNESS"], ["اختبار رجعي للتقييم", "لا مخزن اختبار رجعي مُثبت", "blocked", "HANDOFF_BLOCKED_BACKTEST"]],
      emptyT: "لا يوجد نموذج مخاطر", emptyD: "اقترح مسودة النموذج الأولى من قيم DEC-001.", loading: "جارٍ تحميل نموذج المخاطر…", kDrivers: "محرّكات", kVer: "إصدار النموذج", kBands: "نطاقات", kFactories: "منشآت مُقيَّمة" }
  };

  function drivers(t, opts) {
    opts = opts || {};
    var rows = [[t.d1, "0.30", 60], [t.d2, "0.15", 20, opts.missing ? "missing" : null], [t.d3, "0.25", 70], [t.d4, "0.20", 90], [t.d5, "0.10", 100, opts.stale ? "stale" : null]];
    return '<div class="m-panel"><div class="m-panel__head"><h4>' + esc(t.drivers) + '</h4>' + C.tt("proven", "DEC-001 interim · owner-revisable") + '</div>' +
      rows.map(function (r) {
        var mod = r[3] === "stale" ? " rk-bar--stale" : r[3] === "missing" ? " rk-bar--missing" : "";
        return '<div class="rk-driver"><div class="rk-driver__name"><b>' + esc(r[0]) + '</b>' +
          (r[3] === "missing" ? '<span class="wf-ph">' + esc(t.missingT) + '</span>' : r[3] === "stale" ? '<span class="lz-risk">◷ 2025-11-02</span>' : '') +
          '</div><span class="rk-w m-num">' + r[1] + '</span><div class="rk-bar' + mod + '"><span style="inline-size:' + r[2] + '%"></span></div></div>';
      }).join("") + '</div>';
  }

  function bands(t, edge) {
    return '<div class="m-panel"><div class="m-panel__head"><h4>' + esc(t.thresholds) + '</h4>' + C.tt("proven", "DEC-001 interim") + '</div>' +
      '<div class="rk-band">' + t.bands.map(function (b, i) {
        var w = [40, 30, 30][i];
        return '<span style="inline-size:' + w + '%;background:' + b[2] + '">' + esc(b[0]) + ' ' + b[1] + '</span>';
      }).join("") + '</div>' +
      (edge ? '<p class="cd-sub"><b>69.4</b> — ' + esc(t.edgeD) + '</p>' : '') + '</div>';
  }

  function trace(t, opts) {
    opts = opts || {};
    var score = opts.edge ? "69.4" : "66.5";
    var bandIx = 1;
    return '<div class="m-panel"><div class="m-panel__head"><h4>' + esc(t.trace) + '</h4>' + C.tt("proven", "formula · line by line") + '</div>' +
      '<div style="display:flex;align-items:baseline;gap:16px;flex-wrap:wrap"><span class="rk-score m-num">' + score + '</span>' +
      C.loz("warning", t.bands[bandIx][0] + " " + t.bands[bandIx][1]) + '<span class="cd-sub">' + esc(t.fName) + '</span></div>' +
      '<div style="overflow-x:auto"><table class="ax-table rk-trace"><thead><tr><th>' + esc(t.input) + '</th><th>' + esc(t.w) + '</th><th>norm</th><th class="wf-actcell">' + esc(t.contrib) + '</th></tr></thead><tbody>' +
      t.traceRows.map(function (r, i) {
        var missing = opts.missing && i === 1;
        return '<tr' + (missing ? ' style="background:var(--ax-color-critical-tint)"' : '') + '><td>' + (missing ? '<span class="wf-ph">complaints_12m = ∅</span>' : esc(r[0])) + '</td><td class="m-num">' + r[1] + '</td><td class="m-mono">' + (missing ? "∅ → 0.00" : esc(r[2])) + '</td><td class="m-num wf-actcell">' + (missing ? "0.0" : r[3]) + '</td></tr>';
      }).join("") +
      '<tr><td colspan="3" style="font:var(--ax-text-body-strong)">' + esc(t.total) + '</td><td class="m-num wf-actcell" style="font:var(--ax-text-body-strong)">' + (opts.missing ? "63.5" : score) + '</td></tr>' +
      '</tbody></table></div><p class="cd-sub">' + esc(t.denom) + '</p></div>';
  }

  function sources(t) {
    return '<div class="m-panel"><div class="m-panel__head"><h4>' + esc(t.sources) + '</h4></div><dl class="m-kv">' +
      t.srcRows.map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + esc(r[1]) + ' ' + C.tt(r[2], r[2] === "proven" ? "payload" : r[2]) + '</dd>'; }).join("") + '</dl></div>';
  }

  function bar(t, opts) {
    opts = opts || {};
    return '<div class="ax-commandbar"><button class="ax-btn ax-btn--secondary">' + esc(t.saveDraft) + '</button>' +
      '<button class="ax-btn ax-btn--secondary">' + esc(t.validate) + '</button>' +
      '<button class="ax-btn ax-btn--secondary">' + esc(t.compare) + '</button>' +
      '<button class="ax-btn"' + (opts.noPub ? ' disabled aria-disabled="true"' : '') + '>' + esc(t.publish) + '</button>' +
      '<span class="ax-commandbar__spacer"></span>' + C.tt("proven", "maker-checker grammar") + '</div>';
  }

  function kpis(t) {
    return C.kpis([{ v: 5, l: t.kDrivers, tier: "proven" }, { v: "v3", l: t.kVer, tier: "proven" }, { v: 3, l: t.kBands, tier: "proven" }, { v: "1,284", l: t.kFactories, tier: "proven" }]);
  }

  function frame(lang, t, main) {
    return C.frame(lang,
      C.nav(lang, t.group, [["◮", t.crumbs[2], true]]),
      C.pagehead(lang, { title: t.title, sub: t.sub, role: t.role, crumbs: t.crumbs, searchPh: t.searchPh }),
      main);
  }

  function grid(t, opts) {
    return '<div class="m-split"><div style="display:flex;flex-direction:column;gap:16px">' + trace(t, opts) + sources(t) + '</div>' +
      '<div style="display:flex;flex-direction:column;gap:16px">' + drivers(t, opts) + bands(t, opts && opts.edge) + C.blocked(t.blkTitle, t.blk) + '</div></div>';
  }

  function render(state, lang) {
    var t = L[lang];
    var body;
    if (state === "empty") body = C.content(C.stateEmpty(lang, "◮", t.emptyT, t.emptyD, t.validate));
    else if (state === "loading") body = C.content(C.skeleton(lang, t.loading));
    else if (state === "unauthorized") body = C.content(C.stateUnauth(lang));
    else if (state === "offline") body = C.content(C.stateOffline(lang, "◮"));
    else if (state === "missing-source") body = C.content(bar(t, { noPub: true }) + C.legend(lang) + C.guard(t.missingT, t.missingD) + grid(t, { missing: true }));
    else if (state === "stale") body = C.content(bar(t, {}) + C.legend(lang) + C.banner("warning", "◷", t.staleT, t.staleD) + grid(t, { stale: true }));
    else if (state === "threshold-edge") body = C.content(bar(t, {}) + C.legend(lang) + C.banner("warning", "‖", t.edgeT, t.edgeD) + grid(t, { edge: true }));
    else if (state === "test-pass") body = C.content(bar(t, {}) + '<div class="ax-banner"><span>✓</span><div><strong>' + esc(t.passT) + '</strong><div class="cd-sub">' + esc(t.passD) + '</div></div></div>' + C.legend(lang) + grid(t, {}));
    else if (state === "test-fail") body = C.content(bar(t, { noPub: true }) + C.guard(t.failT, t.failD) + C.legend(lang) + grid(t, {}));
    else if (state === "draft") body = C.content(bar(t, {}) + C.banner("warning", "▣", t.draftT, t.draftD) + C.legend(lang) + grid(t, {}));
    else if (state === "published") body = C.content(bar(t, { noPub: true }) + C.banner("immutable", "◆", t.pubT, t.pubD) + C.legend(lang) + kpis(t) + grid(t, {}));
    else /* complete — primary */ body = C.content(bar(t, {}) + C.legend(lang) + kpis(t) + grid(t, {}));
    return frame(lang, t, body);
  }

  C.register("cd14", {
    id: "CD-014", screen: "SCR-ADM-060", title: { en: "Risk configuration", ar: "إعداد المخاطر" },
    states: [
      { id: "complete", n: "S01", label: "Complete — primary (trace + drivers + bands)" },
      { id: "missing-source", n: "S02", label: "Missing source input (outlier)" },
      { id: "stale", n: "S03", label: "Stale input (freshness blocked)" },
      { id: "threshold-edge", n: "S04", label: "Threshold-edge factory" },
      { id: "test-pass", n: "S05", label: "Model validation passed" },
      { id: "test-fail", n: "S06", label: "Model validation failed" },
      { id: "draft", n: "S07", label: "Draft v4 — not live" },
      { id: "published", n: "S08", label: "Published v3 — immutable" },
      { id: "empty", n: "S09", label: "Empty — no model" },
      { id: "loading", n: "S10", label: "Loading" },
      { id: "unauthorized", n: "S11", label: "Unauthorized" },
      { id: "offline", n: "S12", label: "Offline" }
    ],
    outlier: "missing-source",
    render: render
  });
})();
