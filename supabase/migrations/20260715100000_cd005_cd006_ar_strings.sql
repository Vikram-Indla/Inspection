-- CD-005 (SCR-ADM-010) + CD-006 (SCR-ADM-011) / /admin/regulations — Arabic seed.
-- Values marked "authored" come from LOCALIZATION_INVENTORY_CD-005_R1.csv (the Claude
-- Design pack authored Arabic). Values marked "machine" have NO authored Arabic in the
-- pack yet — they are seeded as status='draft' (unreviewed) exactly like the CD-004
-- migration did for its blocked-mechanism keys; human localization review is the gate to
-- 'reviewed'. Upsert NEVER clobbers a human-reviewed row (guard: status='draft').
-- Not a product-scope change: Arabic for already-accepted EN UI strings only.

insert into ui_strings (key, en, ar, status, context) values
  -- proven-action forms (create / clause / publish)
  ('admin.reg.form.code',                 'Code', 'الكود', 'draft', 'CD-005 form'),
  ('admin.reg.form.title',                'Title', 'العنوان', 'draft', 'CD-005/006 form'),
  ('admin.reg.form.issuingAuthority',     'Issuing authority', 'الجهة المُصدِرة', 'draft', 'CD-005 form'),
  ('admin.reg.form.titlePlaceholder',     'Regulation title', 'عنوان اللائحة', 'draft', 'CD-005 form'),
  ('admin.reg.form.creating',             'Creating…', 'جارٍ الإنشاء…', 'draft', 'CD-005 form'),
  ('admin.reg.form.create',               'Create draft regulation', 'إنشاء مسودة لائحة', 'draft', 'CD-005 form (authored)'),
  ('admin.reg.form.created',              'Draft created', 'أُنشئت المسودة', 'draft', 'CD-005 form'),
  ('admin.reg.clause.ref',                'Clause §', 'البند §', 'draft', 'CD-006 clause form'),
  ('admin.reg.clause.legalSource',        'Legal source', 'المصدر القانوني', 'draft', 'CD-006 clause form'),
  ('admin.reg.clause.legalSourcePlaceholder', 'Royal Decree M/43 art. 12', 'المرسوم الملكي م/43 المادة 12', 'draft', 'CD-006 clause form'),
  ('admin.reg.clause.applicability',      'Applicability', 'نطاق التطبيق', 'draft', 'CD-006 clause form'),
  ('admin.reg.clause.adding',             'Adding…', 'جارٍ الإضافة…', 'draft', 'CD-006 clause form'),
  ('admin.reg.clause.add',                'Add clause', 'إضافة بند', 'draft', 'CD-006 clause form'),
  ('admin.reg.clause.added',              'Clause added', 'أُضيف البند', 'draft', 'CD-006 clause form'),
  ('admin.reg.clause.notAudited',         'Clause changes are not audit-tracked — only regulation-row changes are.', 'تغييرات البنود غير مُدقَّقة — تُدقَّق تغييرات صف اللائحة فقط.', 'draft', 'CD-006 truth note (machine)'),
  ('admin.reg.publishing',                'Publishing…', 'جارٍ النشر…', 'draft', 'CD-006 publish'),
  ('admin.reg.publish',                   'Publish now (direct)', 'نشر الآن (مباشر)', 'draft', 'CD-006 direct publish (machine)'),

  -- register / discovery (CD-005)
  ('admin.reg.r1.title',                  'Compliance Library — regulation register', 'مكتبة الامتثال — سجل اللوائح', 'draft', 'CD-005 title (authored)'),
  ('admin.reg.r1.search.placeholder',     'Search code, title, authority…', 'بحث بالكود أو العنوان أو الجهة…', 'draft', 'CD-005 search (authored)'),
  ('admin.reg.r1.filter.all',             'All {n}', 'الكل {n}', 'draft', 'CD-005 filter — {n} (authored)'),
  ('admin.reg.r1.filter.published',       'Published {n}', 'منشورة {n}', 'draft', 'CD-005 filter — {n} (authored)'),
  ('admin.reg.r1.filter.draft',           'Draft {n}', 'مسودة {n}', 'draft', 'CD-005 filter — {n} (authored)'),
  ('admin.reg.r1.filter.legend',          'Filter by lifecycle', 'تصفية حسب دورة الحياة', 'draft', 'CD-005 filter group (machine)'),
  ('admin.reg.r1.status.published',       'Published', 'منشورة', 'draft', 'CD-005 status glyph ● (authored)'),
  ('admin.reg.r1.status.draft',           'Draft', 'مسودة', 'draft', 'CD-005 status glyph ◌ (authored)'),
  ('admin.reg.r1.openDossier',            'Open dossier', 'فتح الملف', 'draft', 'CD-006 logical-detail link (machine)'),
  ('admin.reg.r1.filteredEmpty.title',    'No regulations match', 'لا لوائح مطابقة', 'draft', 'CD-005 filtered-empty (machine)'),
  ('admin.reg.r1.filteredEmpty.body',     'The register itself is not empty — clear the search or lifecycle filter.', 'السجل نفسه ليس فارغًا — امسح البحث أو مرشّح دورة الحياة.', 'draft', 'CD-005 filtered-empty (machine)'),
  ('admin.reg.r1.createdAt',              'created', 'أُنشئت', 'draft', 'CD-005 row meta (machine)'),
  ('admin.reg.r1.readAt',                 'read at {time} — not refreshed since; no staleness verdict exists, the age is shown', 'قُرئت {time} ولم تُحدَّث منذ ذلك؛ لا يوجد حكم تقادم، يُعرض العمر فقط', 'draft', 'CD-005 stale — {time}, no invented SLA (machine)'),

  -- impact footprint rail (CD-005) — unknown ≠ zero
  ('admin.reg.r1.rail.heading',           'Impact footprint — from regulation to what actually gets inspected', 'بصمة الأثر — من اللائحة إلى ما يُفحص فعليًا', 'draft', 'CD-005 rail (authored)'),
  ('admin.reg.r1.rail.regulation',        'REGULATION', 'اللائحة', 'draft', 'CD-005 rail col (authored)'),
  ('admin.reg.r1.rail.clauses',           'CLAUSES — read verified', 'البنود — قراءة مؤكدة', 'draft', 'CD-005 rail col (authored)'),
  ('admin.reg.r1.rail.clauses.unknown',   'clause read failed — count unknown, not zero', 'تعذّرت قراءة البنود — العدد غير معروف وليس صفرًا', 'draft', 'CD-005 rail — never zero (machine)'),
  ('admin.reg.r1.rail.clauses.zero',      'no clauses (verified zero)', 'لا بنود (صفر مؤكد)', 'draft', 'CD-005 rail — verified zero (machine)'),
  ('admin.reg.r1.rail.items',             'MAPPED ITEMS — read verified', 'العناصر المرتبطة — قراءة مؤكدة', 'draft', 'CD-005 rail col (authored)'),
  ('admin.reg.r1.rail.items.unknown',     'mapped-item read failed — impact unknown, not zero', 'تعذّرت قراءة عناصر الربط — الأثر غير معروف وليس صفرًا', 'draft', 'CD-005 rail — never zero (authored)'),
  ('admin.reg.r1.rail.items.zero',        'no mapped items (verified zero)', 'لا عناصر مرتبطة (صفر مؤكد)', 'draft', 'CD-005 rail — verified zero (authored)'),
  ('admin.reg.r1.rail.beyond',            'BEYOND ITEMS', 'ما بعد العناصر', 'draft', 'CD-005 rail col (authored)'),
  ('admin.reg.r1.rail.notEvaluated',      'Not evaluated — no verified source', 'غير مُقيَّم — لا مصدر مؤكد', 'draft', 'CD-005 rail — blocked (authored)'),
  ('admin.reg.r1.invalid.noClauses',      'draft with no clauses — incomplete; publishing it would be meaningless', 'مسودة بلا بنود — غير مكتملة؛ لا معنى لنشرها', 'draft', 'CD-005 invalid record (authored)'),

  -- empty / degraded / recovery / read-only (S03/S05/S06/S08/S09)
  ('admin.reg.r1.empty.title',            'No regulations configured', 'لا لوائح مُهيّأة', 'draft', 'CD-005 verified-zero (machine)'),
  ('admin.reg.r1.empty.body',             'The read succeeded — the library is genuinely empty (MVP1-M09-001: regulations are the parents of inspection items).', 'نجحت القراءة — المكتبة فارغة فعلًا (MVP1-M09-001: اللوائح هي أصول عناصر الفحص).', 'draft', 'CD-005 verified-zero (machine)'),
  ('admin.reg.r1.empty.body.writer',      'The read succeeded — the library is genuinely empty. Create the first regulation above (MVP1-M09-001: regulations are the parents of inspection items).', 'نجحت القراءة — المكتبة فارغة فعلًا. أنشئ أول لائحة بالأعلى (MVP1-M09-001: اللوائح هي أصول عناصر الفحص).', 'draft', 'CD-005 verified-zero writer (machine)'),
  ('admin.reg.r1.degraded.chip',          'register unavailable', 'السجل غير متاح', 'draft', 'CD-005 degraded chip (machine)'),
  ('admin.reg.r1.degraded.title',         'The regulation register couldn''t be read.', 'تعذّرت قراءة سجل اللوائح.', 'draft', 'CD-005 degraded (machine)'),
  ('admin.reg.r1.degraded.body',          'Nothing is shown as zero — the count is unknown, not empty. Your session and navigation still work.', 'لا شيء يُعرض كصفر — العدد غير معروف وليس فارغًا. جلستك والتنقل يعملان.', 'draft', 'CD-005 degraded — never zero (machine)'),
  ('admin.reg.r1.retry',                  'Retry read', 'إعادة القراءة', 'draft', 'CD-005 recovery (authored)'),
  ('admin.reg.r1.readonly.title',         'Read-only for your role', 'للقراءة فقط حسب دورك', 'draft', 'CD-005 read-only (machine)'),
  ('admin.reg.r1.readonly.reviewer.title','Reviewer — read-only', 'مراجع — للقراءة فقط', 'draft', 'CD-006 reviewer read-only (machine)'),
  ('admin.reg.r1.readonly.body',          'You can view configuration; creating, adding clauses, and publishing require a Compliance or Form Admin role and are enforced by row-level security. A dedicated Admin-family route guard is not implemented (HANDOFF_BLOCKED, owner: platform) — visibility here grants nothing.', 'يمكنك عرض التهيئة؛ الإنشاء وإضافة البنود والنشر تتطلب دور مسؤول امتثال أو مسؤول نماذج، وتُفرض عبر أمن مستوى الصف. لا يوجد حارس مسار مخصّص لعائلة الإدارة (HANDOFF_BLOCKED، المالك: المنصّة) — الظهور هنا لا يمنح صلاحية.', 'draft', 'CD-005 RLS-vs-persona (machine)'),

  -- blocked-target labels (shared)
  ('admin.reg.r1.blocked.tag',            'HANDOFF_BLOCKED', 'HANDOFF_BLOCKED', 'draft', 'CD-006 blocked tag — technical token'),
  ('admin.reg.r1.blocked.owner',          'owner:', 'المالك:', 'draft', 'CD-006 blocked owner label (machine)'),

  -- detail dossier (CD-006)
  ('admin.reg.r1.backToRegister',         'Back to register', 'العودة إلى السجل', 'draft', 'CD-006 detail nav (machine)'),
  ('admin.reg.r1.detail.notFound.title',  'Regulation not found', 'اللائحة غير موجودة', 'draft', 'CD-006 not-found (machine)'),
  ('admin.reg.r1.detail.notFound.body',   'The read succeeded but no regulation has this identifier. It may have been removed.', 'نجحت القراءة لكن لا لائحة بهذا المعرّف. ربما حُذفت.', 'draft', 'CD-006 not-found (machine)'),
  ('admin.reg.r1.detail.auditNote',       'Regulation-row changes are audit-tracked by the generic trigger. Clause additions on this dossier are NOT audited.', 'تُدقَّق تغييرات صف اللائحة عبر المُشغّل العام. إضافات البنود في هذا الملف غير مُدقَّقة.', 'draft', 'CD-006 audit truth (machine)'),
  ('admin.reg.r1.detail.clauses.heading', 'Clauses & mapped inspection items', 'البنود وعناصر الفحص المرتبطة', 'draft', 'CD-006 clause navigator (machine)'),
  ('admin.reg.r1.detail.clauses.empty.title', 'No clauses yet', 'لا بنود بعد', 'draft', 'CD-006 empty clauses (machine)'),
  ('admin.reg.r1.detail.clauses.empty.body', 'This regulation has no clauses. Add the first clause below — the read succeeded, it is genuinely empty.', 'لا تحتوي هذه اللائحة على بنود. أضف أول بند بالأسفل — نجحت القراءة، وهي فارغة فعلًا.', 'draft', 'CD-006 empty clauses (machine)'),
  ('admin.reg.r1.detail.col.clause',      'Clause', 'البند', 'draft', 'CD-006 col (machine)'),
  ('admin.reg.r1.detail.col.mappedItems', 'Mapped items', 'العناصر المرتبطة', 'draft', 'CD-006 col (machine)'),
  ('admin.reg.r1.detail.beyond',          'Downstream of mapped items (packages, active visits, violations, reports): Not evaluated — no verified source (HANDOFF_BLOCKED, owner: product/backend).', 'ما بعد العناصر المرتبطة (الحزم، الزيارات النشطة، المخالفات، التقارير): غير مُقيَّم — لا مصدر مؤكد (HANDOFF_BLOCKED، المالك: المنتج/الواجهة الخلفية).', 'draft', 'CD-006 dependency rail — blocked (machine)'),
  ('admin.reg.r1.detail.actions.heading', 'Author & publish', 'التأليف والنشر', 'draft', 'CD-006 actions (machine)'),
  ('admin.reg.r1.detail.publish.direct',  'Direct draft→published — applies immediately, no validation gate, and is audited on the regulation row.', 'نشر مباشر من مسودة إلى منشور — يُطبَّق فورًا، دون بوابة تحقّق، ويُدقَّق على صف اللائحة.', 'draft', 'CD-006 direct publish truth (machine)'),
  ('admin.reg.r1.detail.validation.title','Contract-safe validated publish is not available', 'النشر المُتحقَّق الآمن تعاقديًا غير متاح', 'draft', 'CD-006 S04 disclosure (machine)'),
  ('admin.reg.r1.detail.validation.body', 'The mapped-clause validation gate, maker-checker, and published-immutability lock do not exist yet — the only proven publish is the direct one above.', 'بوابة التحقّق من ربط البنود، ومبدأ المُنفِّذ والمُدقِّق، وقفل عدم قابلية تعديل المنشور غير موجودة بعد — النشر المُثبت الوحيد هو المباشر أعلاه.', 'draft', 'CD-006 S04 disclosure (machine)'),
  ('admin.reg.r1.detail.validation.unmapped', 'For awareness: {n} clause(s) have no mapped inspection items. This is disclosure, not a blocker — direct publish will still apply.', 'للعلم: {n} بند(بنود) بلا عناصر فحص مرتبطة. هذا إفصاح وليس مانعًا — سيُطبَّق النشر المباشر رغم ذلك.', 'draft', 'CD-006 S04 unmapped — {n} (machine)'),
  ('admin.reg.r1.detail.published.title',  'Published — immutability is not enforced', 'منشورة — عدم القابلية للتعديل غير مفروض', 'draft', 'CD-006 published truth (machine)'),
  ('admin.reg.r1.detail.published.body',   'No published-version lock exists for regulations (HANDOFF_BLOCKED, owner: product/backend). Changes are not prevented by the platform; treat published regulations as authoritative by process, not by lock.', 'لا يوجد قفل للنسخة المنشورة للوائح (HANDOFF_BLOCKED، المالك: المنتج/الواجهة الخلفية). المنصّة لا تمنع التغييرات؛ عامِل اللوائح المنشورة كمرجعية بالإجراء لا بالقفل.', 'draft', 'CD-006 published truth (machine)'),
  ('admin.reg.r1.detail.blocked.heading',  'Governed capabilities — not implemented', 'القدرات المحكومة — غير مُنفّذة', 'draft', 'CD-006 blocked section (machine)'),
  ('admin.reg.r1.detail.blocked.validatedPublish', 'Submit for validated publish', 'إرسال لنشر مُتحقَّق', 'draft', 'CD-006 blocked target (machine)'),
  ('admin.reg.r1.detail.blocked.validatedPublish.reason', 'mapped-clause validation + maker-checker + published lock', 'التحقّق من ربط البنود + المُنفِّذ والمُدقِّق + قفل المنشور', 'draft', 'CD-006 blocked reason (machine)'),
  ('admin.reg.r1.detail.blocked.compare',  'Compare versions / lineage', 'مقارنة الإصدارات / السلالة', 'draft', 'CD-006 blocked target (machine)'),
  ('admin.reg.r1.detail.blocked.compare.reason', 'no version history, compare, or supersede model exists', 'لا يوجد سجل إصدارات أو مقارنة أو نموذج إحلال', 'draft', 'CD-006 blocked reason (machine)'),
  ('admin.reg.r1.detail.blocked.dependency', 'Run dependency validation', 'تشغيل التحقّق من الاعتماديات', 'draft', 'CD-006 blocked target (machine)'),
  ('admin.reg.r1.detail.blocked.dependency.reason', 'no dependency/overlap engine exists', 'لا يوجد محرّك اعتماديات/تداخل', 'draft', 'CD-006 blocked reason (machine)'),
  ('admin.reg.r1.detail.blocked.audit',    'Open audit timeline', 'فتح الخط الزمني للتدقيق', 'draft', 'CD-006 blocked target (machine)'),
  ('admin.reg.r1.detail.blocked.audit.reason', 'audit_events read is not granted to compliance/form admin', 'قراءة audit_events غير ممنوحة لمسؤول الامتثال/النماذج', 'draft', 'CD-006 blocked reason (machine)'),
  ('admin.reg.r1.detail.blocked.route',    'Open dedicated detail route', 'فتح مسار التفاصيل المخصّص', 'draft', 'CD-006 blocked target (machine)'),
  ('admin.reg.r1.detail.blocked.route.reason', '/admin/regulations/:id is not implemented — this dossier is a logical mode', '‏/admin/regulations/:id غير مُنفّذ — هذا الملف وضع منطقي', 'draft', 'CD-006 blocked reason (machine)'),
  ('admin.reg.r1.detail.blocked.owner.productBackend', 'product/backend', 'المنتج/الواجهة الخلفية', 'draft', 'CD-006 blocked owner (machine)'),
  ('admin.reg.r1.detail.blocked.owner.backend', 'backend', 'الواجهة الخلفية', 'draft', 'CD-006 blocked owner (machine)'),
  ('admin.reg.r1.detail.blocked.owner.platform', 'platform', 'المنصّة', 'draft', 'CD-006 blocked owner (machine)')
on conflict (key) do update
  set ar = excluded.ar, en = excluded.en, context = excluded.context
  where ui_strings.status = 'draft';   -- never clobber a human-reviewed translation
