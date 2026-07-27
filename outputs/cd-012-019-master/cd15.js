/* CD-015 · SCR-ADM-070 — GIS and geofence studio (governed geometry workspace).
   Map canvas is a labelled placeholder (no live provider); thresholds come from
   DEC-002 (stated-by-contract). Provider tiles, geocoding accuracy, KSA boundary
   source and field-evidence sync are HANDOFF_BLOCKED_* provider seams. */
(function () {
  "use strict";
  var C = window.CDM, esc = C.esc;

  var L = {
    en: { group: "GIS Configuration", title: "GIS & geofence studio", sub: "Governed geometry: official, geocoded and field-verified truth compared side by side — source, accuracy and approval status travel with every location",
      role: "GIS Admin", crumbs: ["Admin", "GIS Configuration", "Geofence studio"], searchPh: "Search factories by name or FAC id…",
      layers: "Layers", conf: "Location confidence stack", geom: "Geometry", publish: "Approve & publish geometry", validate: "Validate geometry", draft: "Save draft",
      layerRows: [["Official point (licence)", "var(--legacy-color-primary)", "proven"], ["Field-verified point", "var(--legacy-color-success)", "proven"], ["Factory boundary polygon", "var(--legacy-color-info)", "proven"], ["Geofence (arrival radius)", "var(--legacy-color-warning)", "proven"], ["KSA admin boundaries", "var(--legacy-color-text-disabled)", "blocked"]],
      confRows: [["Official point (licence)", "var(--legacy-color-primary)", "24.7136, 46.6753 · source: licence record", "proven"], ["Field-verified point", "var(--legacy-color-success)", "24.7141, 46.6749 · visit VIS-2026-03118 · GPS ±8m", "proven"], ["Δ official ↔ verified", "var(--legacy-color-warning)", "62 m — within DEC-002 tolerance (100 m)", "proven"], ["Boundary polygon", "var(--legacy-color-info)", "9 vertices · drawn 2026-05-20 by Sara Al-Otaibi", "proven"], ["Geofence radius", "var(--legacy-color-warning)", "150 m arrival threshold — DEC-002", "proven"]],
      thTitle: "Thresholds (DEC-002)", th: [["Arrival radius", "150 m"], ["GPS accuracy floor", "±25 m"], ["Official↔verified tolerance", "100 m"], ["Override roles", "GIS Admin + Technical Admin"]],
      mapLabel: "MAP CANVAS — provider tiles not loaded in design fixture",
      blkTitle: "Provider & source seams", blk: [["Map tile provider", "no provider adapter contract located", "blocked", "HANDOFF_BLOCKED_TILE_PROVIDER"], ["Geocoding service", "no geocoder located", "blocked", "HANDOFF_BLOCKED_GEOCODER"], ["KSA authoritative boundaries", "no boundary source located", "blocked", "HANDOFF_BLOCKED_KSA_BOUNDARY"], ["Field evidence photo sync", "outbox only — delivery unproven", "computed", "HANDOFF_BLOCKED_EVIDENCE_SYNC"]],
      invalidT: "Invalid polygon", invalidD: "The boundary self-intersects at vertex 6 — the geometry validator rejects save. Fix the crossing edges; the invalid ring is drawn hatched, never silently corrected.",
      missingT: "Missing coordinate", missingD: "FAC-02219 has no official point — the licence record lacks coordinates. Geofence cannot be derived; the factory is flagged for field capture, not guessed from centroid.",
      mismatchT: "Source mismatch", mismatchD: "Official point is 480 m from the field-verified point — beyond DEC-002 tolerance (100 m). Neither point is overwritten; the conflict is escalated with both provenances preserved.",
      tileT: "Tiles unavailable", tileD: "The map provider is unreachable. Geometry facts (coordinates, polygon vertices, thresholds) remain fully readable without tiles — the map is progressive enhancement, not the source of truth.",
      staleT: "Stale field verification", staleD: "Last field-verified 2025-08-14 (11 months). No freshness contract is located — the staleness cue is design intent (HANDOFF_BLOCKED_EVIDENCE_SYNC); dates themselves are proven.",
      draftT: "Draft geometry — not used by field apps", draftD: "Draft polygons/radii never reach inspectors. Publishing follows maker-checker; field apps consume only published geometry.",
      pubT: "Published geometry is immutable", pubD: "Change the boundary by proposing a new draft. Every published geometry version is preserved for arrival-event audit replay.",
      emptyT: "No factory selected", emptyD: "Search for a factory to review its location truth.", loading: "Loading geometry…",
      kFac: "Factories", kVerified: "Field-verified", kMismatch: "Source mismatches", kMissing: "Missing coordinates",
      fName: "Al-Riyadh Polymers Co. — FAC-08841" },
    ar: { group: "إعداد نظم المعلومات الجغرافية", title: "استوديو الخرائط والأسيجة الجغرافية", sub: "هندسة محكومة: الحقيقة الرسمية والمُرمَّزة والمُتحقَّق منها ميدانيًا جنبًا إلى جنب — المصدر والدقة وحالة الاعتماد ترافق كل موقع",
      role: "مشرف نظم جغرافية", crumbs: ["الإدارة", "إعداد نظم المعلومات الجغرافية", "استوديو الأسيجة"], searchPh: "ابحث عن منشأة بالاسم أو رقم FAC…",
      layers: "الطبقات", conf: "حزمة ثقة الموقع", geom: "الهندسة", publish: "اعتماد ونشر الهندسة", validate: "التحقق من الهندسة", draft: "حفظ المسودة",
      layerRows: [["النقطة الرسمية (الترخيص)", "var(--legacy-color-primary)", "proven"], ["النقطة المُتحقَّق منها ميدانيًا", "var(--legacy-color-success)", "proven"], ["مضلّع حدود المنشأة", "var(--legacy-color-info)", "proven"], ["السياج الجغرافي (نصف قطر الوصول)", "var(--legacy-color-warning)", "proven"], ["حدود المملكة الإدارية", "var(--legacy-color-text-disabled)", "blocked"]],
      confRows: [["النقطة الرسمية (الترخيص)", "var(--legacy-color-primary)", "24.7136, 46.6753 · المصدر: سجل الترخيص", "proven"], ["النقطة المُتحقَّق منها ميدانيًا", "var(--legacy-color-success)", "24.7141, 46.6749 · الزيارة VIS-2026-03118 · GPS ±8م", "proven"], ["الفرق رسمي ↔ مُتحقَّق", "var(--legacy-color-warning)", "62 م — ضمن سماحية DEC-002 (100 م)", "proven"], ["مضلّع الحدود", "var(--legacy-color-info)", "9 رؤوس · رُسم 2026-05-20 بواسطة سارة العتيبي", "proven"], ["نصف قطر السياج", "var(--legacy-color-warning)", "عتبة وصول 150 م — DEC-002", "proven"]],
      thTitle: "العتبات (DEC-002)", th: [["نصف قطر الوصول", "150 م"], ["حد دقة GPS", "±25 م"], ["سماحية رسمي↔مُتحقَّق", "100 م"], ["أدوار التجاوز", "مشرف نظم جغرافية + مشرف تقني"]],
      mapLabel: "لوحة الخريطة — بلاطات المزوّد غير محمّلة في نموذج التصميم",
      blkTitle: "فواصل المزوّد والمصدر", blk: [["مزوّد بلاطات الخرائط", "لا عقد مُهايئ مزوّد مُثبت", "blocked", "HANDOFF_BLOCKED_TILE_PROVIDER"], ["خدمة الترميز الجغرافي", "لا مُرمِّز مُثبت", "blocked", "HANDOFF_BLOCKED_GEOCODER"], ["حدود المملكة الموثوقة", "لا مصدر حدود مُثبت", "blocked", "HANDOFF_BLOCKED_KSA_BOUNDARY"], ["مزامنة صور الأدلة الميدانية", "صندوق صادر فقط — التسليم غير مُثبت", "computed", "HANDOFF_BLOCKED_EVIDENCE_SYNC"]],
      invalidT: "مضلّع غير صالح", invalidD: "الحدود تتقاطع ذاتيًا عند الرأس 6 — يرفض مُدقّق الهندسة الحفظ. صحّح الأضلاع المتقاطعة؛ تُرسم الحلقة غير الصالحة مُهشَّرة ولا تُصحَّح صامتة أبدًا.",
      missingT: "إحداثيات مفقودة", missingD: "المنشأة FAC-02219 بلا نقطة رسمية — سجل الترخيص بلا إحداثيات. لا يمكن اشتقاق السياج؛ تُعلَّم المنشأة للالتقاط الميداني ولا تُخمَّن من المركز الهندسي.",
      mismatchT: "تعارض المصادر", mismatchD: "النقطة الرسمية تبعد 480 م عن النقطة المُتحقَّق منها — أبعد من سماحية DEC-002 (100 م). لا تُستبدل أي نقطة؛ يُصعَّد التعارض مع حفظ مصدر كلٍّ منهما.",
      tileT: "البلاطات غير متاحة", tileD: "مزوّد الخرائط غير قابل للوصول. تبقى حقائق الهندسة (الإحداثيات ورؤوس المضلّع والعتبات) مقروءة بالكامل دون بلاطات — الخريطة تحسين تدريجي وليست مصدر الحقيقة.",
      staleT: "تحقق ميداني قديم", staleD: "آخر تحقق ميداني 2025-08-14 (11 شهرًا). لا عقد نضارة مُثبت — إشارة القِدَم نيّة تصميمية (HANDOFF_BLOCKED_EVIDENCE_SYNC)؛ أما التواريخ فمُثبتة.",
      draftT: "هندسة مسودة — لا تصل للتطبيقات الميدانية", draftD: "مضلّعات وأنصاف أقطار المسودة لا تصل للمفتّشين. يتبع النشر قواعد الصانع/المدقّق؛ وتستهلك التطبيقات الميدانية الهندسة المنشورة فقط.",
      pubT: "الهندسة المنشورة غير قابلة للتغيير", pubD: "غيّر الحدود باقتراح مسودة جديدة. يُحفظ كل إصدار هندسة منشور لإعادة تدقيق أحداث الوصول.",
      emptyT: "لا منشأة محددة", emptyD: "ابحث عن منشأة لمراجعة حقيقة موقعها.", loading: "جارٍ تحميل الهندسة…",
      kFac: "منشآت", kVerified: "مُتحقَّق ميدانيًا", kMismatch: "تعارضات مصادر", kMissing: "إحداثيات مفقودة",
      fName: "شركة الرياض للبوليمرات — FAC-08841" }
  };

  function mapCanvas(t, opts) {
    opts = opts || {};
    var pts = opts.missing ? '' :
      '<span class="gx-pt gx-pt--official" style="inset-inline-start:' + (opts.mismatch ? '30%' : '48%') + ';inset-block-start:44%"></span>' +
      '<span class="gx-pt gx-pt--verified" style="inset-inline-start:' + (opts.mismatch ? '68%' : '50%') + ';inset-block-start:' + (opts.mismatch ? '58%' : '46%') + '"></span>';
    var poly = opts.missing ? '' : '<span class="gx-poly' + (opts.invalid ? ' gx-poly--invalid' : '') + '" style="inset-inline-start:34%;inset-block-start:26%;inline-size:34%;block-size:44%"></span>';
    return '<div class="gx-map">' + poly + pts +
      '<span class="gx-map__label">' + esc(opts.tileDown ? t.tileT : t.mapLabel) + '<br>' + C.tt("blocked", "HANDOFF_BLOCKED_TILE_PROVIDER") + '</span>' +
      '</div>';
  }

  function layers(t) {
    return '<div class="m-panel"><div class="m-panel__head"><h4>' + esc(t.layers) + '</h4></div>' +
      t.layerRows.map(function (r) {
        return '<div class="gx-layer"><span class="gx-layer__sw" style="border-color:' + r[1] + '"></span><span style="flex:1">' + esc(r[0]) + '</span>' + C.tt(r[2], r[2] === "proven" ? "payload" : "blocked") + '</div>';
      }).join("") + '</div>';
  }

  function confStack(t, opts) {
    opts = opts || {};
    return '<div class="m-panel"><div class="m-panel__head"><h4>' + esc(t.conf) + '</h4>' + C.tt("proven", "provenance preserved") + '</div><div class="gx-conf">' +
      t.confRows.map(function (r, i) {
        var mism = opts.mismatch && i === 2;
        return '<div class="gx-conf__row"' + (mism ? ' style="background:var(--legacy-color-critical-tint)"' : '') + '><span class="gx-conf__dot" style="border-color:' + r[1] + '"></span><span><b>' + esc(r[0]) + '</b><br><span class="m-mono cd-sub">' + (mism ? esc("480 m — ") + esc(t.mismatchT) : esc(r[2])) + '</span></span>' + C.tt(mism ? "blocked" : r[3], mism ? "escalate" : "payload") + '</div>';
      }).join("") + '</div></div>';
  }

  function thresholds(t) {
    return '<div class="m-panel"><div class="m-panel__head"><h4>' + esc(t.thTitle) + '</h4>' + C.tt("proven", "DEC-002") + '</div><dl class="m-kv">' +
      t.th.map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd class="m-num">' + esc(r[1]) + '</dd>'; }).join("") + '</dl></div>';
  }

  function bar(t, opts) {
    opts = opts || {};
    return '<div class="legacy-commandbar"><button class="legacy-btn legacy-btn--secondary">' + esc(t.draft) + '</button>' +
      '<button class="legacy-btn legacy-btn--secondary">' + esc(t.validate) + '</button>' +
      '<button class="legacy-btn"' + (opts.noPub ? ' disabled aria-disabled="true"' : '') + '>' + esc(t.publish) + '</button>' +
      '<span class="legacy-commandbar__spacer"></span><span class="cd-sub m-mono">' + esc(t.fName) + '</span></div>';
  }

  function kpis(t) {
    return C.kpis([{ v: "1,284", l: t.kFac, tier: "proven" }, { v: 903, l: t.kVerified, tier: "proven" }, { v: 12, l: t.kMismatch, tier: "proven" }, { v: 38, l: t.kMissing, tier: "proven" }]);
  }

  function grid(t, opts) {
    return '<div class="m-split3"><div style="display:flex;flex-direction:column;gap:16px">' + layers(t) + thresholds(t) + '</div>' +
      '<div>' + mapCanvas(t, opts) + '</div>' +
      '<div style="display:flex;flex-direction:column;gap:16px">' + confStack(t, opts) + C.blocked(t.blkTitle, t.blk) + '</div></div>';
  }

  function frame(lang, t, main) {
    return C.frame(lang, C.nav(lang, t.group, [["◍", t.crumbs[2], true]]),
      C.pagehead(lang, { title: t.title, sub: t.sub, role: t.role, crumbs: t.crumbs, searchPh: t.searchPh }), main);
  }

  function render(state, lang) {
    var t = L[lang];
    var body;
    if (state === "empty") body = C.content(C.stateEmpty(lang, "◍", t.emptyT, t.emptyD));
    else if (state === "loading") body = C.content(C.skeleton(lang, t.loading));
    else if (state === "unauthorized") body = C.content(C.stateUnauth(lang));
    else if (state === "offline") body = C.content(C.stateOffline(lang, "◍"));
    else if (state === "invalid-geometry") body = C.content(bar(t, { noPub: true }) + C.guard(t.invalidT, t.invalidD) + C.legend(lang) + grid(t, { invalid: true }));
    else if (state === "missing-coordinate") body = C.content(bar(t, { noPub: true }) + C.guard(t.missingT, t.missingD) + C.legend(lang) + grid(t, { missing: true }));
    else if (state === "source-mismatch") body = C.content(bar(t, { noPub: true }) + C.banner("warning", "⇄", t.mismatchT, t.mismatchD) + C.legend(lang) + grid(t, { mismatch: true }));
    else if (state === "tile-unavailable") body = C.content(bar(t, {}) + C.banner("warning", "▨", t.tileT, t.tileD) + C.legend(lang) + grid(t, { tileDown: true }));
    else if (state === "stale") body = C.content(bar(t, {}) + C.banner("warning", "◷", t.staleT, t.staleD) + C.legend(lang) + grid(t, {}));
    else if (state === "draft") body = C.content(bar(t, {}) + C.banner("warning", "▣", t.draftT, t.draftD) + C.legend(lang) + grid(t, {}));
    else if (state === "published") body = C.content(bar(t, { noPub: true }) + C.banner("immutable", "◆", t.pubT, t.pubD) + C.legend(lang) + grid(t, {}));
    else /* valid — primary */ body = C.content(bar(t, {}) + C.legend(lang) + kpis(t) + grid(t, {}));
    return frame(lang, t, body);
  }

  C.register("cd15", {
    id: "CD-015", screen: "SCR-ADM-070", title: { en: "GIS & geofence studio", ar: "استوديو الخرائط والأسيجة" },
    states: [
      { id: "valid", n: "S01", label: "Valid — primary (confidence stack)" },
      { id: "invalid-geometry", n: "S02", label: "Invalid polygon (outlier)" },
      { id: "missing-coordinate", n: "S03", label: "Missing coordinate" },
      { id: "source-mismatch", n: "S04", label: "Source mismatch — escalate" },
      { id: "tile-unavailable", n: "S05", label: "Tiles unavailable (provider seam)" },
      { id: "stale", n: "S06", label: "Stale field verification" },
      { id: "draft", n: "S07", label: "Draft geometry — not live" },
      { id: "published", n: "S08", label: "Published — immutable" },
      { id: "empty", n: "S09", label: "Empty — no factory selected" },
      { id: "loading", n: "S10", label: "Loading" },
      { id: "unauthorized", n: "S11", label: "Unauthorized" },
      { id: "offline", n: "S12", label: "Offline" }
    ],
    outlier: "invalid-geometry",
    render: render
  });
})();
