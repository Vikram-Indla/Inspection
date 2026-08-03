#!/usr/bin/env python3
"""Seed Arabic drafts for every extracted i18n key (status='draft' — human
review happens in /admin/localization). Regenerate-safe: upserts by key,
never downgrades a 'reviewed' row's Arabic. Run:
  PAT=$(security find-generic-password -a inspection -s supabase-pat -w) python3 scripts/seed_arabic.py
"""
import json, os, re, pathlib, urllib.request, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = ROOT / "apps/web/src"

AR = {
  # ---- nav ----
  "nav.primary": "الرئيسية", "nav.overview": "نظرة عامة", "nav.planning": "التخطيط",
  "nav.visits": "الزيارات", "nav.reviews": "المراجعات", "nav.factory360": "المصنع 360",
  "nav.virtual": "الافتراضية", "nav.field": "الميدان", "nav.operations": "العمليات",
  "nav.admin": "الإدارة", "nav.signout": "تسجيل الخروج",
  "admin.shell.languageSwitch": "English", "admin.shell.navigation": "تنقل لوحة التحكم",
  "admin.shell.controlPanel": "لوحة التحكم", "admin.shell.authorized": "منطقة مصرح بها",
  "admin.shell.loadingDestination": "جارٍ تحميل الوجهة…", "admin.shell.brandLabel": "SAQEEL | صقيل",
  "admin.shell.brandArabic": "صقيل", "admin.shell.brandEnglish": "SAQEEL",
  "admin.shell.findTool": "ابحث في الأدوات", "admin.shell.viewAll": "عرض كل الأدوات المصرّح بها",
  "admin.shell.administration": "الإدارة", "admin.shell.allTools": "كل الأدوات المصرّح بها، مرتّبة حسب المجال",
  "admin.shell.close": "إغلاق", "admin.shell.paletteTitle": "ابحث عن أداة",
  "admin.shell.noMatch": "لا توجد أداة مصرح بها تطابق البحث.",
  "admin.shell.hub.control": "لوحة التحكم",
  "admin.shell.hub.people": "المستخدمون والصلاحيات", "admin.shell.hub.rules": "القواعد والمحتوى",
  "admin.shell.hub.planning": "التخطيط والتنفيذ", "admin.shell.hub.risk": "المخاطر والذكاء",
  "admin.shell.hub.connections": "الاتصالات والجغرافيا", "admin.shell.hub.governance": "الحوكمة والعمليات",
  # ---- landing ----
  "landing.nav.aria": "التسويق", "landing.nav.channels": "القنوات", "landing.nav.platform": "المنصة",
  "landing.nav.trust": "الموثوقية", "landing.nav.channelsAria": "قنوات تسجيل الدخول",
  "landing.nav.signinLabel": "تسجيل الدخول:", "landing.nav.admin": "الإدارة", "landing.nav.web": "الويب",
  "landing.nav.ipad": "المفتش", "landing.nav.agent": "الوكيل",
  "landing.cta.workspace": "افتح لوحة المعلومات", "landing.cta.signin": "تسجيل الدخول",
  "landing.hero.eyebrow": "وزارة الصناعة والثروة المعدنية · المرحلة الأولى",
  "landing.hero.title": "تفتيش صناعي مُحوكم من البداية إلى النهاية.",
  "landing.hero.sub": "منصة واحدة للتخطيط والتنفيذ الميداني والجلسات الافتراضية ومراجعة المستوى الثاني والعمليات — مع فرض الأمان وعدم قابلية التعديل والتدقيق في قاعدة البيانات، لا مجرد وعود في الواجهة.",
  "landing.hero.ctaWorkspace": "افتح لوحة المعلومات", "landing.hero.ctaSignin": "سجّل الدخول إلى قناتك",
  "landing.hero.explore": "استكشف القنوات",
  "landing.mock.kpiPublished": "زيارات منشورة", "landing.mock.kpiSla": "الالتزام بمستوى الخدمة",
  "landing.mock.kpiAwaiting": "بانتظار المراجعة", "landing.mock.kpiConflicts": "تعارضات غير متزامنة",
  "landing.mock.factory1": "مصنع الأمل للبلاستيك", "landing.mock.factory2": "أعمال الخليج للصلب",
  "landing.mock.factory3": "صناعات نجد الغذائية",
  "landing.mock.approved": "معتمدة", "landing.mock.highRisk": "خطورة عالية", "landing.mock.virtual": "افتراضية",
  "landing.mock.periodicPhysical": "دورية · ميدانية", "landing.mock.followupPhysical": "متابعة · ميدانية",
  "landing.mock.periodicVirtual": "دورية · افتراضية",
  "landing.channels.kicker": "أربع قنوات · عقد واحد",
  "landing.channels.title": "لكل مستخدم بوابة مُصممة لغرضه.",
  "landing.channels.lead": "نموذج البيانات المُحوكم نفسه يخدم أربعة أنماط عمل مختلفة — اختر قناتك وسجّل الدخول.",
  "landing.persona.admin.title": "بوابة الالتزام",
  "landing.persona.admin.desc": "مكتبة الأنظمة، ومصمم الحزم والنماذج، وسجل المخالفات، واستوديو المخاطر — كل محرك مُحوكم بمبدأ المُعِدّ والمُعتمِد.",
  "landing.persona.admin.cta": "ادخل إلى البوابة ←",
  "landing.persona.portal.title": "التخطيط والمراجعة",
  "landing.persona.portal.desc": "تخطيط الزيارات الجماعي والفردي والفوري؛ ومراجعة المستوى الثاني بقرارات نهائية ونطاق إعادة محدد.",
  "landing.persona.portal.cta": "خطط وراجع ←",
  "landing.persona.inspector.title": "المفتش",
  "landing.persona.inspector.desc": "تطبيق ميداني يعمل دون اتصال. قوائم التحقق والأدلة وتسجيل الوصول الجغرافي — كل إجابة تُحفظ وتُعاد مزامنتها، ولا تُفقد أبدًا.",
  "landing.persona.inspector.cta": "افتح التطبيق الميداني ←",
  "landing.persona.agent.title": "الوكيل الافتراضي",
  "landing.persona.agent.desc": "تفتيش عن بُعد بمشاركين مُتحقق منهم عبر رمز التحقق، مع توثيق الجدول الزمني وبنفس انضباط الأدلة الميدانية.",
  "landing.persona.agent.cta": "ابدأ جلسة ←",
  "landing.stats.requirements": "متطلبًا إلزاميًا للمرحلة الأولى ضمن العقد",
  "landing.stats.policies": "سياسة أمان على مستوى الصفوف تفرض الصلاحيات",
  "landing.stats.triggers": "مُحفِّز قاعدة بيانات يحرس الحالات وعدم قابلية التعديل",
  "landing.stats.audit": "من إجراءات الجلسات تُسجل في سجل تدقيق غير قابل للحذف",
  "landing.platform.kicker": "لماذا تصمد المنصة",
  "landing.platform.title": "الحوكمة هنا خاصية في قاعدة البيانات، لا شريحة عرض.",
  "landing.feature.rls.title": "أمان تفرضه قاعدة البيانات",
  "landing.feature.rls.desc": "٥٤ سياسة أمان على مستوى الصفوف تُطبق مصفوفة الصلاحيات المجمدة. الواجهة لا تضيف أي ثقة — كل قراءة وكتابة تمر عبر السياسة.",
  "landing.feature.audit.title": "سجل تدقيق غير قابل للحذف",
  "landing.feature.audit.desc": "كل إجراء في الجلسة يُسجل في سجل تدقيق غير قابل للتعديل. تُرفض التعديلات والحذف بالمحفزات، لا بالاتفاق.",
  "landing.feature.makerchecker.title": "نشر بمبدأ المُعِدّ والمُعتمِد",
  "landing.feature.makerchecker.desc": "لا أحد ينشر مسودته بنفسه. القيد يعيش في قاعدة البيانات — اعتماد الذات مستحيل، لا مجرد أمر غير مُستحسن.",
  "landing.feature.offline.title": "عمل ميداني دون اتصال أولًا",
  "landing.feature.offline.desc": "صندوق صادر محلي بإعادة تشغيل آمنة وسجلات تعارض صريحة. الاستبدال الصامت سلوك محظور.",
  "landing.feature.risk.title": "استهداف مُرجّح بالمخاطر",
  "landing.feature.risk.desc": "أوزان مخاطر مُحوكمة تحدد فئات المصانع وأولوية التخطيط — إعدادات لا شيفرة.",
  "landing.feature.decisions.title": "قرارات نهائية",
  "landing.feature.decisions.desc": "معتمد أو مُعاد أو مرفوض — قرار المستوى الثاني يُقفل نهائيًا. إعادة التقديم تُنشئ نسخة جديدة دائمًا.",
  "landing.footer.line": "الوصول مقيد حسب الدور (RBAC-001..014) · كل إجراء جلسة يُدقق (ENG-12) · نظام تصميم المنصة",
  # ---- login ----
  "login.pick": "اختر قناتك — المنصة المُحوكمة نفسها بأربع بوابات.",
  "login.email": "البريد الإلكتروني", "login.password": "كلمة المرور",
  "login.signin": "تسجيل الدخول", "login.signingIn": "جارٍ تسجيل الدخول…",
  "login.footer": "الوصول مقيد حسب الدور (RBAC-001..014). كل إجراء جلسة يُدقق (ENG-12).",
  "login.otherChannels": "قنوات أخرى:", "login.directLinks": "روابط مباشرة:",
  "login.backToLanding": "→ الصفحة الرئيسية",
  "login.ariaChannels": "قنوات تسجيل الدخول", "login.ariaOtherChannels": "قنوات تسجيل دخول أخرى",
  "login.admin.title": "بوابة الالتزام", "login.admin.short": "الإدارة",
  "login.admin.sub": "المحركات والسجلات والنشر المُحوكم.",
  "login.admin.stat": "٦ محركات مُحوكمة · مبدأ المُعِدّ والمُعتمِد في كل نشر",
  "login.admin.point1": "مكتبة الأنظمة وربط المواد", "login.admin.point2": "مصمم الحزم بمبدأ المُعِدّ والمُعتمِد",
  "login.admin.point3": "استوديو المخاطر — أوزان مُحوكمة",
  "login.admin.why1": "اعتماد الذات مستحيل — القيد يعيش في قاعدة البيانات (RBAC-002).",
  "login.admin.why2": "كل محرك هو إعدادات تحت الحوكمة، لا شيفرة.",
  "login.admin.why3": "النشر مُرقّم بالنسخ؛ المسودات لا تتسرب إلى الميدان أبدًا.",
  "login.portal.title": "التخطيط والمراجعة", "login.portal.short": "الويب",
  "login.portal.sub": "خطط الزيارات. احسم المراجعات. لا شيء يفلت.",
  "login.portal.stat": "٣ طرق تخطيط · قرارات المستوى الثاني نهائية",
  "login.portal.point1": "تخطيط جماعي وفردي وفوري", "login.portal.point2": "مراجعة المستوى الثاني بقرارات نهائية",
  "login.portal.point3": "المصنع 360 ودورة حياة الزيارة",
  "login.portal.why1": "قرار المستوى الثاني يُقفل نهائيًا — إعادة التقديم تُنشئ نسخة جديدة (M06-009).",
  "login.portal.why2": "الاستهداف المُرجّح بالمخاطر يقود كل خطة، لا الحدس (ENG-04).",
  "login.portal.why3": "نطاق الإعادة محدد: المراجع يسمي ما يعود، لا أكثر.",
  "login.inspector.title": "المفتش", "login.inspector.short": "المفتش",
  "login.inspector.sub": "زياراتك، متصلًا أو دون اتصال.",
  "login.inspector.stat": "زيارتان مُسندتان · جاهز للعمل دون اتصال",
  "login.inspector.point1": "الزيارات المُسندة فقط (RBAC-009)", "login.inspector.point2": "صندوق صادر محلي بإعادة تشغيل آمنة",
  "login.inspector.point3": "قواعد الأدلة تُفرض عند الالتقاط",
  "login.inspector.why1": "كل إجابة تُحفظ وتُعاد مزامنتها — لا تُفقد ولا تُستبدل أبدًا (STM-SYNC-001).",
  "login.inspector.why2": "تسجيل الوصول الجغرافي يثبت وجودك؛ وسجل التدقيق يثبت الباقي.",
  "login.inspector.why3": "قواعد الأدلة تعمل عند الالتقاط لا عند التقديم — لا مفاجآت لاحقًا.",
  "login.agent.title": "الوكيل الافتراضي", "login.agent.short": "الوكيل",
  "login.agent.sub": "تفتيش عن بُعد بمشاركين مُتحقق منهم.",
  "login.agent.stat": "انضمام مُتحقق برمز · جدول زمني كامل للجلسة",
  "login.agent.point1": "انضمام مُتحقق برمز (من الخادم)", "login.agent.point2": "توثيق الجدول الزمني للجلسة",
  "login.agent.point3": "انضباط الأدلة نفسه كما في الميدان",
  "login.agent.why1": "يُتحقق من المشاركين برمز عبر الخادم قبل التقاط أي إطار.",
  "login.agent.why2": "الجدول الزمني للجلسة غير قابل للحذف — ما حدث هو ما يُسجل (ENG-12).",
  "login.agent.why3": "الجلسات الافتراضية تحمل انضباط الأدلة نفسه كالزيارة الميدانية.",
  # ---- field dashboard + tabs ----
  "field.dashboard.title": "لوحة الميدان",
  "field.dashboard.kpi.assigned": "الزيارات المُسندة", "field.dashboard.kpi.completed": "المكتملة",
  "field.dashboard.kpi.awaitingReview": "بانتظار المراجعة", "field.dashboard.kpi.compliance": "معدل الالتزام",
  "field.dashboard.visitsByMonth": "الزيارات حسب الشهر", "field.dashboard.reviewOutcomes": "نتائج المراجعة",
  "field.dashboard.submissionsTrend": "اتجاه التقديمات", "field.dashboard.myVisits": "زياراتي",
  "field.dashboard.approved": "معتمدة", "field.dashboard.returned": "مُعادة", "field.dashboard.rejected": "مرفوضة",
  "field.dashboard.decided": "محسومة", "field.dashboard.noData": "لا توجد بيانات بعد",
  "field.dashboard.loadError": "تعذر تحميل التكليفات.", "field.dashboard.retry": "أعد المحاولة.",
  "field.dashboard.empty.title": "لا توجد زيارات مُسندة",
  "field.dashboard.empty.body": "تظهر هنا تكليفاتك فقط (RBAC-009). التكليفات الجديدة تصل مع إشعار.",
  "field.tabs.dashboard": "اللوحة", "field.tabs.visits": "الزيارات", "field.tabs.startNext": "ابدأ الزيارة التالية",
  "field.tabs.virtual": "الافتراضية", "field.tabs.signout": "تسجيل الخروج",
  # ---- l10n module ----
  "l10n.title": "التوطين اللغوي",
  "l10n.kpi.total": "إجمالي المفاتيح", "l10n.kpi.translated": "مُترجم (عربي)",
  "l10n.kpi.reviewed": "مُراجَع", "l10n.kpi.coverage": "التغطية",
  "l10n.search": "ابحث بالمفتاح أو الإنجليزية أو العربية…",
  "l10n.filter.all": "كل الحالات", "l10n.filter.draft": "مسودة",
  "l10n.filter.reviewed": "مُراجَع", "l10n.filter.missing": "بلا عربية",
  "l10n.col.key": "المفتاح", "l10n.col.en": "الإنجليزية (المصدر)", "l10n.col.ar": "العربية",
  "l10n.col.status": "الحالة", "l10n.col.context": "السياق", "l10n.col.actions": "إجراءات",
  "l10n.status.draft": "مسودة", "l10n.status.reviewed": "مُراجَع", "l10n.status.missing": "مفقود",
  "l10n.save": "حفظ", "l10n.saving": "جارٍ الحفظ…", "l10n.saved": "تم الحفظ",
  "l10n.review": "اعتماد المراجعة", "l10n.reviewing": "جارٍ الاعتماد…",
  "l10n.add.title": "إضافة مفتاح", "l10n.add.key": "المفتاح", "l10n.add.en": "النص الإنجليزي",
  "l10n.add.ar": "العربية (اختياري)", "l10n.add.context": "السياق (اختياري)",
  "l10n.add.submit": "أضف المفتاح (مسودة)", "l10n.add.pending": "جارٍ الإضافة…", "l10n.add.done": "تمت الإضافة",
  "l10n.export": "تصدير CSV", "l10n.import.note": "مستورد CSV سيتوفر لاحقًا.",
  "l10n.showing": "المعروض",
  "l10n.empty.title": "لا توجد نصوص واجهة بعد",
  "l10n.empty.body": "تصل المفاتيح إلى هنا من عمليات المسح على الشيفرة؛ ترجمها إلى العربية ثم اعتمد المراجعة.",
  "l10n.nomatch.title": "لا نتائج مطابقة", "l10n.nomatch.body": "عدّل البحث أو مرشح الحالة.",
  "l10n.error.load": "تعذر تحميل نصوص الواجهة:",
  # ---- GIS Studio (SCR-ADM-070 · SB20 · ENG-06) ----
  "gis.title": "استوديو نظم المعلومات الجغرافية — التسييج الجغرافي",
  "gis.banner.title": "استوديو نظم المعلومات الجغرافية.",
  "gis.banner.body": "تُختَم هذه القيم المُحوكمة على كل حدث جغرافي (يُسجَّل إصدار الإعدادات مع كل تسجيل وصول — EV-005). تبقى الإحداثيات الرسمية مملوكة لمشرف نظم المعلومات الجغرافية؛ ولا يستبدلها الرصد الميداني أبدًا (FND-007). يُعدَّل نصف قطر النطاق الجغرافي لكل مصنع (SB20) على الخريطة أدناه.",
  "gis.error.title": "بيانات نظم المعلومات الجغرافية غير متاحة.",
  "gis.empty.title": "لا توجد مصانع مسجلة",
  "gis.empty.body": "سجل المصانع فارغ — تظهر النطاقات الجغرافية هنا بعد مزامنة المصانع (FND-007).",
  "gis.loading.title": "جارٍ تحميل الخريطة",
  "gis.loading.body": "جارٍ تجهيز عرض النطاقات الجغرافية للمملكة (ENG-06).",
  "gis.search.label": "البحث في المصانع",
  "gis.search.placeholder": "ابحث بالاسم أو الرمز أو المدينة أو المنطقة…",
  "gis.filter.regionAll": "كل المناطق", "gis.filter.bandAll": "كل فئات الخطورة",
  "gis.count.shown": "مصنعًا معروضًا",
  "gis.count.noResults": "لا توجد مصانع مطابقة للمرشحات الحالية.",
  "gis.count.noCoords": "بدون إحداثيات (في الجدول فقط)",
  "gis.select.title": "اختر دبوس مصنع",
  "gis.select.body": "انقر أي دبوس لمراجعة إحداثياته الرسمية وحوكمة نصف قطر نطاقه الجغرافي (SB20).",
  "gis.coords.label": "الإحداثيات الرسمية (مملوكة لمشرف نظم المعلومات الجغرافية، FND-007)",
  "gis.coords.caption": "الرصد الميداني لا يستبدل الدبوس الرسمي أبدًا.",
  "gis.radius.label": "نصف قطر النطاق الجغرافي (م) — SB20",
  "gis.radius.hint": "تلميح: مع تحديد هذا المصنع، انقر على الخريطة لتعيين حافة النطاق عند تلك النقطة. القيمة الفارغة تعود إلى الإعداد الافتراضي للمحرك",
  "gis.radius.save": "حفظ نصف القطر", "gis.radius.saving": "جارٍ الحفظ…", "gis.radius.saved": "تم الحفظ",
  "gis.defaults.title": "إعدادات المحرك الافتراضية (ENG-06 · للقراءة فقط)",
  "gis.defaults.checkin": "دقة تسجيل الوصول", "gis.defaults.arrival": "كشف الوصول",
  "gis.defaults.fence": "النطاق الجغرافي الافتراضي",
  "gis.legend.caption": "ألوان الدبابيس حسب فئة الخطورة",
  "gis.band.high": "عالية", "gis.band.medium": "متوسطة", "gis.band.low": "منخفضة", "gis.band.unbanded": "غير مصنفة",
  "gis.table.code": "الرمز", "gis.table.name": "المصنع", "gis.table.region": "المنطقة",
  "gis.table.city": "المدينة", "gis.table.band": "فئة الخطورة",
  "gis.table.radius": "نصف قطر النطاق", "gis.table.coords": "الإحداثيات الرسمية",
  "gis.table.radiusDefault": "افتراضي",
  "gis.settings.setting": "الإعداد", "gis.settings.value": "القيمة", "gis.settings.contract": "العقد",
  "gis.settings.gps": "دقة GPS لتسجيل الوصول",
  "gis.settings.arrival": "نصف قطر كشف الوصول",
  "gis.settings.fence": "نصف القطر الافتراضي للنطاق الجغرافي",
  "gis.settings.fenceNote": "تجاوز لكل مصنع على الخريطة",
  "gis.settings.telemetry": "فاصل القياس عن بُعد",
  "gis.settings.deviation": "تنبيه الانحراف عن المسار",
  "gis.settings.retention": "الاحتفاظ بالبيانات",
  "gis.action.expired": "انتهت الجلسة — سجّل الدخول مجددًا.",
  "gis.action.noFactory": "لم يتم اختيار مصنع.",
  "gis.action.badRadius": "مطلوب نصف قطر موجب بالأمتار.",
  "gis.action.rls": "مُنع التحديث بواسطة سياسة RLS (factories_update) — مطلوب دور gis_admin.",
}

