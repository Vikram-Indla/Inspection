-- CD-024 (SCR-WEB-140 · Visit Configuration & Assignment, route-neutral inside
-- /planning/bulk/review) — Arabic localization seed for the Assignment Evidence
-- Ledger + per-row evidence cells. Arabic values are machine/unreviewed draft
-- copy for already-accepted EN UI strings; no new Arabic scope, policy, monetary
-- value, or behaviour is introduced. Placeholders ({n}, {name}, {code}, {label},
-- {window}) are preserved verbatim. EN mirrors the exact in-code fallback so the
-- two never drift. Seeded status='draft'; the guarded upsert never overwrites a
-- human-reviewed row.
insert into ui_strings (key, en, ar, status, context) values
  ('plan.review.ev.title',      'Assignment evidence ledger', 'سجل أدلة الإسناد', 'draft', 'CD-024 ledger'),
  ('plan.review.ev.lead',       'Focus a factory row (or choose “Review evidence”) to see exactly what is verified, what is not evaluated, what blocks the assignment, and what is checked again just before publishing — for that candidate only. No score, rank or confidence is shown.', 'ركِّز على صف منشأة (أو اختر «مراجعة الأدلة») لترى بالضبط ما تم التحقق منه، وما لم يُقيَّم، وما يمنع الإسناد، وما يُعاد التحقق منه قبل النشر مباشرةً — لهذا المرشح فقط. لا يُعرض أي تقييم أو ترتيب أو درجة ثقة.', 'draft', 'CD-024 ledger'),
  ('plan.review.ev.review',     'Review evidence', 'مراجعة الأدلة', 'draft', 'CD-024 ledger'),
  ('plan.review.ev.noneTitle',  'No candidate in focus', 'لا يوجد مرشح قيد التركيز', 'draft', 'CD-024 ledger'),
  ('plan.review.ev.noneBody',   'Nothing for this candidate yet. Focus a factory row or choose “Review evidence” to reflect its facts here. Blocked picks are shown on their own ledger with the exact visit and time.', 'لا شيء لهذا المرشح بعد. ركِّز على صف منشأة أو اختر «مراجعة الأدلة» لعرض حقائقه هنا. تُعرض الاختيارات الممنوعة في سجلها الخاص مع الزيارة والوقت بالضبط.', 'draft', 'CD-024 ledger'),
  ('plan.review.ev.cVerified',  'Verified now', 'مُتحقَّق الآن', 'draft', 'CD-024 ledger class'),
  ('plan.review.ev.cNotEval',   'Not evaluated', 'غير مُقيَّم', 'draft', 'CD-024 ledger class'),
  ('plan.review.ev.cBlocks',    'Blocks assignment', 'يمنع الإسناد', 'draft', 'CD-024 ledger class'),
  ('plan.review.ev.cChecked',   'Checked again before publish', 'يُعاد التحقق قبل النشر', 'draft', 'CD-024 ledger class'),
  ('plan.review.ev.vRole',      'Holds the Inspector role (in the eligible pool)', 'يحمل دور المفتش (ضمن المجموعة المؤهَّلة)', 'draft', 'CD-024 verified'),
  ('plan.review.ev.vOverlap0',  'No overlapping active visit in the window (overlap query ran)', 'لا توجد زيارة نشطة متداخلة ضمن النافذة (تم تنفيذ استعلام التداخل)', 'draft', 'CD-024 verified'),
  ('plan.review.ev.vPkg',       'Package is currently published or locked', 'الحزمة منشورة أو مقفلة حاليًا', 'draft', 'CD-024 verified'),
  ('plan.review.ev.neList',     'Skills · work hours · capacity · territory · proximity · travel time — no Saqeel source, not evaluated', 'المهارات · ساعات العمل · السعة · النطاق · القرب · زمن التنقل — لا يوجد مصدر في سقيل، غير مُقيَّم', 'draft', 'CD-024 not-evaluated'),
  ('plan.review.ev.neAuto',     'Automatic pick — the server’s Inspector is chosen at publish and its window overlap is NOT checked for auto (known gap)', 'اختيار تلقائي — يُحدَّد مفتش الخادم عند النشر ولا يُفحَص تداخل نافذته في الوضع التلقائي (ثغرة معروفة)', 'draft', 'CD-024 not-evaluated'),
  ('plan.review.ev.neWindow',   'Overlap not evaluated — set a valid inspection window first', 'لم يُقيَّم التداخل — حدِّد نافذة تفتيش صالحة أولًا', 'draft', 'CD-024 not-evaluated'),
  ('plan.review.ev.bOverlap',   'Already booked on {n} overlapping visit(s) — e.g. {label}, {window}', 'محجوز بالفعل على {n} زيارة متداخلة — مثل {label}، {window}', 'draft', 'CD-024 blocks'),
  ('plan.review.ev.bNotPool',   'Not in the eligible Inspector pool', 'ليس ضمن مجموعة المفتشين المؤهَّلة', 'draft', 'CD-024 blocks'),
  ('plan.review.ev.bFail',      'Overlap check could not run — publishing is blocked (not “no conflict”)', 'تعذَّر تنفيذ فحص التداخل — النشر ممنوع (ليس «لا يوجد تعارض»)', 'draft', 'CD-024 blocks'),
  ('plan.review.ev.bNone',      'Nothing blocks this candidate right now', 'لا شيء يمنع هذا المرشح حاليًا', 'draft', 'CD-024 blocks'),
  ('plan.review.ev.checked',    'Eligibility, double-booking and active visits are re-checked just before the plan is written. A change landing between that check and the write is not caught — the atomic publish itself re-validates nothing.', 'يُعاد التحقق من الأهلية والحجز المزدوج والزيارات النشطة قبل كتابة الخطة مباشرةً. أي تغيير يقع بين ذلك التحقق والكتابة لا يُلتقَط — والنشر الذري نفسه لا يعيد التحقق من شيء.', 'draft', 'CD-024 checked-again'),
  ('plan.review.ev.focusedFor', 'Assignment evidence for {name} ({code})', 'أدلة الإسناد لـ {name} ({code})', 'draft', 'CD-024 ledger'),
  ('plan.review.ec.inPool',     'in pool', 'ضمن المجموعة', 'draft', 'CD-024 cell'),
  ('plan.review.ec.overlaps',   '{n} overlaps in window', '{n} تداخلات ضمن النافذة', 'draft', 'CD-024 cell'),
  ('plan.review.ec.skills',     'skills/capacity: not evaluated', 'المهارات/السعة: غير مُقيَّمة', 'draft', 'CD-024 cell'),
  ('plan.review.ec.auto',       'automatic — overlap not re-checked for auto (known gap)', 'تلقائي — لم يُعَد فحص التداخل للتلقائي (ثغرة معروفة)', 'draft', 'CD-024 cell'),
  ('plan.review.ec.blockedN',   'booked on {n} overlapping visit(s)', 'محجوز على {n} زيارة متداخلة', 'draft', 'CD-024 cell'),
  ('plan.review.ec.fail',       'overlap check unavailable — blocked, not “no conflict”', 'فحص التداخل غير متاح — ممنوع، ليس «لا يوجد تعارض»', 'draft', 'CD-024 cell'),
  ('plan.review.ec.setWindow',  'set an inspection window to check overlap', 'حدِّد نافذة تفتيش لفحص التداخل', 'draft', 'CD-024 cell')
on conflict (key) do update
  set ar = excluded.ar, en = excluded.en, context = excluded.context
  where ui_strings.status = 'draft';   -- never clobber a human-reviewed translation
