/* CD-012 R2 · SCR-ADM-050 — Workflow library render engine (window.CD12R2).
   ------------------------------------------------------------------------------
   Grounded on the runtime facts stated in the R2 correction prompt (no working
   tree was readable this session — see source-receipt.md):
     • route reads config_versions WHERE engine='workflow'; maker/checker names
       resolve from profiles;
     • the only actions are proposeWorkflowDraft, saveWorkflowDraft,
       approvePublishWorkflow; publish = draft -> published; maker-checker &
       immutability are contract/DB boundaries.
   Truth tiers are explicit in the UI:
     PROVEN   = version / status / maker / checker / dates / transition lineage (payload)
     COMPUTED = needs a defined source/algorithm (graph reachability etc.)
     BLOCKED  = test health, in-flight runtime cases, cycle/unreachable results,
                stale detection, publish notifications — NEVER rendered as live truth. */
(function () {
  "use strict";

  var AR = {
    dir: "rtl",
    brand: "الإدارة", group: "إعداد سير العمل",
    crumb1: "الإدارة", crumb2: "إعداد سير العمل", crumb3: "مكتبة سير العمل",
    title: "مكتبة سير العمل", sub: "حَوكمة إصدارات سير العمل (صانع/مدقّق) — الإصدار والحالة والصانع والمدقّق والسياق الفعّال وبنية الانتقالات، مقروءة قبل الفتح أو التعديل",
    modeLib: "المكتبة", modeDesigner: "المُصمّم",
    searchPh: "ابحث في تعريفات سير العمل…",
    fStatus: "الحالة", fDraft: "مسودة قيد الاعتماد", fMine: "من إنشائي", fClear: "مسح",
    kDefs: "التعريفات", kPublished: "منشورة وفعّالة", kDrafts: "مسودات بانتظار الاعتماد", kSuper: "إصدارات مُستبدَلة",
    colObj: "سير العمل", colLin: "سلسلة الإصدارات", colEff: "الإصدار الفعّال", colMC: "الصانع / المدقّق", colStatus: "الحالة", colAct: "إجراءات",
    open: "فتح", propose: "اقتراح مسودة", save: "حفظ المسودة", approve: "اعتماد ونشر", newWf: "سير عمل جديد",
    stPublished: "منشور", stDraft: "مسودة", stSuper: "مُستبدَل", stReview: "بانتظار الاعتماد",
    maker: "الصانع", checker: "المدقّق", proposed: "اقترحه", approvedBy: "اعتمده", pending: "بانتظار مدقّق",
    ver: "إصدار", effFrom: "فعّال منذ", noDraft: "لا مسودة قيد الاعتماد",
    legendTitle: "مستويات الحقيقة", legProven: "مُثبت (من البيانات)", legComputed: "محسوب (يلزمه مصدر)", legBlocked: "محجوب (لا يُعرض كحقيقة)",
    detailProv: "سِجل الحَوكمة (config_versions)", detailHealth: "مدخلات السلامة — محجوبة", detailClose: "إغلاق",
    blkTests: "سلامة الاختبارات", blkTestsPh: "لا يوجد مخزن نتائج اختبارات مُثبت", 
    blkCases: "الحالات الجارية المرتبطة", blkCasesPh: "لا يوجد عدّ حالات جارية مُثبت",
    blkGraph: "قابلية الوصول / الدورات في الرسم", blkGraphPh: "يلزمه خوارزمية/مصدر محدّد قبل العرض",
    blkStale: "كشف التغيّر المتزامن", blkStalePh: "لا توجد آلية كشف قِدَم مُثبتة",
    sepTitle: "لا يمكنك الاعتماد — فصل الواجبات", sepD: "أنت صاحب هذه المسودة (الصانع). اعتماد/نشر المسودة يتطلب مدقّقًا مختلفًا — حدّ تعاقدي على قاعدة البيانات.",
    immTitle: "الإصدار المنشور غير قابل للتغيير", immD: "الإصدار ٢ منشور — لا يُعدَّل في مكانه؛ التغيير يتم باقتراح مسودة جديدة (اقتراح مسودة) ثم اعتمادها.",
    inuseBanner: "«قيد الاستخدام» مدخل سلامة محجوب: لا يوجد عدّ حالات جارية مُثبت في المصدر، فلا يُعرض كرقم ولا كمانع نشر.",
    empty: "لا توجد تعريفات سير عمل", emptySub: "اقترح أول مسودة سير عمل لتبدأ.",
    unauthT: "خارج نطاق الصلاحية", unauthD: "دورك لا يملك صلاحية حَوكمة سير العمل. تُطبَّق سياسات RLS على الخادم — لا يُعرض أي إجراء تعديل.",
    offlineT: "غير متصل", offlineD: "المكتبة تُقرأ من الخادم فقط ولا تتوفر دون اتصال. القيم آخر ما تم جلبه.",
    valTitle: "لا يمكن حفظ/اقتراح المسودة", valD: "«حفظ المسودة» يرفض التعريف حتى تُستوفى الحقول المطلوبة. هذه عوائق تحقّق من المدخلات، وليست فحص سلامة رسم محجوب.",
    valItems: ["اسم سير العمل مطلوب.", "يجب تحديد حالة ابتدائية واحدة على الأقل.", "لكل انتقال شرط مُعرّف."],
    staleT: "كشف القِدَم محجوب", staleD: "لا توجد آلية كشف تغيّر متزامن مُثبتة، لذا لا نزعم اكتشاف القِدَم. السلوك الآمن: إعادة الجلب عند العودة للتبويب.",
    reload: "إعادة الجلب", loadingLbl: "جارٍ تحميل مكتبة سير العمل…",
    account: "نورة القحطاني", role: "مشرف سير العمل (مدقّق)", you: "أنت"
  };
  var EN = {
    dir: "ltr",
    brand: "Admin", group: "Workflow Configuration",
    crumb1: "Admin", crumb2: "Workflow Configuration", crumb3: "Workflow library",
    title: "Workflow library", sub: "Maker–checker version governance on config_versions — version, status, maker, checker, effective context and transition structure, legible before you open or edit",
    modeLib: "Library", modeDesigner: "Designer",
    searchPh: "Search workflow definitions…",
    fStatus: "Status", fDraft: "Draft awaiting approval", fMine: "Proposed by me", fClear: "Clear",
    kDefs: "Definitions", kPublished: "Published & active", kDrafts: "Drafts awaiting approval", kSuper: "Superseded versions",
    colObj: "Workflow", colLin: "Version lineage", colEff: "Active version", colMC: "Maker / Checker", colStatus: "Status", colAct: "Actions",
    open: "Open", propose: "Propose draft", save: "Save draft", approve: "Approve & publish", newWf: "New workflow",
    stPublished: "Published", stDraft: "Draft", stSuper: "Superseded", stReview: "Awaiting approval",
    maker: "Maker", checker: "Checker", proposed: "Proposed by", approvedBy: "Approved by", pending: "awaiting checker",
    ver: "version", effFrom: "effective from", noDraft: "no draft in flight",
    legendTitle: "Truth tiers", legProven: "Proven (from payload)", legComputed: "Computed (needs source)", legBlocked: "Blocked (not shown as truth)",
    detailProv: "Governance record (config_versions)", detailHealth: "Health inputs — blocked", detailClose: "Close",
    blkTests: "Test health", blkTestsPh: "no test-run store located",
    blkCases: "In-flight runtime cases", blkCasesPh: "no runtime-case count located",
    blkGraph: "Graph reachability / cycles", blkGraphPh: "needs a defined algorithm/source before display",
    blkStale: "Concurrent-change detection", blkStalePh: "no stale-detection mechanism located",
    sepTitle: "You cannot approve — separation of duties", sepD: "You proposed this draft (the maker). Approving/publishing requires a different checker — a contract/DB boundary.",
    immTitle: "Published version is immutable", immD: "v2 is published — it is not edited in place; change happens by proposing a new draft (Propose draft) and approving it.",
    inuseBanner: "“In use” is a blocked health input: no in-flight runtime-case count is established in source, so it is shown neither as a number nor as a publish guard.",
    empty: "No workflow definitions", emptySub: "Propose the first workflow draft to get started.",
    unauthT: "Out of scope", unauthD: "Your role cannot govern workflows. RLS is enforced server-side — no edit action is rendered.",
    offlineT: "Offline", offlineD: "The library is a server-only read and is unavailable offline. Values shown are last fetched.",
    valTitle: "Cannot save / propose draft", valD: "saveWorkflowDraft rejects the definition until required fields are present. These are input-validation blockers — not a blocked graph-health check.",
    valItems: ["Workflow name is required.", "At least one initial state must be set.", "Every transition needs a defined condition."],
    staleT: "Stale detection is blocked", staleD: "No concurrent-change detection is established in source, so staleness is not claimed. Safe behavior: re-fetch on tab focus.",
    reload: "Re-fetch", loadingLbl: "Loading workflow library…",
    account: "Noura Al-Qahtani", role: "Workflow Admin (checker)", you: "you"
  };

  function esc(s){ return String(s==null?"":s).replace(/[&<>]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;"}[c];}); }

  var NAMES = {
    noura:{en:"Noura Al-Qahtani",ar:"نورة القحطاني"},
    faisal:{en:"Faisal Al-Harbi",ar:"فيصل الحربي"},
    sara:{en:"Sara Al-Otaibi",ar:"سارة العتيبي"},
    khalid:{en:"Khalid Al-Dossari",ar:"خالد الدوسري"},
    omar:{en:"Omar Al-Ghamdi",ar:"عمر الغامدي"}
  };

  /* ---- fixture rows: workflow configs (engine='workflow') w/ config_versions ---- */
  function rows(){
    return [
      { key:"FAC_REGISTRATION_REVIEW", name:{en:"Factory registration review",ar:"مراجعة تسجيل المنشأة"},
        versions:[{v:1,status:"superseded",maker:"faisal",checker:"noura",date:"2025-09-10"},
                  {v:2,status:"superseded",maker:"faisal",checker:"noura",date:"2025-12-01"},
                  {v:3,status:"superseded",maker:"faisal",checker:"khalid",date:"2026-02-18"},
                  {v:4,status:"published",maker:"faisal",checker:"noura",date:"2026-05-01"}] },
      { key:"INSPECTION_VISIT_LIFECYCLE", name:{en:"Inspection visit lifecycle",ar:"دورة حياة زيارة التفتيش"},
        versions:[{v:6,status:"superseded",maker:"sara",checker:"khalid",date:"2026-03-04"},
                  {v:7,status:"published",maker:"sara",checker:"khalid",date:"2026-06-15"},
                  {v:8,status:"draft",maker:"sara",checker:null,date:"2026-07-12"}] },
      { key:"EVIDENCE_QUARANTINE_ESCALATION", name:{en:"Evidence quarantine escalation",ar:"تصعيد حجز الأدلة"},
        versions:[{v:1,status:"published",maker:"khalid",checker:"faisal",date:"2026-01-20"},
                  {v:2,status:"draft",maker:"noura",checker:null,date:"2026-07-14"}], outlier:true },
      { key:"LICENSE_RENEWAL", name:{en:"License renewal workflow",ar:"سير عمل تجديد الترخيص"},
        versions:[{v:2,status:"published",maker:"omar",checker:"noura",date:"2026-04-02"},
                  {v:3,status:"draft",maker:"omar",checker:null,date:"2026-07-13"}] },
      { key:"VIOLATION_REMEDIATION", name:{en:"Violation remediation",ar:"معالجة المخالفات"},
        versions:[{v:7,status:"superseded",maker:"khalid",checker:"noura",date:"2025-10-11"},
                  {v:8,status:"superseded",maker:"khalid",checker:"faisal",date:"2026-01-30"},
                  {v:9,status:"published",maker:"khalid",checker:"noura",date:"2026-04-10"}] },
      { key:"SAMPLING_DISPATCH", name:{en:"Sampling dispatch",ar:"إرسال العينات"},
        versions:[{v:1,status:"superseded",maker:"omar",checker:"faisal",date:"2025-08-02"},
                  {v:2,status:"published",maker:"omar",checker:"khalid",date:"2025-11-02"}] }
    ];
  }
  var CURRENT_USER = "noura";

  function nm(key,lang){ return NAMES[key]?esc(NAMES[key][lang]):"—"; }
  function draftOf(r){ return r.versions.filter(function(v){return v.status==="draft";})[0]||null; }
  function publishedOf(r){ return r.versions.filter(function(v){return v.status==="published";}).slice(-1)[0]||null; }

  /* version-lineage signature (PROVEN — config_versions) */
  function lineage(vs, big){
    var r=big?9:6, gap=big?52:30, padX=big?14:10, y=big?24:16, h=big?52:32;
    var xs=vs.map(function(_,i){return padX+i*gap;});
    var w=padX*2+(vs.length-1)*gap;
    var parts=[];
    for(var i=0;i<vs.length-1;i++){ parts.push('<line class="wf-lin__edge" x1="'+(xs[i]+r)+'" y1="'+y+'" x2="'+(xs[i+1]-r)+'" y2="'+y+'"/>'); }
    vs.forEach(function(v,i){
      parts.push('<circle class="wf-lin__node wf-lin__node--'+v.status+'" cx="'+xs[i]+'" cy="'+y+'" r="'+r+'"/>');
      if(v.status==="published") parts.push('<circle class="wf-lin__ring" cx="'+xs[i]+'" cy="'+y+'" r="'+(r+3)+'"/>');
      parts.push('<text class="wf-lin__vlab" x="'+xs[i]+'" y="'+(y+(big?20:14))+'" text-anchor="middle">v'+v.v+'</text>');
    });
    return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="version lineage">'+parts.join("")+'</svg>';
  }

  function loz(status,t){
    var m={ published:["success",t.stPublished,"◆"], draft:["warning",t.stReview,"▣"], superseded:["",t.stSuper,"▲"] };
    var s=m[status]||m.draft;
    return '<span class="ax-lozenge ax-lozenge--sync'+(s[0]?" ax-lozenge--"+s[0]:"")+'">'+s[1]+'</span>';
  }

  function mcCell(r,t,lang){
    var pub=publishedOf(r), d=draftOf(r);
    var out='<div class="wf-mc">';
    if(pub) out+='<div class="wf-mc__row"><span class="wf-mc__role">'+t.approvedBy+'</span><span class="wf-mc__name">'+nm(pub.checker,lang)+'</span></div>';
    if(d) out+='<div class="wf-mc__row"><span class="wf-mc__role">'+t.proposed+' v'+d.v+'</span><span class="wf-mc__name">'+nm(d.maker,lang)+(d.maker===CURRENT_USER?' <span class="cd-you">'+t.you+'</span>':'')+'</span></div>';
    else out+='<div class="wf-mc__row wf-mc__name" style="color:var(--ax-color-text-secondary);font-weight:400">'+t.noDraft+'</div>';
    return out+'</div>';
  }

  function actions(r,t){
    var d=draftOf(r);
    var out='<div class="wf-rowact"><button class="ax-btn ax-btn--secondary ax-btn--sm">'+t.open+'</button>';
    if(d){
      var ownDraft=d.maker===CURRENT_USER;
      out+='<button class="ax-btn ax-btn--sm"'+(ownDraft?' aria-disabled="true" disabled':'')+'>'+t.approve+'</button>';
    } else {
      out+='<button class="ax-btn ax-btn--subtle ax-btn--sm">'+t.propose+'</button>';
    }
    return out+'</div>';
  }

  function nav(t,lang){
    function item(icon,label,cur){ return '<a class="ax-nav-item" href="#"'+(cur?' aria-current="page"':'')+'><span class="ax-nav-icon" aria-hidden="true">'+icon+'</span><span class="ax-nav-label">'+label+'</span></a>'; }
    return '<nav class="ax-shell__nav" aria-label="Primary">'+
      '<div class="ax-shell__brand"><span class="ax-shell__brand-mark" aria-hidden="true"><svg width="32" height="32" viewBox="0 0 32 32"><defs><linearGradient id="pm2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D946EF"/><stop offset="1" stop-color="#7C6CFF"/></linearGradient></defs><path d="M16 3 L28 24 L4 24 Z" fill="url(#pm2)"/><path d="M16 3 L16 24 L4 24 Z" fill="#0B0B14" opacity=".22"/></svg></span>'+
        '<span class="ax-shell__brand-lockup"><span class="ax-shell__brand-wordmark">صقيل</span></span>'+
        '<button class="ax-shell__close" aria-label="Close">×</button></div>'+
      '<div class="ax-shell__groups">'+
        '<div class="ax-nav-group"><button class="ax-nav-group__trigger" aria-expanded="true">'+(lang==="ar"?"العمليات":"Operations")+'<span class="ax-nav-group__chevron">▾</span></button>'+
          item("◱",(lang==="ar"?"مركز العمليات":"Operations centre"))+item("▤",(lang==="ar"?"الزيارات":"Visits"))+'</div>'+
        '<div class="ax-nav-group"><button class="ax-nav-group__trigger" aria-expanded="true">'+t.group+'<span class="ax-nav-group__chevron">▾</span></button>'+
          item("⚙",t.crumb3,true)+item("▦",(lang==="ar"?"القواعد":"Rules"))+item("◈",(lang==="ar"?"الحزم":"Packages"))+'</div>'+
      '</div>'+
      '<button class="ax-shell__collapse"><span>«</span><span class="ax-nav-label">'+(lang==="ar"?"طيّ":"Collapse")+'</span></button>'+
    '</nav>';
  }

  function pagehead(t,lang){
    return '<header class="ax-pagehead">'+
      '<div class="ax-pagehead__topbar">'+
        '<button class="ax-shell__menu ax-topbar-icon" aria-label="Menu">☰</button>'+
        '<div class="ax-shell-search"><span class="ax-shell-search__icon">⌕</span><input placeholder="'+t.searchPh+'" aria-label="'+t.searchPh+'"></div>'+
        '<div class="ax-pagehead__actions">'+
          '<span class="ax-sync ax-sync--synced">'+(lang==="ar"?"متزامن":"Synced")+'</span>'+
          '<button class="ax-topbar-icon" aria-label="Notifications">◔</button>'+
          '<div class="ax-shell-account"><button class="ax-shell-account__trigger"><span class="ax-shell-account__avatar">NA</span>'+
            '<span class="ax-shell-account__identity"><strong>'+t.account+'</strong><small>'+t.role+'</small></span></button></div>'+
        '</div>'+
      '</div>'+
      '<div class="ax-pagehead__row">'+
        '<div class="cd-ctx">'+
          '<ol class="ax-breadcrumb"><li>'+t.crumb1+'</li><li>'+t.crumb2+'</li><li>'+t.crumb3+'</li></ol>'+
          '<div class="ax-pagehead__context"><h1 class="cd-ctx__id" style="font:var(--ax-text-title)">'+t.title+'</h1></div>'+
          '<p class="cd-opnote">'+t.sub+'</p>'+
        '</div>'+
        '<div class="wf-mode" role="group" aria-label="Mode"><a href="#" aria-current="page">'+t.modeLib+'</a><a href="#">'+t.modeDesigner+'</a></div>'+
      '</div>'+
    '</header>';
  }

  function legend(t){
    return '<div class="tt-legend"><b>'+t.legendTitle+':</b>'+
      '<span class="tt-tag tt-tag--proven">'+t.legProven+'</span>'+
      '<span class="tt-tag tt-tag--computed">'+t.legComputed+'</span>'+
      '<span class="tt-tag tt-tag--blocked">'+t.legBlocked+'</span></div>';
  }

  function commandbar(t){
    return '<div class="ax-commandbar">'+
      '<button class="ax-filterchip is-active">'+t.fStatus+': '+t.stPublished+'</button>'+
      '<button class="ax-filterchip">'+t.fDraft+'</button>'+
      '<button class="ax-filterchip">'+t.fMine+'</button>'+
      '<button class="ax-btn ax-btn--subtle ax-btn--sm">'+t.fClear+'</button>'+
      '<span class="ax-commandbar__spacer"></span>'+
      '<button class="ax-btn">＋ '+t.newWf+'</button>'+
    '</div>';
  }

  function kpis(t){
    return '<div class="wf-kpis">'+
      '<div class="ax-surface wf-kpi"><span class="wf-kpi__v ax-numeric">6</span><span class="wf-kpi__l">'+t.kDefs+'</span><span class="wf-kpi__s"><span class="tt-tag tt-tag--proven">payload</span></span></div>'+
      '<div class="ax-surface wf-kpi"><span class="wf-kpi__v ax-numeric">6</span><span class="wf-kpi__l">'+t.kPublished+'</span><span class="wf-kpi__s"><span class="tt-tag tt-tag--proven">payload</span></span></div>'+
      '<div class="ax-surface wf-kpi"><span class="wf-kpi__v ax-numeric">3</span><span class="wf-kpi__l">'+t.kDrafts+'</span><span class="wf-kpi__s"><span class="tt-tag tt-tag--proven">payload</span></span></div>'+
      '<div class="ax-surface wf-kpi"><span class="wf-kpi__v ax-numeric">6</span><span class="wf-kpi__l">'+t.kSuper+'</span><span class="wf-kpi__s"><span class="tt-tag tt-tag--proven">payload</span></span></div>'+
    '</div>';
  }

  function blockedPanel(t){
    function li(label,ph,tier,id){ return '<li><div class="wf-blocked__label"><span>'+label+'</span><span class="tt-tag tt-tag--'+tier+'">'+id+'</span></div><span class="wf-ph">'+ph+'</span></li>'; }
    return '<div class="wf-blocked"><div class="wf-blocked__head"><span>⛔</span><b>'+t.detailHealth+'</b></div><ul>'+
      li(t.blkTests,t.blkTestsPh,"blocked","HANDOFF_BLOCKED_TEST_STORE")+
      li(t.blkCases,t.blkCasesPh,"blocked","HANDOFF_BLOCKED_RUNTIME_CASE_READ")+
      li(t.blkGraph,t.blkGraphPh,"computed","HANDOFF_BLOCKED_GRAPH_ANALYSIS")+
      li(t.blkStale,t.blkStalePh,"blocked","HANDOFF_BLOCKED_STALE_CONTRACT")+
    '</ul></div>';
  }

  function provList(r,t,lang){
    var out='<ul class="wf-prov">';
    r.versions.slice().reverse().forEach(function(v){
      var cls=v.status==="superseded"?" is-super":v.status==="draft"?" is-draft":"";
      var who = v.status==="draft"
        ? t.proposed+' '+nm(v.maker,lang)+(v.maker===CURRENT_USER?' ('+t.you+')':'')+' · '+t.pending
        : t.proposed+' '+nm(v.maker,lang)+' · '+t.approvedBy+' '+nm(v.checker,lang);
      out+='<li class="'+cls.trim()+'"><div class="wf-prov__t"><span class="ax-version">v'+v.v+'</span>'+loz(v.status,t)+'<span class="wf-prov__m">'+v.date+'</span></div><span class="wf-prov__m">'+who+'</span></li>';
    });
    return out+'</ul>';
  }

  function detailRow(r,t,lang,opts){
    opts=opts||{};
    var d=draftOf(r), pub=publishedOf(r);
    var guard = (opts.sep && d)?'<div class="wf-guard"><span class="wf-guard__g">⛔</span><span class="wf-guard__t"><b>'+t.sepTitle+'</b>'+t.sepD+'</span></div>':'';
    var imm = opts.imm?'<div class="ax-banner ax-banner--immutable"><div><strong>'+t.immTitle+'</strong><div class="cd-sub">'+t.immD+'</div></div></div>':'';
    return '<tr class="wf-detail"><td colspan="6"><div class="wf-detailpad"><div class="wf-detail__grid">'+
      '<div class="wf-card">'+
        '<div class="wf-card__head"><h4>'+t.detailProv+'</h4><span class="tt-tag tt-tag--proven">config_versions</span></div>'+
        '<div class="wf-lin" style="align-self:flex-start">'+lineage(r.versions,true)+'</div>'+
        provList(r,t,lang)+
      '</div>'+
      '<div style="display:flex;flex-direction:column;gap:12px">'+guard+imm+blockedPanel(t)+'</div>'+
    '</div></div></td></tr>';
  }

  function table(t,lang,expandId,expandOpts){
    var rs=rows();
    var head='<div class="ax-tablewrap"><table class="ax-table" role="grid"><thead><tr>'+
      '<th>'+t.colObj+'</th><th>'+t.colLin+'</th><th>'+t.colEff+'</th><th>'+t.colMC+'</th><th>'+t.colStatus+'</th><th class="wf-actcell">'+t.colAct+'</th></tr></thead><tbody>';
    var body=rs.map(function(r){
      var d=draftOf(r), pub=publishedOf(r);
      var rowStatus = d?"draft":(pub?"published":"superseded");
      var eff = pub?('<span class="wf-eff">v'+pub.v+' · '+pub.date+'</span>'):'<span class="wf-eff wf-eff--none">—</span>';
      var tr='<tr'+(r.key===expandId?' class="is-expanded" aria-selected="true"':'')+'>'+
        '<td><div class="wf-obj"><span class="wf-obj__name">'+esc(r.name[lang])+'</span><span class="wf-obj__key">'+r.key+'</span></div></td>'+
        '<td><div class="wf-linwrap"><span class="wf-lin">'+lineage(r.versions,false)+'</span></div></td>'+
        '<td>'+eff+'</td>'+
        '<td>'+mcCell(r,t,lang)+'</td>'+
        '<td>'+loz(rowStatus,t)+'</td>'+
        '<td class="wf-actcell">'+actions(r,t)+'</td>'+
      '</tr>';
      if(r.key===expandId) tr+=detailRow(r,t,lang,expandOpts);
      return tr;
    }).join("");
    return head+body+'</tbody></table></div>';
  }

  function content(inner){ return '<div class="ax-content">'+inner+'</div>'; }

  function main(state,t,lang){
    if(state==="loading"){
      var sk=function(w){return '<div class="ax-skeleton" style="block-size:16px;inline-size:'+w+'"></div>';};
      return content(commandbar(t)+'<div class="wf-kpis">'+[1,2,3,4].map(function(){return '<div class="ax-surface wf-kpi">'+sk("55%")+'<div style="height:8px"></div>'+sk("80%")+'</div>';}).join("")+'</div>'+
        '<div class="ax-tablewrap" aria-busy="true"><div style="padding:20px;display:flex;flex-direction:column;gap:16px">'+[1,2,3,4,5].map(function(){return '<div style="display:flex;gap:24px;align-items:center">'+sk("22%")+sk("14%")+sk("14%")+sk("18%")+sk("10%")+'</div>';}).join("")+'</div></div>'+
        '<p class="cd-sub" role="status">'+t.loadingLbl+'</p>');
    }
    if(state==="empty") return content(commandbar(t)+'<div class="ax-surface ax-state"><div class="ax-state__glyph">⚙</div><h4>'+t.empty+'</h4><p>'+t.emptySub+'</p><button class="ax-btn">＋ '+t.newWf+'</button></div>');
    if(state==="unauthorized") return content('<div class="ax-surface ax-permission ax-state"><div class="ax-state__glyph">🔒</div><h4>'+t.unauthT+'</h4><p style="max-inline-size:54ch">'+t.unauthD+'</p></div>');
    if(state==="offline") return content('<div class="ax-banner ax-banner--warning"><span>⛔</span><div><strong>'+t.offlineT+'</strong><div class="cd-sub">'+t.offlineD+'</div></div></div>'+legend(t)+'<div class="ax-surface ax-state"><div class="ax-state__glyph" style="opacity:.5">⚙</div><p class="cd-sub">'+t.offlineD+'</p></div>');
    if(state==="stale") return content('<div class="ax-banner ax-banner--warning"><span>⟳</span><div><strong>'+t.staleT+'</strong><div class="cd-sub">'+t.staleD+'</div></div><button class="ax-btn ax-btn--secondary ax-btn--sm" style="margin-inline-start:auto">'+t.reload+'</button></div>'+legend(t)+kpis(t)+table(t,lang,null));
    if(state==="validation") return content('<div class="ax-validation"><strong style="font:var(--ax-text-body-strong)">'+t.valTitle+'</strong><div class="cd-sub" style="margin-block:4px">'+t.valD+'</div><ul>'+t.valItems.map(function(x){return '<li>'+x+'</li>';}).join("")+'</ul></div>'+legend(t)+kpis(t)+table(t,lang,"EVIDENCE_QUARANTINE_ESCALATION"));
    if(state==="draft") return content(commandbar(t)+legend(t)+kpis(t)+table(t,lang,"LICENSE_RENEWAL"));
    if(state==="outlier") return content(legend(t)+kpis(t)+table(t,lang,"EVIDENCE_QUARANTINE_ESCALATION",{sep:true}));
    if(state==="submitted") return content(legend(t)+kpis(t)+table(t,lang,"LICENSE_RENEWAL",{imm:true}));
    if(state==="superseded") return content('<div class="ax-commandbar"><button class="ax-filterchip is-active">'+t.fStatus+': '+t.stSuper+'</button><span class="ax-commandbar__spacer"></span></div>'+legend(t)+table(t,lang,"VIOLATION_REMEDIATION"));
    if(state==="in-use") return content('<div class="ax-banner"><span>ℹ</span><div class="cd-sub">'+t.inuseBanner+'</div></div>'+legend(t)+kpis(t)+table(t,lang,"INSPECTION_VISIT_LIFECYCLE"));

    if(state==="hyp-b"){
      var rs=rows();
      function card(r){
        var d=draftOf(r),pub=publishedOf(r);
        return '<div class="wf-card" style="gap:8px"><span class="wf-obj__name">'+esc(r.name[lang])+'</span><span class="wf-obj__key">'+r.key+'</span>'+
          '<span class="wf-lin" style="align-self:flex-start">'+lineage(r.versions,false)+'</span>'+mcCell(r,t,lang)+actions(r,t)+'</div>';
      }
      var colD=rs.filter(function(r){return draftOf(r);}), colP=rs.filter(function(r){return !draftOf(r)&&publishedOf(r);});
      var colS=rs.filter(function(r){return r.versions.some(function(v){return v.status==="superseded";});});
      function col(title,items,tone){ return '<div style="display:flex;flex-direction:column;gap:12px;min-inline-size:0"><div class="cd-sectionhead"><h4>'+title+' <span class="ax-badge">'+items.length+'</span></h4></div>'+items.map(card).join("")+'</div>'; }
      return content('<div class="ax-banner"><span>◇</span><div class="cd-sub"><b>HYP-B — '+(lang==="ar"?"لوحة طابور الاعتماد (بديل غير مُختار)":"Approval-queue board (alternative, not selected)")+'</b></div></div>'+legend(t)+
        '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px">'+
        col(t.stReview,colD)+col(t.stPublished,colP)+col(t.stSuper,colS)+'</div>');
    }
    if(state==="hyp-c"){
      var rs2=rows(); var focus=rs2[1];
      var idx=rs2.map(function(r){var on=r.key===focus.key; return '<a href="#" class="ax-nav-item"'+(on?' aria-current="page"':'')+' style="min-block-size:40px"><span class="ax-nav-label">'+esc(r.name[lang])+'</span></a>';}).join("");
      return content('<div class="ax-banner"><span>◇</span><div class="cd-sub"><b>HYP-C — '+(lang==="ar"?"خط زمني للإصدارات لكل سير عمل (بديل غير مُختار)":"Per-workflow version timeline (alternative, not selected)")+'</b></div></div>'+legend(t)+
        '<div style="display:grid;grid-template-columns:300px minmax(0,1fr);gap:24px">'+
        '<div class="ax-surface" style="padding:12px;display:flex;flex-direction:column;gap:4px">'+idx+'</div>'+
        '<div class="wf-card"><div class="wf-card__head"><h4>'+esc(focus.name[lang])+' · '+focus.key+'</h4><span class="tt-tag tt-tag--proven">config_versions</span></div>'+
        '<div class="wf-lin" style="align-self:flex-start">'+lineage(focus.versions,true)+'</div>'+provList(focus,t,lang)+blockedPanel(t)+'</div></div>');
    }
    /* published — primary populated */
    return content(commandbar(t)+legend(t)+kpis(t)+table(t,lang,null));
  }

  function render(state,lang){
    lang=lang==="ar"?"ar":"en";
    var t=lang==="ar"?AR:EN;
    return '<div class="ax-shell" dir="'+t.dir+'" lang="'+lang+'">'+
      '<a class="ax-shell__skip" href="#wf-main">'+(lang==="ar"?"تخطٍّ إلى المحتوى":"Skip to content")+'</a>'+
      nav(t,lang)+
      '<div class="ax-shell__main"><a id="wf-main"></a>'+pagehead(t,lang)+main(state,t,lang)+'</div>'+
    '</div>';
  }

  window.CD12R2 = { render: render };
})();
