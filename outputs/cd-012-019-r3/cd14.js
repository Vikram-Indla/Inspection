/* CD-014 R2 · SCR-ADM-060 — Risk configuration.
   PRESENT TRUTH: the Risk Studio reads `engine_settings` and directly saves
   factors/bands after a weights-sum validation. There is NO draft/submitted/
   published maker-checker lifecycle here — the invented approval flow is
   removed. Reproducibility = stored drivers/factors/bands + timestamp +
   version label + RLS. "Why this factory?" shows arithmetic over shown inputs
   or explicitly says what is not available. No freshness/registry/scheduler/
   backtest invention. */
(function () {
  "use strict";
  var C = window.CDM, esc = C.esc;

  var L = {
    en: { group: "Risk Configuration", title: "Risk configuration", sub: "The stored risk model, reproducible line by line: factors, weights, bands, last-saved provenance — and a worked sample calculation",
      role: "Risk Owner", crumbs: ["Admin", "Risk Configuration", "Risk model"], searchPh: "Search factories to test…",
      drivers: "Factors & weights", thresholds: "Risk bands", trace: "Why this factory?", sources: "Stored model record",
      save: "Save model", saveNote: "Saving writes factors/bands to engine_settings after the weights-sum check. The change is effective immediately for new score calculations — there is no draft or approval step on this screen today.",
      lastSaved: "Last saved", verLabel: "Version label", savedBy: "Saved by", storage: "Storage",
      d: [["Violation history (24m)", "0.30"], ["Complaint volume (12m)", "0.15"], ["Production category hazard", "0.25"], ["Time since last inspection", "0.20"], ["Self-assessment status", "0.10"]],
      w: "Weight", input: "Input", contrib: "Contribution", total: "Total score",
      bands: [["Low", "0–39", "var(--legacy-color-success)"], ["Medium", "40–69", "var(--legacy-color-warning)"], ["High", "70–100", "var(--legacy-color-critical)"]],
      traceRows: [["violations_24m = 3", "0.30", "norm 0.60", "18.0"], ["complaints_12m = 1", "0.15", "norm 0.20", "3.0"], ["category = PLASTICS-B", "0.25", "hazard 0.70", "17.5"], ["days_since_insp = 412", "0.20", "norm 0.90", "18.0"], ["self_assess = expired", "0.10", "1.00", "10.0"]],
      denom: "Σ weights = 1.00 · arithmetic shown in full; inputs come from the factory record used for scoring",
      fName: "Al-Riyadh Polymers Co. — FAC-08841",
      sumFailT: "Cannot save — weights must sum to 1.00", sumFailD: "Current sum is 0.90. This is the real validation the save action performs; fix the weights and save again.",
      missingT: "This factory cannot be fully scored", missingD: "complaints_12m has no value for FAC-02219. The trace shows the gap and scores the factor at 0 — the number is not imputed, and the shortfall is visible in the total.",
      edgeT: "Close to the High band", edgeD: "Score 69.4 is 0.6 below High (≥70). Banding is deterministic; this note prevents reading proximity as High.",
      savedT: "Model saved", savedD: "engine_settings updated. New calculations use these factors immediately.",
      rlsT: "Save rejected by row-level security", rlsD: "Your session does not hold the Risk Owner role required to write engine_settings. Nothing was changed.",
      histNote: "Version label and timestamp are the stored provenance available today.",
      nyaT: "Model change approval", nyaD: "Saving is immediate today. A draft/review step before a live model change would need a governed backend change — it is proposed, not present.",
      nyaSeam: "NEEDS_APPROVED_CONTRACT — risk model approval workflow",
      emptyT: "No risk model stored", emptyD: "engine_settings has no risk model record for this environment.", loading: "Loading risk model…" },
    ar: { group: "إعداد المخاطر", title: "إعداد المخاطر", sub: "نموذج المخاطر المخزَّن، قابل لإعادة الإنتاج سطرًا بسطر: العوامل والأوزان والنطاقات وإثبات آخر حفظ — مع حساب عيّنة كامل",
      role: "مالك المخاطر", crumbs: ["الإدارة", "إعداد المخاطر", "نموذج المخاطر"], searchPh: "ابحث عن منشأة للاختبار…",
      drivers: "العوامل والأوزان", thresholds: "نطاقات الخطورة", trace: "لماذا هذه المنشأة؟", sources: "سجل النموذج المخزَّن",
      save: "حفظ النموذج", saveNote: "الحفظ يكتب العوامل والنطاقات في engine_settings بعد فحص مجموع الأوزان. يسري التغيير فورًا على الحسابات الجديدة — لا توجد خطوة مسودة أو اعتماد في هذه الشاشة اليوم.",
      lastSaved: "آخر حفظ", verLabel: "وسم الإصدار", savedBy: "حفظه", storage: "التخزين",
      d: [["سجل المخالفات (٢٤ شهرًا)", "0.30"], ["حجم الشكاوى (١٢ شهرًا)", "0.15"], ["خطورة فئة الإنتاج", "0.25"], ["الزمن منذ آخر تفتيش", "0.20"], ["حالة التقييم الذاتي", "0.10"]],
      w: "الوزن", input: "المدخل", contrib: "المساهمة", total: "الدرجة الكلية",
      bands: [["منخفض", "0–39", "var(--legacy-color-success)"], ["متوسط", "40–69", "var(--legacy-color-warning)"], ["مرتفع", "70–100", "var(--legacy-color-critical)"]],
      traceRows: [["violations_24m = 3", "0.30", "معياري 0.60", "18.0"], ["complaints_12m = 1", "0.15", "معياري 0.20", "3.0"], ["category = PLASTICS-B", "0.25", "خطورة 0.70", "17.5"], ["days_since_insp = 412", "0.20", "معياري 0.90", "18.0"], ["self_assess = منتهٍ", "0.10", "1.00", "10.0"]],
      denom: "مجموع الأوزان = 1.00 · الحساب معروض كاملًا؛ والمدخلات من سجل المنشأة المستخدم في التقييم",
      fName: "شركة الرياض للبوليمرات — FAC-08841",
      sumFailT: "لا يمكن الحفظ — يجب أن يساوي مجموع الأوزان 1.00", sumFailD: "المجموع الحالي 0.90. هذا هو التحقق الفعلي الذي يجريه إجراء الحفظ؛ صحّح الأوزان واحفظ مجددًا.",
      missingT: "لا يمكن تقييم هذه المنشأة بالكامل", missingD: "complaints_12m بلا قيمة للمنشأة FAC-02219. يُظهر الأثر الفجوة ويُقيّم العامل بصفر — لا تُقدَّر القيمة، ويظهر النقص في المجموع.",
      edgeT: "قريب من نطاق «مرتفع»", edgeD: "الدرجة 69.4 أدنى من «مرتفع» (≥70) بـ 0.6. التصنيف حتمي؛ وهذه الملاحظة تمنع قراءة القرب على أنه «مرتفع».",
      savedT: "حُفظ النموذج", savedD: "حُدّث engine_settings. تستخدم الحسابات الجديدة هذه العوامل فورًا.",
      rlsT: "رُفض الحفظ بواسطة أمان مستوى الصفوف", rlsD: "جلستك لا تحمل دور مالك المخاطر المطلوب للكتابة في engine_settings. لم يتغيّر شيء.",
      histNote: "وسم الإصدار والطابع الزمني هما الإثبات المخزَّن المتاح اليوم.",
      nyaT: "اعتماد تغييرات النموذج", nyaD: "الحفظ فوري اليوم. خطوة مسودة/مراجعة قبل تغيير نموذج حي تتطلب تغييرًا خلفيًا محكومًا — إنها مقترحة لا قائمة.",
      nyaSeam: "NEEDS_APPROVED_CONTRACT — سير اعتماد نموذج المخاطر",
      emptyT: "لا نموذج مخاطر مخزَّن", emptyD: "لا يحتوي engine_settings على سجل نموذج مخاطر لهذه البيئة.", loading: "جارٍ تحميل نموذج المخاطر…" }
  };

  function drivers(t, opts) {
    opts = opts || {};
    var widths = [60, 20, 70, 90, 100];
    return '<div class="m-panel"><div class="m-panel__head"><h4>' + esc(t.drivers) + '</h4>' + C.tt("proven", "engine_settings") + '</div>' +
      t.d.map(function (r, i) {
        var w = (opts.sumFail && i === 1) ? "0.05" : r[1];
        return '<div class="rk-driver"><div class="rk-driver__name"><b>' + esc(r[0]) + '</b></div><span class="rk-w m-num"' + (opts.sumFail && i === 1 ? ' style="color:var(--legacy-color-critical-strong)"' : '') + '>' + w + '</span><div class="rk-bar"><span style="inline-size:' + widths[i] + '%"></span></div></div>';
      }).join("") +
      '<p class="cd-sub">' + esc(t.saveNote) + '</p></div>';
  }

  function bands(t, edge) {
    return '<div class="m-panel"><div class="m-panel__head"><h4>' + esc(t.thresholds) + '</h4>' + C.tt("proven", "engine_settings") + '</div>' +
      '<div class="rk-band">' + t.bands.map(function (b, i) { return '<span style="inline-size:' + [40, 30, 30][i] + '%;background:' + b[2] + '">' + esc(b[0]) + ' ' + b[1] + '</span>'; }).join("") + '</div>' +
      (edge ? '<p class="cd-sub"><b>69.4</b> — ' + esc(t.edgeD) + '</p>' : '') + '</div>';
  }

  function record(t) {
    return '<div class="m-panel"><div class="m-panel__head"><h4>' + esc(t.sources) + '</h4>' + C.tt("proven", "stored provenance") + '</div><dl class="m-kv">' +
      '<dt>' + esc(t.storage) + '</dt><dd class="m-mono" dir="ltr">engine_settings · key: risk_model</dd>' +
      '<dt>' + esc(t.verLabel) + '</dt><dd class="m-mono">2026-Q3-interim (DEC-001)</dd>' +
      '<dt>' + esc(t.lastSaved) + '</dt><dd class="m-mono" dir="ltr">2026-06-28 14:22</dd>' +
      '<dt>' + esc(t.savedBy) + '</dt><dd>' + C.nm("noura", t === L.ar ? "ar" : "en") + '</dd>' +
      '</dl><p class="cd-sub">' + esc(t.histNote) + '</p></div>';
  }

  function trace(t, opts) {
    opts = opts || {};
    var score = opts.missing ? "63.5" : opts.edge ? "69.4" : "66.5";
    return '<div class="m-panel"><div class="m-panel__head"><h4>' + esc(t.trace) + '</h4>' + C.tt("computed", "COMPUTED_FROM_ENGINE_SETTINGS + factory record") + '</div>' +
      '<div style="display:flex;align-items:baseline;gap:16px;flex-wrap:wrap"><span class="rk-score m-num">' + score + '</span>' + C.loz("warning", t.bands[1][0] + " " + t.bands[1][1]) + '<span class="cd-sub">' + esc(t.fName) + '</span></div>' +
      '<div style="overflow-x:auto"><table class="legacy-table rk-trace"><thead><tr><th>' + esc(t.input) + '</th><th>' + esc(t.w) + '</th><th>norm</th><th class="wf-actcell">' + esc(t.contrib) + '</th></tr></thead><tbody>' +
      t.traceRows.map(function (r, i) {
        var missing = opts.missing && i === 1;
        return '<tr' + (missing ? ' style="background:var(--legacy-color-critical-tint)"' : '') + '><td class="m-mono" dir="ltr">' + (missing ? 'complaints_12m = —' : esc(r[0])) + '</td><td class="m-num">' + r[1] + '</td><td class="m-mono">' + (missing ? '— → 0.00' : esc(r[2])) + '</td><td class="m-num wf-actcell">' + (missing ? "0.0" : r[3]) + '</td></tr>';
      }).join("") +
      '<tr><td colspan="3" style="font:var(--legacy-text-body-strong)">' + esc(t.total) + '</td><td class="m-num wf-actcell" style="font:var(--legacy-text-body-strong)">' + score + '</td></tr></tbody></table></div>' +
      '<p class="cd-sub">' + esc(t.denom) + '</p>' + C.fixtureNote(t === L.ar ? "ar" : "en") + '</div>';
  }

  function bar(t, opts) {
    opts = opts || {};
    return '<div class="legacy-commandbar"><button class="legacy-btn"' + (opts.noSave ? ' disabled aria-disabled="true"' : '') + '>' + esc(t.save) + '</button>' +
      '<span class="legacy-commandbar__spacer"></span><span class="cd-sub m-mono" dir="ltr">engine_settings · direct save</span></div>';
  }

  function frame(lang, t, main) {
    return C.frame(lang, C.nav(lang, t.group, [["◮", t.crumbs[2], true]]),
      C.pagehead(lang, { title: t.title, sub: t.sub, role: t.role, crumbs: t.crumbs, searchPh: t.searchPh }), main);
  }

  function grid(t, lang, opts) {
    return '<div class="m-split"><div style="display:flex;flex-direction:column;gap:16px">' + trace(t, opts) + record(t) + '</div>' +
      '<div style="display:flex;flex-direction:column;gap:16px">' + drivers(t, opts) + bands(t, opts && opts.edge) +
      C.notYet(lang, L[lang].nyaT, L[lang].nyaD, L[lang].nyaSeam) + '</div></div>';
  }

  function render(state, lang) {
    var t = L[lang];
    var body;
    if (state === "empty") body = C.content(C.stateEmpty(lang, "◮", t.emptyT, t.emptyD));
    else if (state === "loading") body = C.content(C.skeleton(lang, t.loading));
    else if (state === "unauthorized") body = C.content(C.stateUnauth(lang));
    else if (state === "offline") body = C.content(C.stateOffline(lang, "◮"));
    else if (state === "sum-fail") body = C.content(bar(t, { noSave: true }) + C.guard(t.sumFailT, t.sumFailD) + C.legend(lang) + grid(t, lang, { sumFail: true }));
    else if (state === "missing-input") body = C.content(bar(t, {}) + C.banner("warning", "◧", t.missingT, t.missingD) + C.legend(lang) + grid(t, lang, { missing: true }));
    else if (state === "threshold-edge") body = C.content(bar(t, {}) + C.banner("warning", "‖", t.edgeT, t.edgeD) + C.legend(lang) + grid(t, lang, { edge: true }));
    else if (state === "saved") body = C.content(bar(t, {}) + '<div class="legacy-banner"><span>✓</span><div><strong>' + esc(t.savedT) + '</strong><div class="cd-sub">' + esc(t.savedD) + '</div></div></div>' + C.legend(lang) + grid(t, lang, {}));
    else if (state === "rls-denied") body = C.content(bar(t, { noSave: true }) + C.guard(t.rlsT, t.rlsD) + C.legend(lang) + grid(t, lang, {}));
    else /* complete — primary */ body = C.content(bar(t, {}) + C.legend(lang) + grid(t, lang, {}));
    return frame(lang, t, body);
  }

  C.register("cd14", {
    id: "CD-014", screen: "SCR-ADM-060", title: { en: "Risk configuration", ar: "إعداد المخاطر" },
    states: [
      { id: "complete", n: "S01", label: "Stored model — primary (trace + factors + bands)" },
      { id: "sum-fail", n: "S02", label: "Weights-sum validation fails — save blocked (outlier)" },
      { id: "missing-input", n: "S03", label: "Factory cannot be fully scored" },
      { id: "threshold-edge", n: "S04", label: "Threshold-edge factory" },
      { id: "saved", n: "S05", label: "Saved — effective immediately" },
      { id: "rls-denied", n: "S06", label: "Save rejected by RLS" },
      { id: "empty", n: "S07", label: "Empty — no model stored" },
      { id: "loading", n: "S08", label: "Loading" },
      { id: "unauthorized", n: "S09", label: "Unauthorized" },
      { id: "offline", n: "S10", label: "Offline" }
    ],
    outlier: "sum-fail",
    render: render
  });
})();
