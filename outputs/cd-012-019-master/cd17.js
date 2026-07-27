/* CD-017 · SCR-ADM-090 — Roles and permissions (matrix + effective-access explainer).
   rbac_matrix.csv + Supabase RLS are the authority (stated-by-contract). The
   simulator explains effective access; it never grants. Dangerous changes are
   visually heavy; everyday inspection reads are simple. */
(function () {
  "use strict";
  var C = window.CDM, esc = C.esc;

  var L = {
    en: { group: "Users & Roles", title: "Roles & permissions", sub: "Permission matrix + effective-access explainer: role, channel, action and data scope with segregation-of-duties warnings — RLS remains the authority",
      role: "Security Admin", crumbs: ["Admin", "Users & Roles", "Permissions"], searchPh: "Search roles, users, capabilities…",
      matrix: "Capability matrix", sim: "Can this user do this?", simTag: "explains, never grants",
      compare: "Compare roles", submit: "Submit change", approve: "Approve & publish", draftSave: "Save draft",
      roles: ["Inspector", "Reviewer L1", "Reviewer L2", "Workflow Admin", "Security Admin"],
      caps: [["Create visit", ["y", "n", "n", "n", "n"]], ["Submit visit", ["y", "n", "n", "n", "n"]], ["Review L1", ["n", "y", "n", "n", "n"]], ["Review L2 / approve", ["n", "n", "y", "n", "n"]], ["Publish workflow", ["n", "n", "n", "y", "n"]], ["Change permissions", ["n", "n", "n", "n", "y"]]],
      scopeNote: "Data scope: Inspector = own assignments · Reviewers = assigned region · Admins = server-scoped. Scope column derives from RLS policies (stated), shown per cell as R (region) / O (own) / ✦ (all).",
      simUser: "Faisal Al-Harbi — Inspector + Reviewer L1 (multi-role)", simQ: "Approve visit VIS-2026-04182 (Review L2)?",
      simVerdict: "DENIED", simAllow: "ALLOWED",
      simWhy: [["Role", "Faisal holds Inspector + Reviewer L1 — Review L2 is not among them.", "proven"], ["Scope", "Visit is in region RYD-02; Faisal's review scope is RYD-02 — scope would pass.", "proven"], ["Guard", "Canonical transition approve requires actor role Reviewer L2.", "proven"], ["RLS", "supabase policy review_l2_only denies UPDATE on reviews for this role set.", "computed"]],
      simRlsNote: "RLS policy names shown are illustrative until cited from migrations — HANDOFF_BLOCKED_RLS_CITATION.",
      conflictT: "Segregation-of-duties conflict", conflictD: "Draft grants Reviewer L1 + Reviewer L2 to the same role bundle — the same person could review their own L1 outcome. The conflicting cells are marked; submission is blocked until one grant is removed.",
      selfT: "Self-escalation blocked", selfD: "You cannot grant Change permissions to a role you hold. The cell is disabled for your session — a contract boundary, not a UI preference.",
      beyondT: "Grant beyond administrator authority", beyondD: "Granting server-role visibility to hidden destinations (Analytics, AI) is outside this screen's authority — those tabs stay hidden per the shell contract; the attempted grant is rejected with reference SHELL-V3.",
      draftT: "Draft permission change — not effective", draftD: "Draft grants affect nobody until approved & published by a different Security Admin (maker-checker). Effective access continues from the published matrix.",
      submittedT: "Change submitted — awaiting second admin", submittedD: "The draft is frozen for checker review. Diff: +1 grant, −1 grant, 1 scope change.",
      pubT: "Published matrix vNN is immutable", pubD: "Changes happen via a new draft. Every published matrix version is preserved for audit replay of past access decisions.",
      deniedT: "Effective access denied (simulator)", emptyT: "No roles defined", emptyD: "Roles arrive from the RBAC matrix; none are visible to your scope.",
      loading: "Loading permission matrix…", kRoles: "Roles", kCaps: "Capabilities", kConflicts: "SoD conflicts", kDraft: "Draft changes" },
    ar: { group: "المستخدمون والأدوار", title: "الأدوار والصلاحيات", sub: "مصفوفة الصلاحيات + مُفسِّر الوصول الفعّال: الدور والقناة والإجراء ونطاق البيانات مع تحذيرات فصل الواجبات — وتبقى سياسات RLS هي المرجع",
      role: "مشرف أمني", crumbs: ["الإدارة", "المستخدمون والأدوار", "الصلاحيات"], searchPh: "ابحث في الأدوار والمستخدمين والقدرات…",
      matrix: "مصفوفة القدرات", sim: "هل يستطيع هذا المستخدم فعل هذا؟", simTag: "يُفسِّر ولا يمنح أبدًا",
      compare: "مقارنة الأدوار", submit: "تقديم التغيير", approve: "اعتماد ونشر", draftSave: "حفظ المسودة",
      roles: ["مفتّش", "مراجع م١", "مراجع م٢", "مشرف سير العمل", "مشرف أمني"],
      caps: [["إنشاء زيارة", ["y", "n", "n", "n", "n"]], ["تقديم زيارة", ["y", "n", "n", "n", "n"]], ["مراجعة م١", ["n", "y", "n", "n", "n"]], ["مراجعة م٢ / اعتماد", ["n", "n", "y", "n", "n"]], ["نشر سير العمل", ["n", "n", "n", "y", "n"]], ["تغيير الصلاحيات", ["n", "n", "n", "n", "y"]]],
      scopeNote: "نطاق البيانات: المفتّش = تكليفاته · المراجعون = المنطقة المُسندة · المشرفون = نطاق خادمي. عمود النطاق مشتق من سياسات RLS (كما ورد)، ويُعرض لكل خلية: R (منطقة) / O (خاص) / ✦ (الكل).",
      simUser: "فيصل الحربي — مفتّش + مراجع م١ (متعدد الأدوار)", simQ: "اعتماد الزيارة VIS-2026-04182 (مراجعة م٢)؟",
      simVerdict: "مرفوض", simAllow: "مسموح",
      simWhy: [["الدور", "فيصل يحمل مفتّش + مراجع م١ — ومراجعة م٢ ليست بينهما.", "proven"], ["النطاق", "الزيارة في منطقة RYD-02؛ ونطاق مراجعة فيصل RYD-02 — كان النطاق سيمرّ.", "proven"], ["الحارس", "الانتقال المعتمد approve يتطلب دور مراجع م٢.", "proven"], ["RLS", "سياسة review_l2_only ترفض التعديل على المراجعات لهذه الأدوار.", "computed"]],
      simRlsNote: "أسماء سياسات RLS توضيحية حتى تُستشهد من ملفات الترحيل — HANDOFF_BLOCKED_RLS_CITATION.",
      conflictT: "تعارض فصل الواجبات", conflictD: "المسودة تمنح مراجع م١ + مراجع م٢ لنفس حزمة الأدوار — يمكن للشخص نفسه مراجعة نتيجته في م١. الخلايا المتعارضة معلَّمة؛ ويُحجب التقديم حتى يُزال أحد المنحين.",
      selfT: "التصعيد الذاتي محجوب", selfD: "لا يمكنك منح «تغيير الصلاحيات» لدور تحمله أنت. الخلية معطّلة لجلستك — حدّ تعاقدي لا تفضيل واجهة.",
      beyondT: "منح يتجاوز سلطة المشرف", beyondD: "منح رؤية وجهات مخفية (التحليلات، الذكاء الاصطناعي) خارج سلطة هذه الشاشة — تبقى تلك التبويبات مخفية وفق عقد الإطار؛ ويُرفض المنح بمرجع SHELL-V3.",
      draftT: "تغيير صلاحيات مسودة — غير نافذ", draftD: "منح المسودة لا يمس أحدًا حتى يعتمده وينشره مشرف أمني آخر (صانع/مدقّق). يستمر الوصول الفعّال من المصفوفة المنشورة.",
      submittedT: "التغيير مُقدَّم — بانتظار المشرف الثاني", submittedD: "المسودة مجمّدة لمراجعة المدقّق. الفرق: +1 منح، −1 منح، تغيير نطاق واحد.",
      pubT: "المصفوفة المنشورة غير قابلة للتغيير", pubD: "التغيير عبر مسودة جديدة. يُحفظ كل إصدار منشور لإعادة تدقيق قرارات الوصول السابقة.",
      deniedT: "الوصول الفعّال مرفوض (المُحاكي)", emptyT: "لا أدوار معرّفة", emptyD: "تأتي الأدوار من مصفوفة RBAC؛ ولا يظهر أي منها لنطاقك.",
      loading: "جارٍ تحميل مصفوفة الصلاحيات…", kRoles: "أدوار", kCaps: "قدرات", kConflicts: "تعارضات فصل واجبات", kDraft: "تغييرات مسودة" }
  };

  function matrix(t, opts) {
    opts = opts || {};
    var scopes = ["O", "R", "R", "✦", "✦"];
    return '<div class="m-panel"><div class="m-panel__head"><h4>' + esc(t.matrix) + '</h4>' + C.tt("proven", "rbac_matrix.csv (stated)") + '</div>' +
      '<div style="overflow-x:auto"><table class="rp-matrix"><thead><tr><th></th>' + t.roles.map(function (r) { return '<th scope="col">' + esc(r) + '</th>'; }).join("") + '</tr></thead><tbody>' +
      t.caps.map(function (row, ri) {
        return '<tr><th scope="row">' + esc(row[0]) + '</th>' + row[1].map(function (v, ci) {
          var conflict = opts.conflict && ri === 3 && ci === 1;
          var draftCell = opts.draft && ri === 4 && ci === 2;
          var selfBlock = opts.self && ri === 5 && ci === 4;
          var cls = conflict ? "rp-cell--conflict" : v === "y" ? "rp-cell--y" : "rp-cell--n";
          if (draftCell) cls += " rp-cell--draft";
          var txt = conflict ? "✕!" : v === "y" ? "✓ " + scopes[ci] : draftCell ? "+✓" : selfBlock ? "🔒" : "—";
          return '<td class="' + cls + '">' + txt + '</td>';
        }).join("") + '</tr>';
      }).join("") + '</tbody></table></div><p class="cd-sub">' + esc(t.scopeNote) + '</p></div>';
  }

  function simulator(t, allow) {
    return '<div class="m-panel"><div class="m-panel__head"><h4>' + esc(t.sim) + '</h4>' + C.tt("computed", t.simTag) + '</div>' +
      '<p class="cd-sub" style="font:var(--legacy-text-body)"><b>' + esc(t.simUser) + '</b><br>' + esc(t.simQ) + '</p>' +
      '<div class="rp-sim__verdict rp-sim__verdict--' + (allow ? "allow" : "deny") + '">' + (allow ? "✓ " + esc(t.simAllow) : "⛔ " + esc(t.simVerdict)) + '</div>' +
      t.simWhy.map(function (w) { return '<div class="rp-why"><span>' + (w[2] === "proven" ? "●" : "◇") + '</span><span><b>' + esc(w[0]) + '</b> — ' + esc(w[1]) + ' ' + C.tt(w[2], w[2] === "proven" ? "matrix" : "needs citation") + '</span></div>'; }).join("") +
      '<p class="cd-sub">' + esc(t.simRlsNote) + '</p></div>';
  }

  function bar(t, opts) {
    opts = opts || {};
    return '<div class="legacy-commandbar"><button class="legacy-btn legacy-btn--secondary">' + esc(t.compare) + '</button>' +
      '<button class="legacy-btn legacy-btn--secondary">' + esc(t.draftSave) + '</button>' +
      '<button class="legacy-btn legacy-btn--secondary"' + (opts.noSubmit ? ' disabled aria-disabled="true"' : '') + '>' + esc(t.submit) + '</button>' +
      '<button class="legacy-btn"' + (opts.noApprove ? ' disabled aria-disabled="true"' : '') + '>' + esc(t.approve) + '</button>' +
      '<span class="legacy-commandbar__spacer"></span>' + C.tt("proven", "maker-checker") + '</div>';
  }

  function grid(t, opts, allow) {
    return '<div class="m-split"><div>' + matrix(t, opts) + '</div><div style="display:flex;flex-direction:column;gap:16px">' + simulator(t, allow) +
      C.blocked("RLS / authority seams", [["RLS policy citations", "policy names pending migration citation", "computed", "HANDOFF_BLOCKED_RLS_CITATION"], ["Fallback-to-admin issue", "needs separate decision", "blocked", "HANDOFF_BLOCKED_ADMIN_FALLBACK"], ["Nav visibility sync", "server-role visibility is shell authority", "proven", "SHELL-V3"]]) + '</div></div>';
  }

  function frame(lang, t, main) {
    return C.frame(lang, C.nav(lang, t.group, [["◉", t.crumbs[2], true]]),
      C.pagehead(lang, { title: t.title, sub: t.sub, role: t.role, crumbs: t.crumbs, searchPh: t.searchPh }), main);
  }

  function render(state, lang) {
    var t = L[lang];
    var body;
    if (state === "empty") body = C.content(C.stateEmpty(lang, "◉", t.emptyT, t.emptyD));
    else if (state === "loading") body = C.content(C.skeleton(lang, t.loading));
    else if (state === "unauthorized") body = C.content(C.stateUnauth(lang));
    else if (state === "offline") body = C.content(C.stateOffline(lang, "◉"));
    else if (state === "conflict") body = C.content(bar(t, { noSubmit: true, noApprove: true }) + C.guard(t.conflictT, t.conflictD) + C.legend(lang) + grid(t, { conflict: true, draft: true }));
    else if (state === "self-escalation") body = C.content(bar(t, { noApprove: true }) + C.guard(t.selfT, t.selfD) + C.legend(lang) + grid(t, { self: true }));
    else if (state === "beyond-authority") body = C.content(bar(t, { noSubmit: true, noApprove: true }) + C.guard(t.beyondT, t.beyondD) + C.legend(lang) + grid(t, {}));
    else if (state === "draft") body = C.content(bar(t, { noApprove: true }) + C.banner("warning", "▣", t.draftT, t.draftD) + C.legend(lang) + grid(t, { draft: true }));
    else if (state === "submitted") body = C.content(bar(t, { noSubmit: true }) + C.banner("immutable", "⟳", t.submittedT, t.submittedD) + C.legend(lang) + grid(t, { draft: true }));
    else if (state === "published") body = C.content(bar(t, { noApprove: true }) + C.banner("immutable", "◆", t.pubT, t.pubD) + C.legend(lang) + grid(t, {}));
    else if (state === "denied") body = C.content(bar(t, {}) + C.legend(lang) + grid(t, {}, false));
    else /* view — primary */ body = C.content(bar(t, {}) +
      C.kpis([{ v: 5, l: t.kRoles, tier: "proven" }, { v: 6, l: t.kCaps, tier: "proven" }, { v: 0, l: t.kConflicts, tier: "proven" }, { v: 0, l: t.kDraft, tier: "proven" }]) +
      C.legend(lang) + grid(t, {}, false));
    return frame(lang, t, body);
  }

  C.register("cd17", {
    id: "CD-017", screen: "SCR-ADM-090", title: { en: "Roles & permissions", ar: "الأدوار والصلاحيات" },
    states: [
      { id: "view", n: "S01", label: "View — primary (matrix + simulator)" },
      { id: "conflict", n: "S02", label: "SoD conflict — submission blocked (outlier)" },
      { id: "self-escalation", n: "S03", label: "Self-escalation blocked" },
      { id: "beyond-authority", n: "S04", label: "Grant beyond authority — rejected" },
      { id: "draft", n: "S05", label: "Draft change — not effective" },
      { id: "submitted", n: "S06", label: "Submitted — awaiting second admin" },
      { id: "published", n: "S07", label: "Published matrix — immutable" },
      { id: "denied", n: "S08", label: "Effective-access denied (simulator)" },
      { id: "empty", n: "S09", label: "Empty — no roles in scope" },
      { id: "loading", n: "S10", label: "Loading" },
      { id: "unauthorized", n: "S11", label: "Unauthorized" },
      { id: "offline", n: "S12", label: "Offline" }
    ],
    outlier: "conflict",
    render: render
  });
})();
