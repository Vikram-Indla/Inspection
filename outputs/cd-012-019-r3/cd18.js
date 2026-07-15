/* CD-018 R2 · ADM-LOCALIZATION — Localization studio.
   PRESENT TRUTH: the real ui_strings workflow — load, save translation, mark
   reviewed, add key, sync from code, history, restore revision (restore lands
   as a DRAFT). Actual draft/review rules + RLS. No invented approval model,
   MT provider, or Arabic-review persona. New required states: orphaned keys,
   sync errors, source scan failure. Priority BUILDABLE_NOW slice. */
(function () {
  "use strict";
  var C = window.CDM, esc = C.esc;

  var L = {
    en: { group: "Administration", title: "Localization studio", sub: "The ui_strings store, worked directly: source string, Arabic translation, review state, history and restore — with sync from code as the intake",
      role: "Admin (localization)", crumbs: ["Admin", "Administration", "Localization"], searchPh: "Search keys, English or Arabic text…",
      saveTr: "Save translation", markRev: "Mark reviewed", addKey: "Add key", sync: "Sync from code", restore: "Restore as draft", history: "History",
      filters: ["Module: Visits", "Needs review", "Missing Arabic", "Orphaned"],
      stReviewed: "Reviewed", stDraftS: "Draft", stMissing: "Missing AR", stOrphan: "Orphaned", stDrift: "Source changed",
      riskLong: "AR is 42% longer — check narrow layouts", drift: "EN source changed after this Arabic was reviewed — it returns to draft until re-reviewed.",
      phErr: "Placeholder {{count}} is missing from the Arabic — Save translation is disabled until placeholders match.",
      orphanNote: "This key no longer appears in the last code scan. It stays restorable in history; syncing marks it orphaned rather than deleting it.",
      histT: "History — visits.submit.action",
      histRows: [["rev 4", "2026-07-08", "draft (source changed)", "sync from code"], ["rev 3", "2026-05-14", "reviewed", "Sara Al-Otaibi"], ["rev 2", "2026-03-02", "reviewed", "Sara Al-Otaibi"], ["rev 1", "2026-01-19", "draft", "added via sync"]],
      restNote: "Restore writes the selected revision as a NEW DRAFT — nothing is overwritten and the restored draft still needs review.",
      restoredT: "Rev 3 restored as draft", restoredD: "The reviewed rev 3 Arabic is now the current draft of this key. It needs review before it is marked reviewed again; rev 4 remains in history.",
      syncOkT: "Sync from code finished", syncOkD: "212 keys scanned · 3 new added as drafts · 1 marked orphaned · 2 English sources changed (their Arabic returned to draft).",
      syncErrT: "Sync failed — source scan error", syncErrD: "The code scan aborted at apps/web/src/app/visits (parse error). No keys were changed — the store is exactly as before the sync. Fix the scan input and run sync again.",
      rlsT: "Save rejected by row-level security", rlsD: "Your session cannot write ui_strings. The translation on screen is unsaved.",
      emptyT: "No strings match", emptyD: "Adjust the module or status filters.", loading: "Loading strings…",
      rows: [
        { key: "visits.submit.action", en: "Submit visit for review", ar: "تقديم الزيارة للمراجعة", st: "reviewed" },
        { key: "visits.evidence.hint", en: "Attach at least {{count}} photos of the production line", ar: "أرفق ما لا يقل عن {{count}} صورة لخط الإنتاج", st: "draft", risk: "long" },
        { key: "visits.geofence.warning", en: "You are outside the arrival radius ({{meters}} m)", ar: "", st: "missing" },
        { key: "visits.legacy.banner", en: "Legacy inspection notice", ar: "إشعار تفتيش قديم", st: "orphan" }
      ] },
    ar: { group: "الإدارة العامة", title: "استوديو التعريب", sub: "مخزن ui_strings مباشرةً: النص المصدر والترجمة العربية وحالة المراجعة والسجل والاسترجاع — مع المزامنة من الشيفرة مدخلًا",
      role: "مشرف (تعريب)", crumbs: ["الإدارة", "الإدارة العامة", "التعريب"], searchPh: "ابحث بالمفتاح أو النص الإنجليزي أو العربي…",
      saveTr: "حفظ الترجمة", markRev: "وضع علامة مُراجَع", addKey: "إضافة مفتاح", sync: "مزامنة من الشيفرة", restore: "استرجاع كمسودة", history: "السجل",
      filters: ["الوحدة: الزيارات", "يحتاج مراجعة", "عربي مفقود", "يتيم"],
      stReviewed: "مُراجَع", stDraftS: "مسودة", stMissing: "عربي مفقود", stOrphan: "يتيم", stDrift: "تغيّر المصدر",
      riskLong: "العربية أطول بنسبة 42٪ — افحص التخطيطات الضيقة", drift: "تغيّر المصدر الإنجليزي بعد مراجعة هذه العربية — تعود مسودةً حتى يُعاد مراجعتها.",
      phErr: "المتغيّر {{count}} مفقود من العربية — حفظ الترجمة معطّل حتى تتطابق المتغيّرات.",
      orphanNote: "هذا المفتاح لم يعد يظهر في آخر مسح للشيفرة. يبقى قابلًا للاسترجاع من السجل؛ والمزامنة تعلّمه يتيمًا ولا تحذفه.",
      histT: "السجل — visits.submit.action",
      histRows: [["مراجعة 4", "2026-07-08", "مسودة (تغيّر المصدر)", "مزامنة من الشيفرة"], ["مراجعة 3", "2026-05-14", "مُراجَع", "سارة العتيبي"], ["مراجعة 2", "2026-03-02", "مُراجَع", "سارة العتيبي"], ["مراجعة 1", "2026-01-19", "مسودة", "أُضيف عبر المزامنة"]],
      restNote: "الاسترجاع يكتب المراجعة المختارة كمسودة جديدة — لا شيء يُستبدل، والمسودة المسترجَعة تحتاج مراجعة.",
      restoredT: "استُرجعت المراجعة 3 كمسودة", restoredD: "عربية المراجعة 3 المُراجَعة هي الآن المسودة الحالية لهذا المفتاح. تحتاج مراجعة قبل وسمها مُراجَعة مجددًا؛ وتبقى المراجعة 4 في السجل.",
      syncOkT: "انتهت المزامنة من الشيفرة", syncOkD: "مُسح 212 مفتاحًا · أُضيف 3 جديدة كمسودات · عُلّم 1 يتيمًا · تغيّر مصدران إنجليزيان (عادت عربيتهما مسودة).",
      syncErrT: "فشلت المزامنة — خطأ مسح المصدر", syncErrD: "توقف مسح الشيفرة عند apps/web/src/app/visits (خطأ تحليل). لم يتغيّر أي مفتاح — المخزن كما كان قبل المزامنة تمامًا. صحّح مدخل المسح وأعد المزامنة.",
      rlsT: "رُفض الحفظ بواسطة أمان مستوى الصفوف", rlsD: "جلستك لا تستطيع الكتابة في ui_strings. الترجمة المعروضة غير محفوظة.",
      emptyT: "لا نصوص مطابقة", emptyD: "عدّل مرشّحات الوحدة أو الحالة.", loading: "جارٍ تحميل النصوص…",
      rows: [
        { key: "visits.submit.action", en: "Submit visit for review", ar: "تقديم الزيارة للمراجعة", st: "reviewed" },
        { key: "visits.evidence.hint", en: "Attach at least {{count}} photos of the production line", ar: "أرفق ما لا يقل عن {{count}} صورة لخط الإنتاج", st: "draft", risk: "long" },
        { key: "visits.geofence.warning", en: "You are outside the arrival radius ({{meters}} m)", ar: "", st: "missing" },
        { key: "visits.legacy.banner", en: "Legacy inspection notice", ar: "إشعار تفتيش قديم", st: "orphan" }
      ] }
  };

  function stLoz(t, st) {
    var m = { reviewed: ["success", t.stReviewed], draft: ["warning", t.stDraftS], missing: ["critical", t.stMissing], orphan: ["none", t.stOrphan], drift: ["warning", t.stDrift] };
    var s = m[st] || m.draft;
    return C.loz(s[0], s[1]);
  }
  function phWrap(txt, err) {
    return esc(txt).replace(/\{\{(\w+)\}\}/g, function (_, p) { return '<span class="lz-ph' + (err ? " lz-ph--err" : "") + '">{{' + p + '}}</span>'; });
  }

  function row(t, lang, r, opts) {
    opts = opts || {};
    var drift = opts.driftKey === r.key, phErr = opts.phErrKey === r.key;
    var enHtml = drift ? esc("Submit visit for ") + '<span class="lz-drift">L1 </span>' + esc("review") : phWrap(r.en);
    var arHtml = r.ar ? phWrap(r.ar, phErr) : '<span class="wf-ph">' + esc(t.stMissing) + '</span>';
    var actions = r.st === "orphan"
      ? '<button class="ax-btn ax-btn--subtle ax-btn--sm">' + esc(t.history) + '</button>'
      : '<button class="ax-btn ax-btn--sm"' + (phErr ? ' disabled aria-disabled="true"' : '') + '>' + esc(t.saveTr) + '</button>' +
        '<button class="ax-btn ax-btn--secondary ax-btn--sm"' + (r.st !== "draft" || phErr || drift ? ' disabled aria-disabled="true"' : '') + '>' + esc(t.markRev) + '</button>';
    return '<div class="lz-row"' + (r.st === "orphan" ? ' style="opacity:.8"' : '') + '>' +
      '<div class="lz-cell" dir="ltr"><span class="lz-key">' + r.key + '</span><span class="lz-src">' + enHtml + '</span>' +
      (drift ? '<span class="lz-risk">⟳ ' + esc(t.drift) + '</span>' : '') +
      (r.st === "orphan" ? '<span class="lz-risk" style="color:var(--ax-color-text-secondary)">◌ ' + esc(t.orphanNote) + '</span>' : '') + '</div>' +
      '<div class="lz-cell" dir="rtl"><span class="lz-key">AR</span><span class="lz-ar">' + arHtml + '</span>' +
      (r.risk === "long" ? '<span class="lz-risk">↔ ' + esc(t.riskLong) + '</span>' : '') +
      (phErr ? '<span class="lz-risk" style="color:var(--ax-color-critical-strong)">✕ ' + esc(t.phErr) + '</span>' : '') + '</div>' +
      '<div class="lz-cell" style="justify-content:center;gap:8px">' + stLoz(t, drift ? "drift" : r.st) + '<span style="display:flex;gap:6px;flex-wrap:wrap">' + actions + '</span></div></div>';
  }

  function list(t, lang, opts) {
    return '<div class="lz-list">' + t.rows.map(function (r) { return row(t, lang, r, opts); }).join("") + '</div>';
  }

  function history(t) {
    return '<div class="m-panel"><div class="m-panel__head"><h4>' + esc(t.histT) + '</h4>' + C.tt("proven", "ui_strings revisions") + '</div>' +
      '<ul class="wf-prov">' + t.histRows.map(function (h, i) {
        var cls = i === 0 ? " is-draft" : i === 3 ? " is-super" : "";
        return '<li class="' + cls.trim() + '"><div class="wf-prov__t"><span class="ax-version">' + esc(h[0]) + '</span><span class="wf-prov__m" dir="ltr">' + h[1] + '</span><span class="cd-sub">' + esc(h[2]) + '</span></div><span class="wf-prov__m">' + esc(h[3]) + '</span></li>';
      }).join("") + '</ul>' +
      '<button class="ax-btn ax-btn--secondary ax-btn--sm" style="align-self:flex-start">' + esc(t.restore) + ' — rev 3</button>' +
      '<p class="cd-sub">' + esc(t.restNote) + '</p></div>';
  }

  function bar(t, opts) {
    opts = opts || {};
    return '<div class="ax-commandbar">' + t.filters.map(function (f, i) { return '<button class="ax-filterchip' + (i === 0 ? ' is-active' : '') + '">' + esc(f) + '</button>'; }).join("") +
      '<span class="ax-commandbar__spacer"></span>' +
      '<button class="ax-btn ax-btn--secondary ax-btn--sm">＋ ' + esc(t.addKey) + '</button>' +
      '<button class="ax-btn"' + (opts.noSync ? ' disabled aria-disabled="true"' : '') + '>⟳ ' + esc(t.sync) + '</button></div>';
  }

  function frame(lang, t, main) {
    return C.frame(lang, C.nav(lang, t.group, [["文", t.crumbs[2], true], ["⛬", lang === "ar" ? "سجل التدقيق" : "Audit trail", false]]),
      C.pagehead(lang, { title: t.title, sub: t.sub, role: t.role, crumbs: t.crumbs, searchPh: t.searchPh }), main);
  }

  function grid(t, lang, opts) {
    return '<div class="m-split"><div>' + list(t, lang, opts) + '</div><div style="display:flex;flex-direction:column;gap:16px">' + history(t) + '</div></div>';
  }

  function render(state, lang) {
    var t = L[lang];
    var body;
    if (state === "empty") body = C.content(bar(t, {}) + C.stateEmpty(lang, "文", t.emptyT, t.emptyD));
    else if (state === "loading") body = C.content(C.skeleton(lang, t.loading));
    else if (state === "unauthorized") body = C.content(C.stateUnauth(lang));
    else if (state === "offline") body = C.content(C.stateOffline(lang, "文"));
    else if (state === "source-drift") body = C.content(bar(t, {}) + C.banner("warning", "⟳", t.stDrift, t.drift) + C.legend(lang) + grid(t, lang, { driftKey: "visits.submit.action" }));
    else if (state === "placeholder-error") body = C.content(bar(t, {}) + C.guard(t.stMissing, t.phErr) + C.legend(lang) + grid(t, lang, { phErrKey: "visits.evidence.hint" }));
    else if (state === "orphaned") body = C.content(bar(t, {}) + C.legend(lang) + grid(t, lang, {}));
    else if (state === "sync-ok") body = C.content(bar(t, {}) + '<div class="ax-banner"><span>✓</span><div><strong>' + esc(t.syncOkT) + '</strong><div class="cd-sub">' + esc(t.syncOkD) + '</div></div></div>' + C.legend(lang) + grid(t, lang, {}));
    else if (state === "sync-error") body = C.content(bar(t, { noSync: true }) + C.guard(t.syncErrT, t.syncErrD) + C.legend(lang) + grid(t, lang, {}));
    else if (state === "restored") body = C.content(bar(t, {}) + '<div class="ax-banner"><span>↩</span><div><strong>' + esc(t.restoredT) + '</strong><div class="cd-sub">' + esc(t.restoredD) + '</div></div></div>' + C.legend(lang) + grid(t, lang, {}));
    else if (state === "rls-denied") body = C.content(bar(t, {}) + C.guard(t.rlsT, t.rlsD) + C.legend(lang) + grid(t, lang, {}));
    else /* review — primary */ body = C.content(bar(t, {}) + C.legend(lang) + grid(t, lang, {}));
    return frame(lang, t, body);
  }

  C.register("cd18", {
    id: "CD-018", screen: "ADM-LOCALIZATION", title: { en: "Localization studio", ar: "استوديو التعريب" },
    states: [
      { id: "review", n: "S01", label: "Working view — primary (real ui_strings actions)" },
      { id: "source-drift", n: "S02", label: "Source drift — back to draft (outlier)" },
      { id: "placeholder-error", n: "S03", label: "Placeholder mismatch — save disabled" },
      { id: "orphaned", n: "S04", label: "Orphaned key — kept, not deleted" },
      { id: "sync-ok", n: "S05", label: "Sync from code — result summary" },
      { id: "sync-error", n: "S06", label: "Sync failed — store untouched" },
      { id: "restored", n: "S07", label: "Restored as draft" },
      { id: "rls-denied", n: "S08", label: "Save rejected by RLS" },
      { id: "empty", n: "S09", label: "Filtered empty" },
      { id: "loading", n: "S10", label: "Loading" },
      { id: "unauthorized", n: "S11", label: "Unauthorized" },
      { id: "offline", n: "S12", label: "Offline" }
    ],
    outlier: "source-drift",
    render: render
  });
})();
