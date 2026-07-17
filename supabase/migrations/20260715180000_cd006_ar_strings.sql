-- CD-006 / SCR-ADM-011 — Regulation Detail and Version · Arabic localization seed
-- Seeded as status='draft' (machine/unreviewed) — human localization review is the
-- gate to 'reviewed', per migration 0013. Upsert never overwrites a human-reviewed row.
-- Not a product-scope change: Arabic values for the new detail-dossier UI strings only.

insert into ui_strings (key, en, ar, status, context) values
  ('admin.reg.detail.back',                 '← Back to regulation library', '← العودة إلى مكتبة اللوائح', 'draft', 'CD-006'),
  ('admin.reg.detail.notFound.title',       'Regulation not found', 'اللائحة غير موجودة', 'draft', 'CD-006'),
  ('admin.reg.detail.notFound.body',        'It may have been removed, or the link is wrong.', 'ربما أُزيلت، أو الرابط غير صحيح.', 'draft', 'CD-006'),
  ('admin.reg.detail.degraded.title',       'Couldn’t load this regulation.', 'تعذّر تحميل هذه اللائحة.', 'draft', 'CD-006'),
  ('admin.reg.detail.degraded.body',        'Try again.', 'حاول مرة أخرى.', 'draft', 'CD-006'),
  ('admin.reg.detail.meta.created',         'Created', 'تاريخ الإنشاء', 'draft', 'CD-006'),
  ('admin.reg.detail.meta.createdBy',       'Created by', 'أنشأها', 'draft', 'CD-006'),
  ('admin.reg.detail.meta.approvedBy',      'Approved by', 'اعتمدها', 'draft', 'CD-006'),
  ('admin.reg.detail.meta.publishedAt',     'Published', 'تاريخ النشر', 'draft', 'CD-006'),
  ('admin.reg.detail.meta.unknownActor',    'unavailable', 'غير متاح', 'draft', 'CD-006'),
  ('admin.reg.detail.meta.neverApproved',   'not yet approved', 'لم تُعتمد بعد', 'draft', 'CD-006'),
  ('admin.reg.detail.unmappedBanner',       '{n} clause(s) have no inspection-item mapping — publish is blocked until every clause has a consumer.', '{n} بندًا بلا عنصر تفتيش مرتبط — يُحظر النشر حتى يرتبط كل بند بعنصر.', 'draft', 'CD-006 — {n}'),
  ('admin.reg.detail.publishedImmutable',   'Published — immutable at the database boundary. Further changes require a governed successor draft (not yet built; no lineage model authorized).', 'مُنشورة — غير قابلة للتعديل على مستوى قاعدة البيانات. أي تغيير يتطلب مسودة خَلَف معتمدة (غير مبنية بعد؛ لا يوجد نموذج نسب معتمد).', 'draft', 'CD-006'),
  ('admin.reg.detail.clauseNav',            'Clause navigator', 'متصفح البنود', 'draft', 'CD-006'),
  ('admin.reg.detail.dependencyRail',       'Mapped inspection items', 'عناصر التفتيش المرتبطة', 'draft', 'CD-006'),
  ('admin.reg.detail.mappedCount',          '{n} item(s)', '{n} عنصر', 'draft', 'CD-006 — {n}'),
  ('admin.reg.detail.unmappedTag',          'unmapped', 'غير مرتبط', 'draft', 'CD-006'),
  ('admin.reg.detail.audit.title',          'Audit timeline', 'السجل الزمني للتدقيق', 'draft', 'CD-006'),
  ('admin.reg.detail.audit.body',           'Not available here — compliance_admin/form_admin roles have no audit_events read grant (RLS). This is a disclosure, not a working control.', 'غير متاح هنا — أدوار compliance_admin/form_admin لا تملك صلاحية قراءة audit_events (RLS). هذا إفصاح، وليس عنصرًا فعالًا.', 'draft', 'CD-006'),
  ('admin.reg.detail.routeGuard.title',     'Access control', 'التحكم في الوصول', 'draft', 'CD-006'),
  ('admin.reg.detail.routeGuard.body',      'No admin route guard is proven. Navigation visibility is not authorization (owner: platform).', 'لا يوجد تحقق مثبت لحارس المسار الإداري. ظهور عنصر التنقل ليس تفويضًا (الجهة المسؤولة: المنصة).', 'draft', 'CD-006'),
  ('admin.reg.detail.lineage.title',        'Version compare / lineage', 'مقارنة الإصدارات / النسب', 'draft', 'CD-006'),
  ('admin.reg.detail.lineage.body',         'Not evaluated — no successor-version model is authorized for regulations yet.', 'لم يُقيَّم — لا يوجد نموذج إصدار خَلَف معتمد للوائح بعد.', 'draft', 'CD-006'),
  ('admin.reg.detail.depEngine.title',      'Dependency engine', 'محرك التبعيات', 'draft', 'CD-006'),
  ('admin.reg.detail.depEngine.body',       'Not evaluated — clause→item mapping above is read directly from the schema, not a dependency engine.', 'لم يُقيَّم — الربط أعلاه بين البند والعنصر مقروء مباشرة من المخطط، وليس ناتج محرك تبعيات.', 'draft', 'CD-006')
on conflict (key) do update
  set ar = excluded.ar, en = excluded.en, context = excluded.context
  where ui_strings.status = 'draft';   -- never clobber a human-reviewed translation
