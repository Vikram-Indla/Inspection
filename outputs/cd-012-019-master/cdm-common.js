/* CDM — shared kit for the CD-012→CD-019 master package (window.CDM).
   One visual grammar: frozen Astryx shell, DEC-011 tokens, truth tiers
   (PROVEN solid / COMPUTED dashed / BLOCKED quarantined), maker-checker
   approval grammar, EN/AR first-class. Screens register via CDM.register. */
(function () {
  "use strict";
  var CDM = { screens: {}, order: [] };

  CDM.esc = function (s) { return String(s == null ? "" : s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); };
  var esc = CDM.esc;

  CDM.NAMES = {
    noura: { en: "Noura Al-Qahtani", ar: "نورة القحطاني" },
    faisal: { en: "Faisal Al-Harbi", ar: "فيصل الحربي" },
    sara: { en: "Sara Al-Otaibi", ar: "سارة العتيبي" },
    khalid: { en: "Khalid Al-Dossari", ar: "خالد الدوسري" },
    omar: { en: "Omar Al-Ghamdi", ar: "عمر الغامدي" },
    reem: { en: "Reem Al-Shehri", ar: "ريم الشهري" }
  };
  CDM.nm = function (k, lang) { return CDM.NAMES[k] ? esc(CDM.NAMES[k][lang]) : "—"; };

  /* common bilingual strings */
  CDM.COM = {
    en: { dir: "ltr", skip: "Skip to content", synced: "Synced", account: "Noura Al-Qahtani",
      ops: "Operations", opsCentre: "Operations centre", visits: "Visits",
      legend: "Truth tiers", legProven: "Proven (from payload)", legComputed: "Computed (needs source)", legBlocked: "Blocked (not shown as truth)",
      clear: "Clear", search: "Search…", loading: "Loading…", collapse: "Collapse",
      stDraft: "Draft", stPublished: "Published", stActive: "Active", stSuper: "Superseded", stReview: "Awaiting approval", stPaused: "Paused",
      empty: "Nothing here yet", unauthT: "Out of scope", unauthD: "Your role cannot access this area. RLS is enforced server-side — no action is rendered.",
      offlineT: "Offline", offlineD: "This surface is a server-only read and is unavailable offline. Values shown are last fetched.",
      staleT: "Stale detection is blocked", staleD: "No concurrent-change detection is established in source, so staleness is not claimed. Safe behavior: re-fetch on tab focus.", refetch: "Re-fetch",
      you: "you", proposed: "Proposed by", approvedBy: "Approved by", pending: "awaiting checker",
      sepTitle: "You cannot approve — separation of duties", sepD: "You proposed this draft (the maker). Approval requires a different checker — a contract/DB boundary.",
      immTitle: "Published version is immutable", immD: "Published config is not edited in place; change happens by proposing a new draft and approving it." },
    ar: { dir: "rtl", skip: "تخطٍّ إلى المحتوى", synced: "متزامن", account: "نورة القحطاني",
      ops: "العمليات", opsCentre: "مركز العمليات", visits: "الزيارات",
      legend: "مستويات الحقيقة", legProven: "مُثبت (من البيانات)", legComputed: "محسوب (يلزمه مصدر)", legBlocked: "محجوب (لا يُعرض كحقيقة)",
      clear: "مسح", search: "بحث…", loading: "جارٍ التحميل…", collapse: "طيّ",
      stDraft: "مسودة", stPublished: "منشور", stActive: "فعّال", stSuper: "مُستبدَل", stReview: "بانتظار الاعتماد", stPaused: "موقوف مؤقتًا",
      empty: "لا يوجد شيء بعد", unauthT: "خارج نطاق الصلاحية", unauthD: "دورك لا يملك صلاحية الوصول لهذه المنطقة. تُطبَّق سياسات RLS على الخادم — لا يُعرض أي إجراء.",
      offlineT: "غير متصل", offlineD: "هذه الواجهة تُقرأ من الخادم فقط ولا تتوفر دون اتصال. القيم آخر ما تم جلبه.",
      staleT: "كشف القِدَم محجوب", staleD: "لا توجد آلية كشف تغيّر متزامن مُثبتة، فلا نزعم اكتشاف القِدَم. السلوك الآمن: إعادة الجلب عند العودة للتبويب.", refetch: "إعادة الجلب",
      you: "أنت", proposed: "اقترحه", approvedBy: "اعتمده", pending: "بانتظار مدقّق",
      sepTitle: "لا يمكنك الاعتماد — فصل الواجبات", sepD: "أنت صاحب هذه المسودة (الصانع). الاعتماد يتطلب مدقّقًا مختلفًا — حدّ تعاقدي على قاعدة البيانات.",
      immTitle: "الإصدار المنشور غير قابل للتغيير", immD: "الإعداد المنشور لا يُعدَّل في مكانه؛ التغيير يتم باقتراح مسودة جديدة ثم اعتمادها." }
  };

  CDM.tt = function (tier, label) { return '<span class="tt-tag tt-tag--' + tier + '">' + esc(label) + '</span>'; };
  CDM.loz = function (kind, label) {
    var m = { success: "ax-lozenge--success", warning: "ax-lozenge--warning", critical: "ax-lozenge--critical", info: "ax-lozenge--info", none: "" };
    return '<span class="ax-lozenge ax-lozenge--sync ' + (m[kind] || "") + '">' + esc(label) + '</span>';
  };

  /* frozen shared shell */
  CDM.nav = function (lang, groupLabel, items) {
    var c = CDM.COM[lang];
    function item(icon, label, cur) { return '<a class="ax-nav-item" href="#"' + (cur ? ' aria-current="page"' : '') + '><span class="ax-nav-icon" aria-hidden="true">' + icon + '</span><span class="ax-nav-label">' + esc(label) + '</span></a>'; }
    return '<nav class="ax-shell__nav" aria-label="Primary">' +
      '<div class="ax-shell__brand"><span class="ax-shell__brand-mark" aria-hidden="true"><svg width="32" height="32" viewBox="0 0 32 32"><defs><linearGradient id="pmM" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D946EF"/><stop offset="1" stop-color="#7C6CFF"/></linearGradient></defs><path d="M16 3 L28 24 L4 24 Z" fill="url(#pmM)"/><path d="M16 3 L16 24 L4 24 Z" fill="#0B0B14" opacity=".22"/></svg></span>' +
      '<span class="ax-shell__brand-lockup"><span class="ax-shell__brand-wordmark">صقيل</span></span><button class="ax-shell__close" aria-label="Close">×</button></div>' +
      '<div class="ax-shell__groups">' +
      '<div class="ax-nav-group"><button class="ax-nav-group__trigger" aria-expanded="true">' + esc(c.ops) + '<span class="ax-nav-group__chevron">▾</span></button>' +
      item("◱", c.opsCentre) + item("▤", c.visits) + '</div>' +
      '<div class="ax-nav-group"><button class="ax-nav-group__trigger" aria-expanded="true">' + esc(groupLabel) + '<span class="ax-nav-group__chevron">▾</span></button>' +
      items.map(function (it) { return item(it[0], it[1], !!it[2]); }).join("") + '</div>' +
      '</div>' +
      '<button class="ax-shell__collapse"><span>«</span><span class="ax-nav-label">' + esc(c.collapse) + '</span></button></nav>';
  };

  CDM.pagehead = function (lang, o) {
    var c = CDM.COM[lang];
    var mode = o.mode ? '<div class="wf-mode" role="group" aria-label="Mode">' + o.mode.map(function (m) { return '<a href="#"' + (m[1] ? ' aria-current="page"' : '') + '>' + esc(m[0]) + '</a>'; }).join("") + '</div>' : "";
    return '<header class="ax-pagehead">' +
      '<div class="ax-pagehead__topbar">' +
      '<button class="ax-shell__menu ax-topbar-icon" aria-label="Menu">☰</button>' +
      '<div class="ax-shell-search"><span class="ax-shell-search__icon">⌕</span><input placeholder="' + esc(o.searchPh || c.search) + '" aria-label="' + esc(o.searchPh || c.search) + '"></div>' +
      '<div class="ax-pagehead__actions"><span class="ax-sync ax-sync--synced">' + esc(c.synced) + '</span>' +
      '<button class="ax-topbar-icon" aria-label="Notifications">◔</button>' +
      '<div class="ax-shell-account"><button class="ax-shell-account__trigger"><span class="ax-shell-account__avatar">NA</span>' +
      '<span class="ax-shell-account__identity"><strong>' + esc(c.account) + '</strong><small>' + esc(o.role) + '</small></span></button></div></div></div>' +
      '<div class="ax-pagehead__row"><div class="cd-ctx">' +
      '<ol class="ax-breadcrumb">' + o.crumbs.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join("") + '</ol>' +
      '<div class="ax-pagehead__context"><h1 class="cd-ctx__id" style="font:var(--ax-text-title)">' + esc(o.title) + '</h1></div>' +
      '<p class="cd-opnote">' + esc(o.sub) + '</p></div>' + mode + '</div></header>';
  };

  CDM.legend = function (lang) {
    var c = CDM.COM[lang];
    return '<div class="tt-legend"><b>' + c.legend + ':</b>' +
      '<span class="tt-tag tt-tag--proven">' + c.legProven + '</span>' +
      '<span class="tt-tag tt-tag--computed">' + c.legComputed + '</span>' +
      '<span class="tt-tag tt-tag--blocked">' + c.legBlocked + '</span></div>';
  };

  CDM.kpis = function (items) {
    return '<div class="wf-kpis">' + items.map(function (k) {
      return '<div class="ax-surface wf-kpi"><span class="wf-kpi__v ax-numeric">' + k.v + '</span><span class="wf-kpi__l">' + esc(k.l) + '</span>' +
        (k.tier ? '<span class="wf-kpi__s">' + CDM.tt(k.tier, k.tierLabel || (k.tier === "proven" ? "payload" : k.tier)) + '</span>' : '') + '</div>';
    }).join("") + '</div>';
  };

  CDM.commandbar = function (chips, primary, extra) {
    return '<div class="ax-commandbar">' + chips.map(function (ch, i) { return '<button class="ax-filterchip' + (i === 0 ? ' is-active' : '') + '">' + esc(ch) + '</button>'; }).join("") +
      (extra || "") + '<span class="ax-commandbar__spacer"></span>' + (primary ? '<button class="ax-btn">＋ ' + esc(primary) + '</button>' : '') + '</div>';
  };

  CDM.table = function (cols, bodyHtml) {
    return '<div class="ax-tablewrap"><table class="ax-table" role="grid"><thead><tr>' +
      cols.map(function (col) { return '<th' + (col && col.end ? ' class="wf-actcell"' : '') + '>' + esc(col.l !== undefined ? col.l : col) + '</th>'; }).join("") +
      '</tr></thead><tbody>' + bodyHtml + '</tbody></table></div>';
  };

  CDM.blocked = function (title, items) {
    return '<div class="wf-blocked"><div class="wf-blocked__head"><span>⛔</span><b>' + esc(title) + '</b></div><ul>' +
      items.map(function (i) { return '<li><div class="wf-blocked__label"><span>' + esc(i[0]) + '</span>' + CDM.tt(i[2] || "blocked", i[3]) + '</div><span class="wf-ph">' + esc(i[1]) + '</span></li>'; }).join("") + '</ul></div>';
  };

  CDM.banner = function (kind, icon, title, desc, action) {
    var cls = kind === "warning" ? " ax-banner--warning" : kind === "immutable" ? " ax-banner--immutable" : "";
    return '<div class="ax-banner' + cls + '"><span>' + icon + '</span><div><strong>' + esc(title) + '</strong><div class="cd-sub">' + esc(desc) + '</div></div>' +
      (action ? '<button class="ax-btn ax-btn--secondary ax-btn--sm" style="margin-inline-start:auto">' + esc(action) + '</button>' : '') + '</div>';
  };

  CDM.guard = function (title, desc) {
    return '<div class="wf-guard"><span class="wf-guard__g">⛔</span><span class="wf-guard__t"><b>' + esc(title) + '</b>' + esc(desc) + '</span></div>';
  };

  CDM.stateEmpty = function (lang, glyph, title, sub, cta) {
    return '<div class="ax-surface ax-state"><div class="ax-state__glyph">' + glyph + '</div><h4>' + esc(title) + '</h4><p>' + esc(sub) + '</p>' + (cta ? '<button class="ax-btn">＋ ' + esc(cta) + '</button>' : '') + '</div>';
  };
  CDM.stateUnauth = function (lang) {
    var c = CDM.COM[lang];
    return '<div class="ax-surface ax-permission ax-state"><div class="ax-state__glyph">🔒</div><h4>' + c.unauthT + '</h4><p style="max-inline-size:54ch">' + c.unauthD + '</p></div>';
  };
  CDM.stateOffline = function (lang, glyph) {
    var c = CDM.COM[lang];
    return CDM.banner("warning", "⛔", c.offlineT, c.offlineD) + '<div class="ax-surface ax-state"><div class="ax-state__glyph" style="opacity:.5">' + (glyph || "⚙") + '</div><p class="cd-sub">' + c.offlineD + '</p></div>';
  };
  CDM.stateStale = function (lang, body) {
    var c = CDM.COM[lang];
    return CDM.banner("warning", "⟳", c.staleT, c.staleD, c.refetch) + body;
  };
  CDM.skeleton = function (lang, label) {
    function sk(w) { return '<div class="ax-skeleton" style="block-size:16px;inline-size:' + w + '"></div>'; }
    return '<div class="wf-kpis">' + [1, 2, 3, 4].map(function () { return '<div class="ax-surface wf-kpi">' + sk("55%") + '<div style="height:8px"></div>' + sk("80%") + '</div>'; }).join("") + '</div>' +
      '<div class="ax-tablewrap" aria-busy="true"><div style="padding:20px;display:flex;flex-direction:column;gap:16px">' +
      [1, 2, 3, 4, 5].map(function () { return '<div style="display:flex;gap:24px;align-items:center">' + sk("22%") + sk("14%") + sk("14%") + sk("18%") + sk("10%") + '</div>'; }).join("") + '</div></div>' +
      '<p class="cd-sub" role="status">' + esc(label) + '</p>';
  };

  CDM.content = function (inner) { return '<div class="ax-content">' + inner + '</div>'; };

  CDM.frame = function (lang, navHtml, headHtml, mainHtml) {
    var c = CDM.COM[lang];
    return '<div class="ax-shell" dir="' + c.dir + '" lang="' + lang + '">' +
      '<a class="ax-shell__skip" href="#m-main">' + c.skip + '</a>' + navHtml +
      '<div class="ax-shell__main"><a id="m-main"></a>' + headHtml + mainHtml + '</div></div>';
  };

  CDM.register = function (id, def) { CDM.screens[id] = def; CDM.order.push(id); };
  CDM.render = function (id, state, lang) {
    lang = lang === "ar" ? "ar" : "en";
    var s = CDM.screens[id];
    if (!s) return '<div style="padding:40px;font-family:monospace">unknown screen ' + esc(id) + '</div>';
    return s.render(state || s.states[0].id, lang);
  };

  window.CDM = CDM;
})();
