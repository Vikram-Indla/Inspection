-- DEF-PRF-003 Profile Settings — Arabic strings for the new /profile screen
-- and the shell account-menu link. Guarded upsert never clobbers a
-- human-reviewed translation (status='draft' only).
insert into ui_strings (key, en, ar, status, context) values
  ('shell.profileSettings', 'Profile settings', 'إعدادات الملف الشخصي', 'draft', 'DEF-PRF-003 account menu link'),
  ('profile.title', 'Profile settings', 'إعدادات الملف الشخصي', 'draft', 'DEF-PRF-003 title'),
  ('profile.badge', 'personal, not organizational', 'شخصي، وليس تنظيميًا', 'draft', 'DEF-PRF-003 badge'),
  ('profile.details.heading', 'Personal details', 'البيانات الشخصية', 'draft', 'DEF-PRF-003'),
  ('profile.details.name', 'Name', 'الاسم', 'draft', 'DEF-PRF-003'),
  ('profile.details.email', 'Email', 'البريد الإلكتروني', 'draft', 'DEF-PRF-003'),
  ('profile.details.region', 'Region', 'المنطقة', 'draft', 'DEF-PRF-003'),
  ('profile.details.roles', 'Roles', 'الأدوار', 'draft', 'DEF-PRF-003'),
  ('profile.details.editNote', 'Personal details, region and roles are governed elsewhere and are not editable from this screen (no self-service identity or role changes).', 'تُدار البيانات الشخصية والمنطقة والأدوار من جهة أخرى ولا يمكن تعديلها من هذه الشاشة (لا تعديل ذاتي للهوية أو الأدوار).', 'draft', 'DEF-PRF-003'),
  ('profile.appearance.heading', 'Language & appearance', 'اللغة والمظهر', 'draft', 'DEF-PRF-003'),
  ('profile.appearance.language', 'Switch to', 'التبديل إلى', 'draft', 'DEF-PRF-003'),
  ('profile.appearance.themeNote', 'Theme preference is saved to this browser.', 'يُحفظ تفضيل المظهر في هذا المتصفح.', 'draft', 'DEF-PRF-003'),
  ('profile.notif.heading', 'Notification preferences', 'تفضيلات الإشعارات', 'draft', 'DEF-PRF-003'),
  ('profile.notif.push', 'Push notifications', 'إشعارات الدفع', 'draft', 'DEF-PRF-003'),
  ('profile.notif.sms', 'SMS notifications', 'إشعارات الرسائل النصية', 'draft', 'DEF-PRF-003'),
  ('profile.notif.email', 'Email notifications', 'إشعارات البريد الإلكتروني', 'draft', 'DEF-PRF-003'),
  ('profile.notif.inappNote', 'In-app notifications (the bell) are always on — they are the only guaranteed delivery surface in this environment.', 'إشعارات داخل التطبيق (الجرس) مُفعَّلة دائمًا — فهي سطح التسليم الوحيد المضمون في هذه البيئة.', 'draft', 'DEF-PRF-003'),
  ('profile.notif.save', 'Save preferences', 'حفظ التفضيلات', 'draft', 'DEF-PRF-003'),
  ('profile.notif.saving', 'Saving…', 'جارٍ الحفظ…', 'draft', 'DEF-PRF-003'),
  ('profile.notif.saved', 'Saved', 'تم الحفظ', 'draft', 'DEF-PRF-003'),
  ('profile.session.heading', 'Session & security', 'الجلسة والأمان', 'draft', 'DEF-PRF-003'),
  ('profile.session.issued', 'This session started', 'بدأت هذه الجلسة', 'draft', 'DEF-PRF-003'),
  ('profile.session.expires', 'This session expires', 'تنتهي هذه الجلسة', 'draft', 'DEF-PRF-003')
on conflict (key) do update
  set ar = excluded.ar, en = excluded.en, context = excluded.context
  where ui_strings.status = 'draft';
