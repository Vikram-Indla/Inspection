-- CD-004 / SCR-ADM-001 / /admin — Approval & Configuration overview · Arabic localization seed
-- Arabic values are the authored copy from the CD-004 R2 Claude Design pack
-- (project 90d4620c-118f-4359-8b3e-767d37d3cabd,
--  LOCALIZATION_INVENTORY_CD-004_R2.csv — admin.overview.r2.* keys).
-- Seeded as status='draft' (machine/unreviewed) — human localization review is the
-- gate to 'reviewed', per migration 0013. Upsert is guarded so it NEVER overwrites
-- a row a human already reviewed, and shared keys keep their existing values.
-- Not a product-scope change: these are Arabic values for already-accepted EN UI
-- strings; no new Arabic scope, policy, or behaviour is introduced.

insert into ui_strings (key, en, ar, status, context) values
  ('admin.overview.r2.title',              'Approval & Configuration — overview', 'الاعتماد والتهيئة — نظرة عامة', 'draft', 'CD-004 SCR-ADM-001'),
  ('admin.overview.r2.a11y.skip',          'Skip to overview', 'تخطٍّ إلى النظرة العامة', 'draft', 'CD-004 a11y'),
  ('admin.overview.r2.readAt',             'page read {time} — a source fact not a platform-health verdict', 'قُرئت هذه الصفحة {time} — حقيقة مصدر لا حكم على سلامة المنظومة', 'draft', 'CD-004 header — {time}'),
  ('admin.overview.r2.lozenge.partial',    '{n} source unavailable', '{n} مصدر غير متاح', 'draft', 'CD-004 header — {n}'),
  ('admin.overview.r2.spine.caption',      'Configuration evidence spine', 'سلسلة أدلة التهيئة', 'draft', 'CD-004 table caption'),
  ('admin.overview.r2.col.family',         'Family', 'العائلة', 'draft', 'CD-004 col'),
  ('admin.overview.r2.col.read',           'Read result', 'نتيجة القراءة', 'draft', 'CD-004 col'),
  ('admin.overview.r2.col.lifecycle',      'Proven lifecycle', 'دورة الحياة المثبتة', 'draft', 'CD-004 col'),
  ('admin.overview.r2.col.action',         'Action', 'الإجراء', 'draft', 'CD-004 col'),
  ('admin.overview.r2.family.compliance',  'Compliance Library', 'مكتبة الامتثال', 'draft', 'CD-004 family'),
  ('admin.overview.r2.family.packages',    'Packages & Surveys', 'الحزم والاستبيانات', 'draft', 'CD-004 family'),
  ('admin.overview.r2.family.enforcement', 'Enforcement Library', 'مكتبة الإنفاذ', 'draft', 'CD-004 family'),
  ('admin.overview.r2.family.engines',     'Engine settings', 'إعدادات المحركات', 'draft', 'CD-004 family'),
  ('admin.overview.r2.family.audit',       'Audit trail', 'سجل التدقيق', 'draft', 'CD-004 family'),
  ('admin.overview.r2.read.verified',      'read verified', 'قراءة مؤكدة', 'draft', 'CD-004 state — paired with glyph'),
  ('admin.overview.r2.read.verifiedZero',  'read verified — genuinely empty', 'قراءة مؤكدة — فارغة فعلًا', 'draft', 'CD-004 state — distinct from unavailable'),
  ('admin.overview.r2.read.unavailable',   'read failed — count unknown, not zero', 'تعذّرت القراءة — العدد غير معروف، وليس صفرًا', 'draft', 'CD-004 state — never zero'),
  ('admin.overview.r2.read.retry',         'Retry reading {family}', 'إعادة محاولة قراءة {family}', 'draft', 'CD-004 a11y name — {family}'),
  ('admin.overview.r2.lifecycle.packages', 'draft/published proven · distinct approver enforced · immutable once published', 'مسودة/منشور مثبتان · اعتماد من شخص مختلف مُلزَم · المنشور غير قابل للتعديل', 'draft', 'CD-004 lifecycle — schema-proven words only'),
  ('admin.overview.r2.lifecycle.regulations', 'per-regulation status lives in the module; no update timestamp is read here', 'تُعرض حالة كل لائحة داخل الوحدة؛ لا يُقرأ تاريخ تحديث هنا', 'draft', 'CD-004 lifecycle'),
  ('admin.overview.r2.lifecycle.engines',  'direct audited update — timestamp is provenance only', 'تحديث مباشر مُدقَّق — التاريخ حقيقة إسناد فقط', 'draft', 'CD-004 lifecycle'),
  ('admin.overview.r2.open',               'Open {family}', 'فتح {family}', 'draft', 'CD-004 link name — {family}'),
  ('admin.overview.r2.linkOnly.heading',   'Families this gateway reads no data for today — links only:', 'عائلات لا يقرأ هذا المدخل بياناتها اليوم — روابط فقط:', 'draft', 'CD-004 band'),
  ('admin.overview.r2.scope.heading',      'Your scope — {role}', 'نطاق دورك — {role}', 'draft', 'CD-004 band — {role}'),
  ('admin.overview.r2.scope.body',         'You can act in {families}. Other families are shown for awareness; visibility grants nothing — every action is authorized inside its module.', 'تملك صلاحية التصرف في {families}. بقية العائلات للاطلاع؛ الظهور في القائمة لا يمنح صلاحية — تُفرض الصلاحية عند كل إجراء داخل وحدته.', 'draft', 'CD-004 band — {families}'),
  ('admin.overview.r2.scope.none',         'none', 'لا شيء', 'draft', 'CD-004 scope — no act-family'),
  ('admin.overview.r2.totalFailure',       'Configuration sources couldn''t be read. Nothing shown is current. Your session and navigation still work.', 'تعذّرت قراءة مصادر التهيئة. لا شيء معروض هنا حديثًا. جلستك والتنقل يعملان.', 'draft', 'CD-004 total-failure — no platform verdict'),
  ('admin.overview.r2.retryAll',           'Retry all', 'إعادة محاولة الكل', 'draft', 'CD-004 (blocked mechanism — seeded only)'),
  ('admin.overview.r2.recovered',          '{family} verified again — {count} records read at {time}', 'عادت قراءة {family} مؤكدة — {count} سجلًا قُرئت {time}', 'draft', 'CD-004 (blocked mechanism — seeded only)'),
  ('admin.overview.r2.stale',              'Read at {time} and not refreshed since. No staleness verdict exists — the age is shown.', 'قُرئت {time} ولم تُحدَّث منذ ذلك. لا يوجد حكم تقادم — يُعرض العمر فقط.', 'draft', 'CD-004 (blocked mechanism — seeded only)'),
  ('admin.overview.r2.refresh',            'Refresh', 'تحديث', 'draft', 'CD-004 (deferred — seeded only)'),
  ('admin.overview.r2.unauthorized.title', 'This area isn''t available to you', 'هذه المنطقة غير متاحة لك', 'draft', 'CD-004 (guard HANDOFF_BLOCKED — seeded only)'),
  ('admin.overview.r2.unauthorized.body',  'Approval & Configuration requires an administration role. Nothing was loaded or changed.', 'يتطلب قسم الاعتماد والتهيئة دورًا إداريًا. لم يُحمَّل أو يتغيّر شيء.', 'draft', 'CD-004 (guard HANDOFF_BLOCKED — seeded only)'),
  ('admin.overview.r2.empty.compliance',   'The library is genuinely empty — the read succeeded. Add the first regulation inside the module.', 'المكتبة فارغة فعلًا — نجحت القراءة. أضف أول لائحة داخل الوحدة.', 'draft', 'CD-004 verified-zero hint')
on conflict (key) do update
  set ar = excluded.ar, en = excluded.en, context = excluded.context
  where ui_strings.status = 'draft';   -- never clobber a human-reviewed translation
