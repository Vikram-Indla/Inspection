-- CD-026 / SCR-WEB-200 / P03 — Visit Management Workspace · Arabic localization seed
-- Arabic values for the CD-026 Track 1 UI strings (continuity spine, bulk
-- eligibility preview, per-item outcome ledger, neutral validation, Map-lens
-- unavailable, scope caption). Authored Arabic; seeded as status='draft'
-- (machine/unreviewed) — human localization review is the gate to 'reviewed'
-- (migration 0013). The upsert is guarded so it NEVER overwrites a row a human
-- already reviewed. Not a product-scope change: Arabic values for already-
-- accepted EN UI strings; no new Arabic scope, policy, or behaviour.
-- Paste-safe: straight ASCII quotes and Arabic guillemets only (no smart quotes).

insert into ui_strings (key, en, ar, status, context) values
  -- continuity spine (signature pattern)
  ('visit.spine.heading',        'Selected visit', 'الزيارة المحددة', 'draft', 'CD-026 SCR-WEB-200'),
  ('visit.spine.empty',          'Select a visit to see its identity, state and allowed actions here — kept in view as you work.', 'حدّد زيارة لعرض هويتها وحالتها والإجراءات المسموح بها هنا — تبقى ظاهرة أثناء عملك.', 'draft', 'CD-026'),
  ('visit.spine.openDetail',     'Open full detail', 'فتح التفاصيل الكاملة', 'draft', 'CD-026 — opens CD-027 /visits/:id'),
  ('visit.spine.window',         'Window', 'النافذة', 'draft', 'CD-026'),
  ('visit.spine.inspector',      'Inspector', 'المفتش', 'draft', 'CD-026'),
  ('visit.spine.allowed',        'Allowed actions', 'الإجراءات المسموح بها', 'draft', 'CD-026'),
  ('visit.spine.previewAria',    'Show visit {id} in the selected-visit panel', 'عرض الزيارة {id} في لوحة الزيارة المحددة', 'draft', 'CD-026'),
  ('visit.spine.openDetailAria', 'Open full detail for visit {id}', 'فتح التفاصيل الكاملة للزيارة {id}', 'draft', 'CD-026'),
  ('visit.spine.allowedEditable','Editable — published & not started', 'قابلة للتعديل — منشورة ولم تبدأ', 'draft', 'CD-026 M02-006/008'),
  ('visit.spine.allowedLocked',  'Locked — inspection started', 'مقفلة — بدأ التفتيش', 'draft', 'CD-026 M02-006'),
  ('visit.spine.allowedFinal',   'Final — no further changes', 'نهائية — لا تغييرات إضافية', 'draft', 'CD-026'),
  ('visit.spine.allowedExpired', 'Expired — read-only', 'منتهية — للقراءة فقط', 'draft', 'CD-026 M02-016/046'),
  -- bulk eligibility preview
  ('visit.elig.heading',         'Eligibility preview', 'معاينة الأهلية', 'draft', 'CD-026'),
  ('visit.elig.verified',        'Verified now — each item is re-checked on the server at submit.', 'تم التحقق الآن — يُعاد فحص كل عنصر في الخادم عند الإرسال.', 'draft', 'CD-026'),
  ('visit.elig.count',           '{n} of {total} eligible', '{n} من {total} مؤهّلة', 'draft', 'CD-026'),
  ('visit.elig.samePlanBlocked', 'Bulk edit applies within one Plan. Cross-Plan enforcement is not yet in place on the server, so it is unavailable across Plans.', 'يُطبَّق التعديل الجماعي ضمن خطة واحدة. لم يُفعَّل الفرض عبر الخطط في الخادم بعد، لذا فهو غير متاح عبر الخطط.', 'draft', 'CD-026 HANDOFF_BLOCKED_GUARD'),
  ('visit.elig.reschedule',      'Reschedule', 'إعادة الجدولة', 'draft', 'CD-026'),
  ('visit.elig.reassign',        'Reassign', 'إعادة الإسناد', 'draft', 'CD-026'),
  ('visit.elig.cancel',          'Cancel', 'إلغاء', 'draft', 'CD-026'),
  ('visit.elig.edit',            'Edit', 'تعديل', 'draft', 'CD-026'),
  -- per-item outcome ledger
  ('visit.ledger.colVisit',      'Visit', 'الزيارة', 'draft', 'CD-026'),
  ('visit.ledger.colOutcome',    'Outcome', 'النتيجة', 'draft', 'CD-026'),
  ('visit.ledger.colReason',     'What happened', 'ما الذي حدث', 'draft', 'CD-026'),
  ('visit.ledger.open',          'Open', 'فتح', 'draft', 'CD-026'),
  ('visit.ledger.summaryApplied','{n} applied', '{n} مُطبَّقة', 'draft', 'CD-026'),
  ('visit.ledger.summaryBlocked','{n} blocked before change', '{n} محظورة قبل التغيير', 'draft', 'CD-026'),
  ('visit.ledger.summaryNoNotif','{n} changed — notification not queued', '{n} تغيّرت — الإشعار غير مُدرَج في قائمة الانتظار', 'draft', 'CD-026 FND-004'),
  ('visit.ledger.retrySafe',     'Blocked items were not changed and are safe to retry.', 'العناصر المحظورة لم تتغيّر وإعادة المحاولة آمنة.', 'draft', 'CD-026'),
  ('visit.ledger.progressBusy',  'Applying to {n} visits…', 'جارٍ التطبيق على {n} زيارات…', 'draft', 'CD-026'),
  ('visit.ledger.verbReschedule','Reschedule result', 'نتيجة إعادة الجدولة', 'draft', 'CD-026'),
  ('visit.ledger.verbReassign',  'Reassign result', 'نتيجة إعادة الإسناد', 'draft', 'CD-026'),
  ('visit.ledger.verbCancel',    'Cancel result', 'نتيجة الإلغاء', 'draft', 'CD-026'),
  ('visit.ledger.verbEdit',      'Edit result', 'نتيجة التعديل', 'draft', 'CD-026'),
  ('visit.outcome.applied',      'Applied', 'مُطبَّقة', 'draft', 'CD-026'),
  ('visit.outcome.noNotif',      'Change applied — notification not queued', 'طُبِّق التغيير — الإشعار غير مُدرَج في قائمة الانتظار', 'draft', 'CD-026 FND-004'),
  ('visit.outcome.shortNoNotif', 'Applied — no notification', 'مُطبَّقة — بلا إشعار', 'draft', 'CD-026'),
  ('visit.outcome.shortBlocked', 'Blocked before change', 'محظورة قبل التغيير', 'draft', 'CD-026'),
  ('visit.outcome.shortError',   'Not changed', 'لم تتغيّر', 'draft', 'CD-026'),
  ('visit.outcome.blockedNotPub','Blocked before change — no longer published & unstarted, or outside your scope. Nothing changed.', 'محظورة قبل التغيير — لم تعد منشورة وغير مبدوءة، أو خارج نطاقك. لم يتغيّر شيء.', 'draft', 'CD-026 M02-006/008'),
  ('visit.outcome.blockedStarted','Blocked before change — the inspection has already started. Nothing changed.', 'محظورة قبل التغيير — بدأ التفتيش بالفعل. لم يتغيّر شيء.', 'draft', 'CD-026 M02-006'),
  ('visit.outcome.blockedNoAssign','Blocked before change — no assignment to update, or outside your scope. Nothing changed.', 'محظورة قبل التغيير — لا يوجد إسناد لتحديثه، أو خارج نطاقك. لم يتغيّر شيء.', 'draft', 'CD-026 M02-032'),
  ('visit.outcome.error',        'Not changed — something went wrong. This item is safe to retry.', 'لم تتغيّر — حدث خطأ ما. إعادة المحاولة لهذا العنصر آمنة.', 'draft', 'CD-026'),
  -- neutral pre-flight validation
  ('visit.err.selectOne',        'Select at least one visit.', 'حدّد زيارة واحدة على الأقل.', 'draft', 'CD-026'),
  ('visit.err.reasonRequired',   'A cancellation reason is required and final.', 'سبب الإلغاء مطلوب ونهائي.', 'draft', 'CD-026 M02-011'),
  ('visit.err.windowRequired',   'A new window start and end are both required.', 'بداية ونهاية النافذة الجديدة كلاهما مطلوب.', 'draft', 'CD-026 M02-033'),
  ('visit.err.windowInvalid',    'Enter valid date and time values.', 'أدخل قيم تاريخ ووقت صحيحة.', 'draft', 'CD-026 M02-033'),
  ('visit.err.windowOrder',      'The window end must be after the window start.', 'يجب أن تكون نهاية النافذة بعد بدايتها.', 'draft', 'CD-026 M02-033'),
  ('visit.err.inspectorRequired','Select an inspector.', 'حدّد مفتشًا.', 'draft', 'CD-026 M02-032'),
  ('visit.err.typeOrNotes',      'Choose a visit type to change, or tick «update notes».', 'اختر نوع زيارة لتغييره، أو حدّد «تحديث الملاحظات».', 'draft', 'CD-026 M02-007'),
  -- lens switcher / scope
  ('visit.views.map',            'Map', 'خريطة', 'draft', 'CD-026 HANDOFF_BLOCKED_MAP'),
  ('visit.views.mapUnavailable', 'Map view is not available yet — use the list below.', 'عرض الخريطة غير متاح بعد — استخدم القائمة أدناه.', 'draft', 'CD-026 HANDOFF_BLOCKED_MAP'),
  ('visit.list.scope',           'RLS-scoped — showing {shown} of {total}', 'مُقيَّد بـ RLS — عرض {shown} من {total}', 'draft', 'CD-026 M02-001')
on conflict (key) do update
  set ar = excluded.ar, en = excluded.en, context = excluded.context
  where ui_strings.status = 'draft';   -- never clobber a human-reviewed translation