def collect_pairs():
    pairs = {}
    # .ts included for server actions (e.g. admin/gis/actions.ts) that localize errors via t()
    for f in [*SRC.rglob("*.tsx"), *SRC.rglob("*.ts")]:
        # (?<![A-Za-z_.]) keeps ".not(" / "sort(" etc. from matching as t(
        for m in re.finditer(r'(?<![A-Za-z_.])t\(\s*"([^"]+)"\s*,\s*"((?:[^"\\]|\\.)*)"', f.read_text()):
            pairs[m.group(1)] = m.group(2).replace('\\"', '"')
    gen = SRC / "lib/i18n-keys.generated.ts"
    ctx = {}
    if gen.exists():
        for m in re.finditer(r'key: "([^"]+)", en: "((?:[^"\\]|\\.)*)", context: "((?:[^"\\]|\\.)*)"', gen.read_text()):
            pairs.setdefault(m.group(1), m.group(2).replace('\\"', '"'))
            ctx[m.group(1)] = m.group(3)
    return pairs, ctx

def main() -> int:
    pat = os.environ.get("PAT")
    if not pat:
        print("PAT env var required"); return 1
    pairs, ctx = collect_pairs()
    missing_ar = [k for k in pairs if k not in AR]
    print(f"keys in code: {len(pairs)} · with Arabic: {len(pairs) - len(missing_ar)} · missing Arabic: {len(missing_ar)}")
    for k in missing_ar: print("  no-AR:", k)

    def esc(s): return s.replace("'", "''")
    rows = []
    for k, en in sorted(pairs.items()):
        ar = AR.get(k)
        rows.append(f"('{esc(k)}','{esc(en)}',{('N''' if False else '')}{'NULL' if ar is None else chr(39)+esc(ar)+chr(39)},'draft',{('NULL' if k not in ctx else chr(39)+esc(ctx[k])+chr(39))})")
    sql = ("insert into ui_strings (key, en, ar, status, context) values\n" + ",\n".join(rows) +
           "\non conflict (key) do update set en = excluded.en, "
           "ar = case when ui_strings.status = 'reviewed' then ui_strings.ar else coalesce(excluded.ar, ui_strings.ar) end, "
           "context = coalesce(excluded.context, ui_strings.context);")
    req = urllib.request.Request("https://api.supabase.com/v1/projects/iiozvqntawxfwbgffzqu/database/query",
        data=json.dumps({"query": sql}).encode(), method="POST",
        headers={"Authorization": f"Bearer {pat}", "Content-Type": "application/json", "User-Agent": "inspection-app/1.0"})
    try:
        r = urllib.request.urlopen(req); print("SEEDED", r.status)
    except urllib.error.HTTPError as e:
        print("ERROR", e.code, e.read().decode()[:500]); return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())
