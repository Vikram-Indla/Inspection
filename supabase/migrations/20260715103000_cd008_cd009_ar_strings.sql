-- CD-008 / SCR-ADM-030 · Package Library (/admin/packages) and
-- CD-009 / SCR-ADM-031 · Package & Form Designer (designer mode of the same route)
-- · Arabic localization seed.
-- Arabic values are faithful Modern Standard Arabic for the already-accepted EN UI
-- strings authored in apps/web/src/app/admin/packages/{page,actions,DraftEditor,
-- PackagePreview,PublishControls,ImpactPanel}.tsx (every t("key","English") call).
-- Seeded as status='draft' (machine/unreviewed) — human localization review is the
-- gate to 'reviewed' (migration 0013). Upsert is guarded so it NEVER overwrites a
-- row a human already reviewed, and shared keys keep their existing values.
-- Not a product-scope change: these are Arabic values for accepted EN strings; no new
-- Arabic scope, policy, monetary, or legal value is introduced. Requirement IDs
-- (M09-*, RBAC-002), evidence IDs (B1-EV-001), placeholders ({n}/{label}/{visits}/
-- {inspections}) and item/violation/version codes stay literal — they are identifiers.

insert into ui_strings (key, en, ar, status, context) values
  -- Route + section headings ------------------------------------------------
  ('admin.pkg.title',                    'Package & Form Designer', 'مُصمِّم الحزم والنماذج', 'draft', 'CD-008/009 SCR-ADM-030/031 title'),
  ('admin.pkg.immutable.title',          'Published version — immutable.', 'نسخة منشورة — غير قابلة للتعديل.', 'draft', 'CD-008 S06 read-only banner'),
  ('admin.pkg.immutable.before',         'Edits are rejected by the database itself (trigger', 'تُرفَض التعديلات من قاعدة البيانات نفسها (المُشغِّل', 'draft', 'CD-008 immutable — precedes <code>trg_guard_pkg</code>'),
  ('admin.pkg.immutable.after',          ', proven in B1-EV-001). Changes require a new draft version.', '، مُثبَت في B1-EV-001). تتطلب التغييرات نسخة مسودة جديدة.', 'draft', 'CD-008 immutable — B1-EV-001 kept literal'),
  -- New-draft + publish controls (SCR-ADM-030) ------------------------------
  ('admin.pkg.newDraft.label',           'New draft version (M09-030)', 'نسخة مسودة جديدة (M09-030)', 'draft', 'CD-008 W03 create-draft'),
  ('admin.pkg.newDraft.creating',        'Creating…', 'جارٍ الإنشاء…', 'draft', 'CD-008 pending'),
  ('admin.pkg.newDraft.create',          'Create draft', 'إنشاء مسودة', 'draft', 'CD-008 W03 submit'),
  ('admin.pkg.newDraft.created',         'draft created', 'تم إنشاء المسودة', 'draft', 'CD-008 W03 success'),
  ('admin.pkg.publish.publishing',       'Publishing…', 'جارٍ النشر…', 'draft', 'CD-008/009 W04 pending'),
  ('admin.pkg.publish.approve',          'Approve & publish (maker-checker — RBAC-002)', 'اعتماد ونشر (فصل المُنشئ عن المعتمِد — RBAC-002)', 'draft', 'CD-008/009 W04 distinct-approver'),
  -- Draft editor (designer mode · SCR-ADM-031) ------------------------------
  ('admin.pkg.editor.heading',           'Draft editor — sections & items (M09-019/025)', 'محرِّر المسودة — الأقسام والبنود (M09-019/025)', 'draft', 'CD-009 W02 editor heading'),
  ('admin.pkg.editor.editable',          'editable while draft', 'قابل للتعديل ما دام مسودة', 'draft', 'CD-009 editor state'),
  ('admin.pkg.editor.mandatory',         'mandatory', 'إلزامي', 'draft', 'CD-009 section flag'),
  ('admin.pkg.editor.sectionTitleAria',  'Section title', 'عنوان القسم', 'draft', 'CD-009 a11y name'),
  ('admin.pkg.editor.removeAria',        'Remove', 'إزالة', 'draft', 'CD-009 a11y name — remove item'),
  ('admin.pkg.editor.addItem',           '+ add item…', '+ إضافة بند…', 'draft', 'CD-009 add-item option'),
  ('admin.pkg.editor.addItemAria',       'Add item', 'إضافة بند', 'draft', 'CD-009 a11y name'),
  ('admin.pkg.editor.newSectionTitle',   'New section title', 'عنوان قسم جديد', 'draft', 'CD-009 add-section input'),
  ('admin.pkg.editor.addSection',        'Add section', 'إضافة قسم', 'draft', 'CD-009 add-section submit'),
  ('admin.pkg.editor.draftSaved',        'draft saved', 'تم حفظ المسودة', 'draft', 'CD-009 W02 success'),
  ('admin.pkg.editor.saving',            'Saving…', 'جارٍ الحفظ…', 'draft', 'CD-009 pending'),
  ('admin.pkg.editor.save',              'Save draft definition', 'حفظ تعريف المسودة', 'draft', 'CD-009 W02 submit'),
  -- Read-only inspector preview (M09-028) -----------------------------------
  ('admin.pkg.preview.open',             'Preview as inspector (M09-028)', 'معاينة كما يراها المفتش (M09-028)', 'draft', 'CD-009 preview toggle'),
  ('admin.pkg.preview.close',            'Close preview', 'إغلاق المعاينة', 'draft', 'CD-009 preview toggle'),
  ('admin.pkg.preview.title',            'Field preview', 'معاينة ميدانية', 'draft', 'CD-009 preview title'),
  ('admin.pkg.preview.asInspector',      'Rendered exactly as the inspector sees this version in the field workspace.', 'تُعرَض تمامًا كما يرى المفتش هذه النسخة في مساحة العمل الميدانية.', 'draft', 'CD-009 preview — read-only, not a simulator'),
  ('admin.pkg.preview.conditionalWhen',  'Shown when', 'يظهر عند', 'draft', 'CD-009 preview conditional'),
  ('admin.pkg.preview.evidence',         'Evidence', 'الأدلة', 'draft', 'CD-009 preview evidence'),
  ('admin.pkg.preview.evMandatory',      'required', 'مطلوب', 'draft', 'CD-009 preview evidence'),
  ('admin.pkg.preview.evOptional',       'optional', 'اختياري', 'draft', 'CD-009 preview evidence'),
  ('admin.pkg.preview.evMin',            'min', 'الحد الأدنى', 'draft', 'CD-009 preview evidence min-count'),
  ('admin.pkg.preview.triggersForm',     'triggers action form', 'يُشغِّل نموذج إجراء', 'draft', 'CD-009 preview'),
  ('admin.pkg.preview.formBlocking',     'blocking', 'مانع', 'draft', 'CD-009 preview action-form'),
  ('admin.pkg.preview.formNonBlocking',  'non-blocking', 'غير مانع', 'draft', 'CD-009 preview action-form'),
  ('admin.pkg.preview.formAppearsWhen',  'This form opens when the inspector marks the item non-compliant.', 'يُفتح هذا النموذج عندما يُعلِّم المفتش البند بأنه غير مطابق.', 'draft', 'CD-009 preview action-form'),
  ('admin.pkg.preview.emptySection',     'Report-head fields — no checklist items.', 'حقول ترويسة التقرير — لا توجد بنود تدقيق.', 'draft', 'CD-009 preview report-head'),
  ('admin.pkg.preview.missingItem',      'item is not in the live item bank', 'البند غير موجود في بنك البنود الحي', 'draft', 'CD-009 preview missing item'),
  ('admin.pkg.preview.readOnly',         'read-only', 'للقراءة فقط', 'draft', 'CD-009 preview lozenge'),
  -- Version-row detail chips (SCR-ADM-030) ----------------------------------
  ('admin.pkg.ncArrow',                  'NC →', 'غير مطابق ←', 'draft', 'CD-008 non-compliant maps to violation code'),
  ('admin.pkg.mandatory',                'mandatory', 'إلزامي', 'draft', 'CD-008 section flag'),
  ('admin.pkg.blockingActionForm',       'blocking action form', 'نموذج إجراء مانع', 'draft', 'CD-008 item chip'),
  ('admin.pkg.conditional',              'conditional', 'مشروط', 'draft', 'CD-008 item chip'),
  ('admin.pkg.evidenceRule',             'evidence rule', 'قاعدة أدلة', 'draft', 'CD-008 item chip'),
  ('admin.pkg.weight',                   'weight', 'الوزن', 'draft', 'CD-008 item score weight'),
  ('admin.pkg.reportHead',               'report-head fields', 'حقول ترويسة التقرير', 'draft', 'CD-008 empty-section caption'),
  ('admin.pkg.actionForms',              'Action forms:', 'نماذج الإجراء:', 'draft', 'CD-008 version footer'),
  ('admin.pkg.blocking',                 'blocking', 'مانع', 'draft', 'CD-008 action-form flag'),
  ('admin.pkg.actionFormsNote',          '· consumed at runtime exactly as configured (M09-019/030).', '· تُستهلَك أثناء التشغيل تمامًا كما هي مُهيَّأة (M09-019/030).', 'draft', 'CD-008 version footer note'),
  -- Publish-impact panel (M09-013) ------------------------------------------
  ('admin.pkg.impact.title',             'Publish impact (M09-013)', 'أثر النشر (M09-013)', 'draft', 'CD-008 impact heading'),
  ('admin.pkg.impact.pinnedTitle',       'In-flight work on prior published versions', 'أعمال جارية على نسخ منشورة سابقة', 'draft', 'CD-008 impact section 1'),
  ('admin.pkg.impact.pinnedNone',        'No active visits or inspections are pinned to a prior published version.', 'لا توجد زيارات أو عمليات تفتيش نشطة مرتبطة بنسخة منشورة سابقة.', 'draft', 'CD-008 impact — verified-none, not a false zero'),
  ('admin.pkg.impact.pinnedVisits',      '{n} active visit(s)', '{n} زيارة نشطة', 'draft', 'CD-008 impact — {n} literal'),
  ('admin.pkg.impact.pinnedInspections', '{n} active inspection(s)', '{n} عملية تفتيش نشطة', 'draft', 'CD-008 impact — {n} literal'),
  ('admin.pkg.impact.pinnedHint',        'These run on the version they downloaded (frozen — M09-030); publishing does not re-version them.', 'تعمل هذه على النسخة التي جرى تنزيلها (مجمَّدة — M09-030)؛ والنشر لا يُعيد ترقيمها بنسخة جديدة.', 'draft', 'CD-008 impact hint'),
  ('admin.pkg.impact.pinnedUnavailable', 'In-flight counts are outside your read scope.', 'أعداد الأعمال الجارية خارج نطاق قراءتك.', 'draft', 'CD-008 S08 — unavailable, never zero'),
  ('admin.pkg.impact.priorLead',         'By prior version:', 'حسب النسخة السابقة:', 'draft', 'CD-008 impact prior list'),
  ('admin.pkg.impact.priorLine',         '{label}: {visits} visit(s), {inspections} inspection(s)', '{label}: {visits} زيارة، {inspections} عملية تفتيش', 'draft', 'CD-008 impact — {label}/{visits}/{inspections} literal'),
  ('admin.pkg.impact.refTitle',          'Other published packages sharing these items', 'حزم منشورة أخرى تشترك في هذه البنود', 'draft', 'CD-008 impact section 2'),
  ('admin.pkg.impact.refNone',           'No other published package references items in this version.', 'لا توجد حزمة منشورة أخرى تشير إلى بنود في هذه النسخة.', 'draft', 'CD-008 impact — verified-none'),
  ('admin.pkg.impact.refShares',         'shares {n} item(s)', 'تشترك في {n} بند', 'draft', 'CD-008 impact — {n} literal'),
  ('admin.pkg.impact.diffTitle',         'Changes vs the currently-published version', 'التغييرات مقارنةً بالنسخة المنشورة حاليًا', 'draft', 'CD-008 impact section 3'),
  ('admin.pkg.impact.diffVsCurrent',     'Compared against {label}:', 'بالمقارنة مع {label}:', 'draft', 'CD-008 impact — {label} literal'),
  ('admin.pkg.impact.diffIsCurrent',     'This is the currently-published version.', 'هذه هي النسخة المنشورة حاليًا.', 'draft', 'CD-008 impact diff'),
  ('admin.pkg.impact.diffNoBaseline',    'No published version yet — this would be the first.', 'لا توجد نسخة منشورة بعد — ستكون هذه الأولى.', 'draft', 'CD-008 impact diff'),
  ('admin.pkg.impact.added',             'Added', 'مُضاف', 'draft', 'CD-008 impact diff label'),
  ('admin.pkg.impact.removed',           'Removed', 'مُزال', 'draft', 'CD-008 impact diff label'),
  ('admin.pkg.impact.moved',             'Moved section', 'نُقِل بين الأقسام', 'draft', 'CD-008 impact diff label'),
  ('admin.pkg.impact.formsAdded',        'Forms added', 'نماذج مُضافة', 'draft', 'CD-008 impact diff label'),
  ('admin.pkg.impact.formsRemoved',      'Forms removed', 'نماذج مُزالة', 'draft', 'CD-008 impact diff label'),
  ('admin.pkg.impact.noChanges',         'No item or action-form changes vs the published version.', 'لا تغييرات في البنود أو نماذج الإجراء مقارنةً بالنسخة المنشورة.', 'draft', 'CD-008 impact diff empty'),
  -- Shared field-workspace strings consumed by the preview (field.ws.*) ------
  ('field.ws.conditional',               'Conditional', 'مشروط', 'draft', 'CD-009 preview (shared field.ws.*)'),
  ('field.ws.guidance',                  'Guidance', 'إرشاد', 'draft', 'CD-009 preview (shared field.ws.*)'),
  ('field.ws.date.label',                'Recorded date', 'التاريخ المُسجَّل', 'draft', 'CD-009 preview (shared field.ws.*)'),
  ('field.ws.note.label',                'Inspector note', 'ملاحظة المفتش', 'draft', 'CD-009 preview (shared field.ws.*)'),
  ('field.ws.note.placeholder',          'Add an observation note (saved with the answer)…', 'أضف ملاحظة رصد (تُحفظ مع الإجابة)…', 'draft', 'CD-009 preview (shared field.ws.*)'),
  -- Enum / field display labels (DB values untouched — SB19) -----------------
  ('enum.compliant',                     'compliant', 'مطابق', 'draft', 'CD-009 response-model enum'),
  ('enum.non_compliant',                 'non compliant', 'غير مطابق', 'draft', 'CD-009 response-model enum'),
  ('enum.na',                            'na', 'لا ينطبق', 'draft', 'CD-009 response-model enum'),
  ('enum.value_date',                    'value date', 'قيمة تاريخ', 'draft', 'CD-009 response-model enum (date input)'),
  ('enum.published',                     'published', 'منشور', 'draft', 'CD-008 version status lozenge'),
  ('enum.draft',                         'draft', 'مسودة', 'draft', 'CD-008 version status lozenge'),
  ('enum.locked',                        'locked', 'مقفل', 'draft', 'CD-008 version status lozenge'),
  ('enum.evidence.photo',                'photo', 'صورة', 'draft', 'CD-009 preview evidence type'),
  ('enum.evidence.document',             'document', 'مستند', 'draft', 'CD-009 preview evidence type'),
  ('enum.evidence.video',                'video', 'فيديو', 'draft', 'CD-009 preview evidence type'),
  ('field.ws.af.owner_name',             'owner name', 'اسم المسؤول', 'draft', 'CD-009 action-form field label'),
  ('field.ws.af.owner_role',             'owner role', 'دور المسؤول', 'draft', 'CD-009 action-form field label'),
  ('field.ws.af.due_at',                 'due at', 'تاريخ الاستحقاق', 'draft', 'CD-009 action-form field label'),
  ('field.ws.af.required_correction',    'required correction', 'الإجراء التصحيحي المطلوب', 'draft', 'CD-009 action-form field label')
on conflict (key) do update
  set ar = excluded.ar, en = excluded.en, context = excluded.context
  where ui_strings.status = 'draft';   -- never clobber a human-reviewed translation
