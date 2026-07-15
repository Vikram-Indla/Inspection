/* CD-018 · ADM-LOCALIZATION — Localization studio (bilingual production control).
   ui_strings versioned store (stated-by-contract). EN source + AR edit + status
   + context + visual-risk cues side by side. Screen-context screenshots and
   human Arabic review remain open items; both surfaced honestly. */
(function () {
  "use strict";
  var C = window.CDM, esc = C.esc;

  var L = {
    en: { group: "Administration", title: "Localization studio", sub: "Bilingual production control: source string, translation, review status, screen context and layout-risk cues side by side — versioned, restorable",
      role: "Localization Reviewer", crumbs: ["Admin", "Administration", "Localization"], searchPh: "Search keys, English or Arabic text…",
      approve: "Approve", exportCsv: "Export CSV", restore: "Restore version", history: "History", context: "Open screen context",
      filters: ["Module: Visits", "Needs review", "Source drift", "Missing AR"],
      kTotal: "Strings", kNeeds: "Needs review", kDrift: "Source drift", kMissing: "Missing Arabic",
      stApproved: "Approved", stNeeds: "Needs review", stDraftS: "Draft", stMissing: "Missing", stDrift: "Source drift", stRestored: "Restored",
      riskLong: "expansion +42% — check narrow layout", riskRtl: "mixed-direction placeholder — verify order",
      drift1: "Submit visit for review", drift1New: "Submit visit for L1 review", driftNote: "EN source changed 2026-07-08 after AR approval — Arabic re-review required; the drifted words are highlighted.",
      phErrNote: "Placeholder {{count}} missing from Arabic — the string cannot be approved; pluralization needs the {count, plural} form.",
      ctxNote: "Context screenshots may be stale — capture date shown on each; refreshing them is a manual step today (HANDOFF_BLOCKED_CONTEXT_CAPTURE).",
      histRows: [["v4", "2026-07-08", "needs review", "EN source drift"], ["v3", "2026-05-14", "approved", "Sara Al-Otaibi"], ["v2", "2026-03-02", "approved", "Sara Al-Otaibi"], ["v1", "2026-01-19", "draft", "machine draft"]],
      restoredT: "Version v3 restored", restoredD: "The approved v3 Arabic replaced the drifted v4 draft. Restore is itself a versioned event — nothing is overwritten; v4 remains in history.",
      blkTitle: "Open localization seams", blk: [["Screen-context capture", "manual capture; freshness not tracked", "computed", "HANDOFF_BLOCKED_CONTEXT_CAPTURE"], ["Human Arabic review", "reviewer role pending in canonical persona list", "blocked", "HANDOFF_BLOCKED_AR_REVIEW_ROLE"], ["Machine translation source", "no MT provider contract located", "blocked", "HANDOFF_BLOCKED_MT_PROVIDER"]],
      emptyT: "No strings match", emptyD: "Adjust the module or status filters.", loading: "Loading strings…",
      rows: [
        { key: "visits.submit.action", en: "Submit visit for review", ar: "تقديم الزيارة للمراجعة", st: "approved" },
        { key: "visits.evidence.hint", en: "Attach at least {{count}} photos of the production line", ar: "أرفق ما لا يقل عن {{count}} صورة لخط الإنتاج", st: "needs", risk: "long" },
        { key: "visits.geofence.warning", en: "You are outside the arrival radius ({{meters}} m)", ar: "", st: "missing" },
        { key: "review.return.reason", en: "Return to inspector with reason", ar: "إعادة إلى المفتّش مع بيان السبب", st: "approved" }
      ] },
    ar: { group: "الإدارة العامة", title: "استوديو التعريب", sub: "تحكّم إنتاجي ثنائي اللغة: النص المصدر والترجمة وحالة المراجعة وسياق الشاشة وإشارات مخاطر التخطيط جنبًا إلى جنب — مُصدَّر ومُسترجَع",
      role: "مراجع التعريب", crumbs: ["الإدارة", "الإدارة العامة", "التعريب"], searchPh: "ابحث بالمفتاح أو النص الإنجليزي أو العربي…",
      approve: "اعتماد", exportCsv: "تصدير CSV", restore: "استرجاع إصدار", history: "السجل", context: "فتح سياق الشاشة",
      filters: ["الوحدة: الزيارات", "يحتاج مراجعة", "انحراف المصدر", "عربي مفقود"],
      kTotal: "نصوص", kNeeds: "تحتاج مراجعة", kDrift: "انحراف مصدر", kMissing: "عربي مفقود",
      stApproved: "معتمد", stNeeds: "يحتاج مراجعة", stDraftS: "مسودة", stMissing: "مفقود", stDrift: "انحراف مصدر", stRestored: "مُسترجَع",
      riskLong: "تمدد +42٪ — افحص التخطيط الضيق", riskRtl: "متغيّر مختلط الاتجاه — تحقق من الترتيب",
      drift1: "Submit visit for review", drift1New: "Submit visit for L1 review", driftNote: "تغيّر المصدر الإنجليزي في 2026-07-08 بعد اعتماد العربية — تلزم إعادة مراجعة؛ الكلمات المنحرفة مُظلَّلة.",
      phErrNote: "المتغيّر {{count}} مفقود من العربية — لا يمكن اعتماد النص؛ ويتطلب الجمع صيغة {count, plural}.",
      ctxNote: "قد تكون لقطات السياق قديمة — يظهر تاريخ الالتقاط على كلٍّ منها؛ وتحديثها خطوة يدوية اليوم (HANDOFF_BLOCKED_CONTEXT_CAPTURE).",
      histRows: [["v4", "2026-07-08", "يحتاج مراجعة", "انحراف المصدر"], ["v3", "2026-05-14", "معتمد", "سارة العتيبي"], ["v2", "2026-03-02", "معتمد", "سارة العتيبي"], ["v1", "2026-01-19", "مسودة", "مسودة آلية"]],
      restoredT: "استُرجع الإصدار v3", restoredD: "حلّت عربية v3 المعتمدة محل مسودة v4 المنحرفة. الاسترجاع نفسه حدث مُصدَّر — لا شيء يُستبدل؛ ويبقى v4 في السجل.",
      blkTitle: "فواصل تعريب مفتوحة", blk: [["التقاط سياق الشاشة", "التقاط يدوي؛ النضارة غير متتبَّعة", "computed", "HANDOFF_BLOCKED_CONTEXT_CAPTURE"], ["المراجعة العربية البشرية", "دور المراجع معلّق في قائمة الشخصيات المعتمدة", "blocked", "HANDOFF_BLOCKED_AR_REVIEW_ROLE"], ["مصدر الترجمة الآلية", "لا عقد مزوّد ترجمة مُثبت", "blocked", "HANDOFF_BLOCKED_MT_PROVIDER"]],
      emptyT: "لا نصوص مطابقة", emptyD: "عدّل مرشّحات الوحدة أو الحالة.", loading: "جارٍ تحميل النصوص…",
      rows: [
        { key: "visits.submit.action", en: "Submit visit for review", ar: "تقديم الزيارة للمراجعة", st: "approved" },
        { key: "visits.evidence.hint", en: "Attach at least {{count}} photos of the production line", ar: "أرفق ما لا يقل عن {{count}} صورة لخط الإنتاج", st: "needs", risk: "long" },
        { key: "visits.geofence.warning", en: "You are outside the arrival radius ({{meters}} m)", ar: "", st: "missing" },
        { key: "review.return.reason", en: "Return to inspector with reason", ar: "إعادة إلى المفتّش مع بيان السبب", st: "approved" }
      ] }
  };

  function stLoz(t, st) {
    var m = { approved: ["success", t.stApproved], needs: ["warning", t.stNeeds], missing: ["critical", t.stMissing], drift: ["warning", t.stDrift], restored: ["info", t.stRestored], draft: ["none", t.stDraftS] };
    var s = m[st] || m.draft;
    return C.loz(s[0], s[1]);
  }

  function phWrap(txt, err) {
    return esc(txt).replace(/\{\{(\w+)\}\}/g, function (_, p) { return '<span class="lz-ph' + (err ? " lz-ph--err" : "") + '">{{' + p + '}}</span>'; });
  }

  function row(t, r, opts) {
    opts = opts || {};
    var drift = opts.driftKey === r.key;
    var phErr = opts.phErrKey === r.key;
    var enHtml = drift
      ? esc("Submit visit for ") + '<span class="lz-drift">L1 </span>' + esc("review")
      : phWrap(r.en);
    var arHtml = r.ar ? phWrap(r.ar, phErr) : '<span class="wf-ph">— ' + esc(t.stMissing) + '</span>';
    return '<div class="lz-row">' +
      '<div class="lz-cell" dir="ltr"><span class="lz-key">' + r.key + '</span><span class="lz-src">' + enHtml + '</span>' +
      (drift ? '<span class="lz-risk">⟳ ' + esc(t.stDrift) + ' · 2026-07-08</span>' : '') + '</div>' +
      '<div class="lz-cell" dir="rtl"><span class="lz-key">AR</span><span class="lz-ar">' + arHtml + '</span>' +
      (r.risk === "long" ? '<span class="lz-risk">↔ ' + esc(t.riskLong) + '</span>' : '') +
      (phErr ? '<span class="lz-risk" style="color:var(--ax-color-critical-strong)">✕ ' + esc(t.phErrNote) + '</span>' : '') + '</div>' +
      '<div class="lz-cell" style="justify-content:center;gap:8px">' + stLoz(t, drift ? "drift" : phErr ? "needs" : r.st) +
      '<button class="ax-btn ax-btn--subtle ax-btn--sm">' + esc(t.context) + '</button></div>' +
      '</div>';
  }

  function list(t, opts) {
    return '<div class="lz-list">' + t.rows.map(function (r) { return row(t, r, opts); }).join("") + '</div>';
  }

  function history(t) {
    return '<div class="m-panel"><div class="m-panel__head"><h4>' + esc(t.history) + ' — visits.submit.action</h4>' + C.tt("proven", "ui_strings versions") + '</div>' +
      '<ul class="wf-prov">' + t.histRows.map(function (h, i) {
        var cls = i === 0 ? " is-draft" : i === 3 ? " is-super" : "";
        return '<li class="' + cls.trim() + '"><div class="wf-prov__t"><span class="ax-version">' + h[0] + '</span><span class="wf-prov__m">' + h[1] + '</span><span class="cd-sub">' + esc(h[2]) + '</span></div><span class="wf-prov__m">' + esc(h[3]) + '</span></li>';
      }).join("") + '</ul>' +
      '<button class="ax-btn ax-btn--secondary ax-btn--sm" style="align-self:flex-start">' + esc(t.restore) + ' v3</button></div>';
  }

  function bar(t, opts) {
    opts = opts || {};
    return '<div class="ax-commandbar">' + t.filters.map(function (f, i) { return '<button class="ax-filterchip' + (i === 0 ? ' is-active' : '') + '">' + esc(f) + '</button>'; }).join("") +
      '<span class="ax-commandbar__spacer"></span>' +
      '<button class="ax-btn ax-btn--secondary ax-btn--sm">' + esc(t.exportCsv) + '</button>' +
      '<button class="ax-btn"' + (opts.noApprove ? ' disabled aria-disabled="true"' : '') + '>' + esc(t.approve) + '</button></div>';
  }

  function kpis(t) {
    return C.kpis([{ v: "2,418", l: t.kTotal, tier: "proven" }, { v: 96, l: t.kNeeds, tier: "proven" }, { v: 14, l: t.kDrift, tier: "proven" }, { v: 31, l: t.kMissing, tier: "proven" }]);
  }

  function grid(t, opts) {
    return '<div class="m-split"><div style="display:flex;flex-direction:column;gap:16px">' + list(t, opts) + '<p class="cd-sub">' + esc(t.ctxNote) + '</p></div>' +
      '<div style="display:flex;flex-direction:column;gap:16px">' + history(t) + C.blocked(t.blkTitle, t.blk) + '</div></div>';
  }

  function frame(lang, t, main) {
    return C.frame(lang, C.nav(lang, t.group, [["文", t.crumbs[2], true], ["⛬", lang === "ar" ? "سجل التدقيق" : "Audit trail", false]]),
      C.pagehead(lang, { title: t.title, sub: t.sub, role: t.role, crumbs: t.crumbs, searchPh: t.searchPh }), main);
  }

  function render(state, lang) {
    var t = L[lang];
    var body;
    if (state === "empty") body = C.content(bar(t, {}) + C.stateEmpty(lang, "文", t.emptyT, t.emptyD));
    else if (state === "loading") body = C.content(C.skeleton(lang, t.loading));
    else if (state === "unauthorized") body = C.content(C.stateUnauth(lang));
    else if (state === "offline") body = C.content(C.stateOffline(lang, "文"));
    else if (state === "source-drift") body = C.content(bar(t, { noApprove: true }) + C.banner("warning", "⟳", t.stDrift, t.driftNote) + C.legend(lang) + grid(t, { driftKey: "visits.submit.action" }));
    else if (state === "placeholder-error") body = C.content(bar(t, { noApprove: true }) + C.guard(t.stNeeds, t.phErrNote) + C.legend(lang) + grid(t, { phErrKey: "visits.evidence.hint" }));
    else if (state === "missing") body = C.content(bar(t, { noApprove: true }) + C.legend(lang) + grid(t, {}));
    else if (state === "restored") body = C.content(bar(t, {}) + '<div class="ax-banner"><span>↩</span><div><strong>' + esc(t.restoredT) + '</strong><div class="cd-sub">' + esc(t.restoredD) + '</div></div></div>' + C.legend(lang) + grid(t, {}));
    else if (state === "approved") body = C.content(bar(t, {}) + C.legend(lang) + kpis(t) + grid(t, {}));
    else if (state === "needs-review") body = C.content(bar(t, {}) + C.legend(lang) + grid(t, {}));
    else /* review — primary */ body = C.content(bar(t, {}) + C.legend(lang) + kpis(t) + grid(t, {}));
    return frame(lang, t, body);
  }

  C.register("cd18", {
    id: "CD-018", screen: "ADM-LOCALIZATION", title: { en: "Localization studio", ar: "استوديو التعريب" },
    states: [
      { id: "review", n: "S01", label: "Review — primary (EN/AR side-by-side)" },
      { id: "source-drift", n: "S02", label: "Source drift — re-review required (outlier)" },
      { id: "placeholder-error", n: "S03", label: "Placeholder error — cannot approve" },
      { id: "missing", n: "S04", label: "Missing Arabic" },
      { id: "needs-review", n: "S05", label: "Needs review queue" },
      { id: "approved", n: "S06", label: "Approved" },
      { id: "restored", n: "S07", label: "Version restored (versioned event)" },
      { id: "empty", n: "S08", label: "Filtered empty" },
      { id: "loading", n: "S09", label: "Loading" },
      { id: "unauthorized", n: "S10", label: "Unauthorized" },
      { id: "offline", n: "S11", label: "Offline" }
    ],
    outlier: "source-drift",
    render: render
  });
})();
