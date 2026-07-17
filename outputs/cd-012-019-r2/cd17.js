/* CD-017 R2 · SCR-ADM-090 — Roles and permissions.
   PRESENT TRUTH: /admin/access reads profiles, user roles and role records —
   a READ-ONLY viewer. There is no access-change approval workflow, no matrix
   editor, no enabled submit/approve. The effective-access explainer is a
   read-only PROPOSAL that never grants and states its missing policy inputs.
   Role-change workflow, SoD, self-escalation prevention, RLS citation and
   fallback authority are blocked backend contracts. */
(function () {
  "use strict";
  var C = window.CDM, esc = C.esc;

  var L = {
    en: { group: "Users & Roles", title: "Roles & permissions", sub: "A read-only view of who holds which role, with data scope as stored — changes to access are not made from this screen today",
      role: "Security Admin", crumbs: ["Admin", "Users & Roles", "Permissions"], searchPh: "Search users and roles…",
      ro: "READ-ONLY · view of stored roles",
      matrixT: "Role holdings (profiles + user roles)",
      users: [["Noura Al-Qahtani", "noura", ["Security Admin"]], ["Faisal Al-Harbi", "faisal", ["Inspector", "Reviewer L1"]], ["Sara Al-Otaibi", "sara", ["Workflow Admin"]], ["Khalid Al-Dossari", "khalid", ["Reviewer L2"]], ["Omar Al-Ghamdi", "omar", ["Inspector"]]],
      colUser: "User", colRoles: "Roles held", colScope: "Data scope (as stored)",
      scopes: { "Inspector": "own assignments", "Reviewer L1": "assigned region", "Reviewer L2": "assigned region", "Workflow Admin": "server-scoped", "Security Admin": "server-scoped" },
      multiNote: "Faisal holds two roles. What that combination effectively allows is enforced by RLS on the server — this page lists holdings; it does not evaluate policy.",
      explT: "Effective-access explainer — read-only proposal", explLbl: "PROPOSAL · never grants",
      explQ: "Could Faisal approve visit VIS-2026-04182 (a Reviewer L2 action)?",
      explRows: [["Roles held", "Inspector + Reviewer L1 — Reviewer L2 is not among them.", "proven"], ["What this page can conclude", "Based on holdings alone: the action's stated role is not held.", "computed"], ["What it cannot conclude", "The final answer is RLS policy evaluation on the server. Policy texts are not cited on this page — the explainer cannot be conclusive without them.", "blocked"]],
      explSeam: "HANDOFF_BLOCKED_RLS_CITATION",
      changeT: "Changing access", changeD: "There is no permission-change workflow on this screen. Grants and revocations happen through the database/ops process today. A governed change workflow (draft → second-admin approval, separation-of-duties checks, self-escalation prevention) is a proposed backend contract, not a current capability.",
      changeSeam: "NEEDS_APPROVED_CONTRACT — permission-change workflow",
      fallbackT: "Fallback authority", fallbackD: "What happens when no specific role matches (fallback-to-admin) is an unresolved decision. Until it is decided and cited, this page makes no claim about fallback behavior.",
      fallbackSeam: "BLOCKED_BY_DECISION — fallback authority",
      rlsDenyT: "Some records are not visible", rlsDenyD: "RLS limits which profiles your session can read. Users outside your scope are not listed rather than shown partially.",
      emptyT: "No roles in scope", emptyD: "Your session cannot read any role records.", loading: "Loading role holdings…" },
    ar: { group: "المستخدمون والأدوار", title: "الأدوار والصلاحيات", sub: "عرض للقراءة فقط لمن يحمل أي دور، مع نطاق البيانات كما هو مخزَّن — تغييرات الوصول لا تتم من هذه الشاشة اليوم",
      role: "مشرف أمني", crumbs: ["الإدارة", "المستخدمون والأدوار", "الصلاحيات"], searchPh: "ابحث في المستخدمين والأدوار…",
      ro: "للقراءة فقط · عرض الأدوار المخزَّنة",
      matrixT: "حيازات الأدوار (profiles + أدوار المستخدمين)",
      users: [["نورة القحطاني", "noura", ["مشرف أمني"]], ["فيصل الحربي", "faisal", ["مفتّش", "مراجع م١"]], ["سارة العتيبي", "sara", ["مشرف سير العمل"]], ["خالد الدوسري", "khalid", ["مراجع م٢"]], ["عمر الغامدي", "omar", ["مفتّش"]]],
      colUser: "المستخدم", colRoles: "الأدوار المحمولة", colScope: "نطاق البيانات (كما هو مخزَّن)",
      scopes: { "مفتّش": "تكليفاته", "مراجع م١": "المنطقة المُسندة", "مراجع م٢": "المنطقة المُسندة", "مشرف سير العمل": "نطاق خادمي", "مشرف أمني": "نطاق خادمي" },
      multiNote: "فيصل يحمل دورين. ما تسمح به هذه التركيبة فعليًا تفرضه سياسات RLS على الخادم — هذه الصفحة تسرد الحيازات ولا تُقيّم السياسات.",
      explT: "مُفسِّر الوصول الفعّال — اقتراح للقراءة فقط", explLbl: "اقتراح · لا يمنح أبدًا",
      explQ: "هل يمكن لفيصل اعتماد الزيارة VIS-2026-04182 (إجراء مراجع م٢)؟",
      explRows: [["الأدوار المحمولة", "مفتّش + مراجع م١ — ومراجع م٢ ليس بينها.", "proven"], ["ما يمكن لهذه الصفحة استنتاجه", "بناءً على الحيازات وحدها: الدور المطلوب للإجراء غير محمول.", "computed"], ["ما لا يمكنها استنتاجه", "الجواب النهائي هو تقييم سياسات RLS على الخادم. نصوص السياسات غير مستشهدة في هذه الصفحة — لا يمكن للمُفسِّر أن يكون قاطعًا دونها.", "blocked"]],
      explSeam: "HANDOFF_BLOCKED_RLS_CITATION",
      changeT: "تغيير الوصول", changeD: "لا يوجد سير عمل لتغيير الصلاحيات في هذه الشاشة. المنح والسحب يتمان اليوم عبر قاعدة البيانات/العمليات. سير عمل محكوم (مسودة ← اعتماد مشرف ثانٍ، فحوص فصل الواجبات، منع التصعيد الذاتي) عقدٌ خلفي مقترح لا قدرة حالية.",
      changeSeam: "NEEDS_APPROVED_CONTRACT — سير عمل تغيير الصلاحيات",
      fallbackT: "سلطة الاحتياط", fallbackD: "ما يحدث حين لا يطابق أي دور محدد (الاحتياط إلى المشرف) قرارٌ غير محسوم. حتى يُحسم ويُستشهد به، لا تدّعي هذه الصفحة شيئًا عن سلوك الاحتياط.",
      fallbackSeam: "BLOCKED_BY_DECISION — سلطة الاحتياط",
      rlsDenyT: "بعض السجلات غير مرئية", rlsDenyD: "تقيّد سياسات RLS أي ملفات يمكن لجلستك قراءتها. المستخدمون خارج نطاقك لا يُسردون بدل عرضهم جزئيًا.",
      emptyT: "لا أدوار في النطاق", emptyD: "لا تستطيع جلستك قراءة أي سجلات أدوار.", loading: "جارٍ تحميل حيازات الأدوار…" }
  };

  function holdings(t, lang, opts) {
    opts = opts || {};
    var rows = t.users.map(function (u) {
      return '<tr><td><div class="wf-obj"><span class="wf-obj__name">' + esc(u[0]) + '</span><span class="wf-obj__key">' + u[1] + '@mim.gov.sa</span></div></td>' +
        '<td><span style="display:flex;gap:6px;flex-wrap:wrap">' + u[2].map(function (r) { return C.loz(/Security|أمني/.test(r) ? "critical" : /Admin|مشرف/.test(r) ? "info" : "none", r); }).join("") + '</span></td>' +
        '<td class="cd-sub">' + u[2].map(function (r) { return esc(t.scopes[r] || "—"); }).join(" · ") + '</td></tr>';
    }).join("");
    return '<div class="m-panel"><div class="m-panel__head"><h4>' + esc(t.matrixT) + '</h4><span class="roro">👁 ' + esc(t.ro) + '</span></div>' +
      '<div class="ax-tablewrap" style="border:0"><table class="ax-table"><thead><tr><th>' + esc(t.colUser) + '</th><th>' + esc(t.colRoles) + '</th><th>' + esc(t.colScope) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="cd-sub">' + esc(t.multiNote) + '</p></div>';
  }

  function explainer(t, lang) {
    return '<div class="m-panel"><div class="m-panel__head"><h4>' + esc(t.explT) + '</h4><span class="nya__lbl">' + esc(t.explLbl) + '</span></div>' +
      '<p style="font:var(--ax-text-body-strong)">' + esc(t.explQ) + '</p>' +
      t.explRows.map(function (r) { return '<div class="rp-why"><span>' + (r[2] === "proven" ? "●" : r[2] === "computed" ? "◇" : "⛔") + '</span><span><b>' + esc(r[0]) + '</b> — ' + esc(r[1]) + '</span></div>'; }).join("") +
      '<span class="nya__seam">' + esc(t.explSeam) + '</span></div>';
  }

  function boundaries(t, lang) {
    return C.notYet(lang, t.changeT, t.changeD, t.changeSeam) + C.notYet(lang, t.fallbackT, t.fallbackD, t.fallbackSeam);
  }

  function frame(lang, t, main) {
    return C.frame(lang, C.nav(lang, t.group, [["◉", t.crumbs[2], true]]),
      C.pagehead(lang, { title: t.title, sub: t.sub, role: t.role, crumbs: t.crumbs, searchPh: t.searchPh }), main);
  }

  function grid(t, lang) {
    return '<div class="m-split"><div>' + holdings(t, lang, {}) + '</div><div style="display:flex;flex-direction:column;gap:16px">' + explainer(t, lang) + boundaries(t, lang) + '</div></div>';
  }

  function render(state, lang) {
    var t = L[lang];
    var body;
    if (state === "empty") body = C.content(C.stateEmpty(lang, "◉", t.emptyT, t.emptyD));
    else if (state === "loading") body = C.content(C.skeleton(lang, t.loading));
    else if (state === "unauthorized") body = C.content(C.stateUnauth(lang));
    else if (state === "offline") body = C.content(C.stateOffline(lang, "◉"));
    else if (state === "rls-scoped") body = C.content(C.banner("warning", "◒", t.rlsDenyT, t.rlsDenyD) + C.legend(lang) + grid(t, lang));
    else if (state === "explainer") body = C.content(C.legend(lang) + grid(t, lang));
    else /* view — primary */ body = C.content(C.legend(lang) + grid(t, lang));
    return frame(lang, t, body);
  }

  C.register("cd17", {
    id: "CD-017", screen: "SCR-ADM-090", title: { en: "Roles & permissions", ar: "الأدوار والصلاحيات" },
    states: [
      { id: "view", n: "S01", label: "Read-only holdings — primary" },
      { id: "explainer", n: "S02", label: "Explainer proposal — non-conclusive (outlier)" },
      { id: "rls-scoped", n: "S03", label: "RLS-scoped visibility" },
      { id: "empty", n: "S04", label: "Empty — nothing readable" },
      { id: "loading", n: "S05", label: "Loading" },
      { id: "unauthorized", n: "S06", label: "Unauthorized" },
      { id: "offline", n: "S07", label: "Offline" }
    ],
    outlier: "explainer",
    render: render
  });
})();
