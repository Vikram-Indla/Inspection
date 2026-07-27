/* CD-015 R2 · SCR-ADM-070 — GIS & geofence studio.
   PRESENT TRUTH: engine settings + official factory coordinates +
   updateGeofenceRadius. Official coordinates are GIS-owned; field observation
   never overwrites them. Real states: radius edit, invalid input, RLS failure,
   missing coordinate, loading, provider-unavailable. Map/geocoder/KSA boundary/
   evidence-sync are not facts — surfaced as one plain-language boundary. */
(function () {
  "use strict";
  var C = window.CDM, esc = C.esc;

  var L = {
    en: { group: "GIS Configuration", title: "GIS & geofence studio", sub: "Official factory coordinates and the arrival geofence radius — GIS-owned facts, edited with their provenance in view",
      role: "GIS Admin", crumbs: ["Admin", "GIS Configuration", "Geofence studio"], searchPh: "Search factories by name or FAC id…",
      coordsT: "Official coordinates (GIS-owned)", radiusT: "Geofence radius", saveRadius: "Save radius", radiusAct: "updateGeofenceRadius",
      official: "Official point", officialSrc: "licence record · GIS-owned", fieldObs: "Latest field observation", fieldSrc: "visit VIS-2026-03118 · GPS ±8 m · reference only",
      fieldNote: "Field observations are shown for comparison. They never overwrite the official point — correcting it is a GIS-owned edit with its own audit entry.",
      settingsT: "Engine settings", set: [["Arrival radius (this factory)", "150 m"], ["Default radius", "150 m"], ["GPS accuracy floor", "±25 m"]],
      mapLabel: "MAP PREVIEW — no live tile provider in this environment",
      mapNya: "Map tiles, geocoding and authoritative KSA boundaries are not connected. Coordinates, radius and provenance above remain the working facts without them.",
      mapSeam: "HANDOFF_BLOCKED_TILE_PROVIDER",
      invalidT: "Radius not saved", invalidD: "620 is outside the allowed range (25–500 m). The value was rejected by input validation; the stored radius is unchanged at 150 m.",
      missingT: "No official coordinate", missingD: "FAC-02219 has no coordinates on its licence record. A geofence cannot exist without the official point — the factory is flagged for GIS correction; nothing is guessed from a centroid.",
      rlsT: "Save rejected by row-level security", rlsD: "Your session does not hold the GIS Admin role required by updateGeofenceRadius. The stored radius is unchanged.",
      savedT: "Radius saved", savedD: "updateGeofenceRadius wrote 175 m for FAC-08841. Arrival checks use the new radius from the next location evaluation.",
      provDownT: "Map preview unavailable", provDownD: "The tile request failed. All geometry facts on this page remain readable and editable — the map is a preview, not the source of truth.",
      emptyT: "No factory selected", emptyD: "Search for a factory to view its coordinates and geofence.", loading: "Loading factory geometry…",
      fName: "Al-Riyadh Polymers Co. — FAC-08841" },
    ar: { group: "إعداد نظم المعلومات الجغرافية", title: "استوديو الخرائط والأسيجة الجغرافية", sub: "الإحداثيات الرسمية للمنشأة ونصف قطر سياج الوصول — حقائق تملكها إدارة النظم الجغرافية وتُحرَّر وإثباتها ظاهر",
      role: "مشرف نظم جغرافية", crumbs: ["الإدارة", "إعداد نظم المعلومات الجغرافية", "استوديو الأسيجة"], searchPh: "ابحث عن منشأة بالاسم أو رقم FAC…",
      coordsT: "الإحداثيات الرسمية (ملك إدارة النظم الجغرافية)", radiusT: "نصف قطر السياج", saveRadius: "حفظ نصف القطر", radiusAct: "updateGeofenceRadius",
      official: "النقطة الرسمية", officialSrc: "سجل الترخيص · ملك النظم الجغرافية", fieldObs: "أحدث رصد ميداني", fieldSrc: "الزيارة VIS-2026-03118 · GPS ±8 م · للمقارنة فقط",
      fieldNote: "تُعرض الأرصاد الميدانية للمقارنة. وهي لا تستبدل النقطة الرسمية أبدًا — تصحيحها تحرير تملكه إدارة النظم الجغرافية وله قيد تدقيق خاص.",
      settingsT: "إعدادات المحرّك", set: [["نصف قطر الوصول (هذه المنشأة)", "150 م"], ["نصف القطر الافتراضي", "150 م"], ["حد دقة GPS", "±25 م"]],
      mapLabel: "معاينة الخريطة — لا مزوّد بلاطات حي في هذه البيئة",
      mapNya: "بلاطات الخرائط والترميز الجغرافي وحدود المملكة الموثوقة غير موصولة. تبقى الإحداثيات ونصف القطر والإثبات أعلاه هي الحقائق العاملة دونها.",
      mapSeam: "HANDOFF_BLOCKED_TILE_PROVIDER",
      invalidT: "لم يُحفظ نصف القطر", invalidD: "620 خارج المدى المسموح (25–500 م). رفض التحققُ القيمةَ؛ ونصف القطر المخزَّن بلا تغيير عند 150 م.",
      missingT: "لا إحداثيات رسمية", missingD: "المنشأة FAC-02219 بلا إحداثيات في سجل ترخيصها. لا يمكن وجود سياج دون النقطة الرسمية — تُعلَّم المنشأة للتصحيح ولا يُخمَّن شيء من المركز الهندسي.",
      rlsT: "رُفض الحفظ بواسطة أمان مستوى الصفوف", rlsD: "جلستك لا تحمل دور مشرف النظم الجغرافية الذي يتطلبه updateGeofenceRadius. نصف القطر المخزَّن بلا تغيير.",
      savedT: "حُفظ نصف القطر", savedD: "كتب updateGeofenceRadius القيمة 175 م للمنشأة FAC-08841. تستخدم فحوص الوصول القيمة الجديدة من التقييم التالي للموقع.",
      provDownT: "معاينة الخريطة غير متاحة", provDownD: "فشل طلب البلاطات. تبقى كل حقائق الهندسة في هذه الصفحة مقروءة وقابلة للتحرير — الخريطة معاينة لا مصدر حقيقة.",
      emptyT: "لا منشأة محددة", emptyD: "ابحث عن منشأة لعرض إحداثياتها وسياجها.", loading: "جارٍ تحميل هندسة المنشأة…",
      fName: "شركة الرياض للبوليمرات — FAC-08841" }
  };

  function coords(t, lang, opts) {
    opts = opts || {};
    return '<div class="m-panel"><div class="m-panel__head"><h4>' + esc(t.coordsT) + '</h4>' + C.tt("proven", "factory record") + '</div>' +
      '<div class="gx-conf">' +
      '<div class="gx-conf__row"><span class="gx-conf__dot" style="border-color:var(--legacy-color-primary)"></span><span><b>' + esc(t.official) + '</b><br><span class="m-mono cd-sub" dir="ltr">' + (opts.missing ? '—' : '24.7136, 46.6753') + '</span> · <span class="cd-sub">' + esc(t.officialSrc) + '</span></span>' + (opts.missing ? C.tt("blocked", lang === "ar" ? "مفقود" : "missing") : C.tt("proven", "licence")) + '</div>' +
      '<div class="gx-conf__row"><span class="gx-conf__dot" style="border-color:var(--legacy-color-success)"></span><span><b>' + esc(t.fieldObs) + '</b><br><span class="m-mono cd-sub" dir="ltr">24.7141, 46.6749</span> · <span class="cd-sub">' + esc(t.fieldSrc) + '</span></span>' + C.tt("proven", "visit") + '</div>' +
      '</div><p class="cd-sub">' + esc(t.fieldNote) + '</p></div>';
  }

  function radius(t, opts) {
    opts = opts || {};
    var val = opts.invalid ? "620" : opts.saved ? "175" : "150";
    return '<div class="m-panel"><div class="m-panel__head"><h4>' + esc(t.radiusT) + '</h4>' + C.tt("proven", "engine settings + updateGeofenceRadius") + '</div>' +
      '<div class="rad"><input type="number" value="' + val + '" min="25" max="500" aria-label="' + esc(t.radiusT) + '"' + (opts.invalid ? ' aria-invalid="true" style="border-color:var(--legacy-color-critical)"' : '') + '><span class="rad__unit">m</span>' +
      '<button class="legacy-btn"' + (opts.noSave ? ' disabled aria-disabled="true"' : '') + '>' + esc(t.saveRadius) + '</button></div>' +
      '<dl class="m-kv">' + t.set.map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd class="m-num">' + esc(r[1]) + '</dd>'; }).join("") + '</dl></div>';
  }

  function mapPanel(t, lang, opts) {
    opts = opts || {};
    return '<div style="display:flex;flex-direction:column;gap:12px"><div class="gx-map" style="min-block-size:280px">' +
      (opts.missing ? '' : '<span class="gx-pt gx-pt--official" style="inset-inline-start:48%;inset-block-start:44%"></span><span class="gx-pt gx-pt--verified" style="inset-inline-start:50%;inset-block-start:47%"></span><span class="gx-poly" style="inset-inline-start:36%;inset-block-start:26%;inline-size:30%;block-size:42%;border-radius:50%;border-style:solid;border-color:var(--legacy-color-warning);background:color-mix(in srgb,var(--legacy-color-warning) 6%,transparent)"></span>') +
      '<span class="gx-map__label">' + esc(opts.provDown ? t.provDownT : t.mapLabel) + '</span></div>' +
      C.notYet(lang, lang === "ar" ? "خرائط حية وترميز جغرافي" : "Live maps & geocoding", t.mapNya, t.mapSeam) + '</div>';
  }

  function frame(lang, t, main) {
    return C.frame(lang, C.nav(lang, t.group, [["◍", t.crumbs[2], true]]),
      C.pagehead(lang, { title: t.title, sub: t.sub, role: t.role, crumbs: t.crumbs, searchPh: t.searchPh }), main);
  }

  function bar(t) {
    return '<div class="legacy-commandbar"><span class="cd-sub m-mono" dir="ltr">' + t.radiusAct + '</span><span class="legacy-commandbar__spacer"></span><span class="cd-sub m-mono">' + esc(t.fName) + '</span></div>';
  }

  function grid(t, lang, opts) {
    return '<div class="m-split"><div style="display:flex;flex-direction:column;gap:16px">' + coords(t, lang, opts) + radius(t, opts) + '</div>' + mapPanel(t, lang, opts) + '</div>';
  }

  function render(state, lang) {
    var t = L[lang];
    var body;
    if (state === "empty") body = C.content(C.stateEmpty(lang, "◍", t.emptyT, t.emptyD));
    else if (state === "loading") body = C.content(C.skeleton(lang, t.loading));
    else if (state === "unauthorized") body = C.content(C.stateUnauth(lang));
    else if (state === "offline") body = C.content(C.stateOffline(lang, "◍"));
    else if (state === "invalid-radius") body = C.content(bar(t) + C.guard(t.invalidT, t.invalidD) + C.legend(lang) + grid(t, lang, { invalid: true }));
    else if (state === "missing-coordinate") body = C.content(bar(t) + C.banner("warning", "◌", t.missingT, t.missingD) + C.legend(lang) + grid(t, lang, { missing: true, noSave: true }));
    else if (state === "rls-denied") body = C.content(bar(t) + C.guard(t.rlsT, t.rlsD) + C.legend(lang) + grid(t, lang, { noSave: true }));
    else if (state === "saved") body = C.content(bar(t) + '<div class="legacy-banner"><span>✓</span><div><strong>' + esc(t.savedT) + '</strong><div class="cd-sub">' + esc(t.savedD) + '</div></div></div>' + C.legend(lang) + grid(t, lang, { saved: true }));
    else if (state === "provider-unavailable") body = C.content(bar(t) + C.banner("warning", "▨", t.provDownT, t.provDownD) + C.legend(lang) + grid(t, lang, { provDown: true }));
    else /* valid — primary */ body = C.content(bar(t) + C.legend(lang) + grid(t, lang, {}));
    return frame(lang, t, body);
  }

  C.register("cd15", {
    id: "CD-015", screen: "SCR-ADM-070", title: { en: "GIS & geofence studio", ar: "استوديو الخرائط والأسيجة" },
    states: [
      { id: "valid", n: "S01", label: "Coordinates + radius — primary" },
      { id: "invalid-radius", n: "S02", label: "Radius input rejected (outlier)" },
      { id: "missing-coordinate", n: "S03", label: "No official coordinate — flagged" },
      { id: "rls-denied", n: "S04", label: "Save rejected by RLS" },
      { id: "saved", n: "S05", label: "Radius saved (updateGeofenceRadius)" },
      { id: "provider-unavailable", n: "S06", label: "Map preview unavailable — facts intact" },
      { id: "empty", n: "S07", label: "Empty — no factory selected" },
      { id: "loading", n: "S08", label: "Loading" },
      { id: "unauthorized", n: "S09", label: "Unauthorized" },
      { id: "offline", n: "S10", label: "Offline" }
    ],
    outlier: "invalid-radius",
    render: render
  });
})();
