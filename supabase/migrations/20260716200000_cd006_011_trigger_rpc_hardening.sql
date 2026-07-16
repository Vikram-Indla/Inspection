-- CD-006..CD-011 / MVP1-M09 / MVP1-FND-001
-- Trigger helpers and system issuance functions are not public RPC endpoints.
-- Revoking direct execution does not affect their invocation by database triggers.

revoke all on function public.archive_inspection_item_version() from public, anon, authenticated;
revoke all on function public.materialize_informational_penalty() from public, anon, authenticated;
revoke all on function public.issue_penalties_after_approval() from public, anon, authenticated;

insert into public.ui_strings (key, en, ar, status, context)
values (
  'admin.items.r3.gov.body',
  'Anyone signed in can read the catalogue; writes require compliance_admin or form_admin. Deactivation preserves history and records a reason. Editing archives the previous configuration before advancing the version, and every row change is audited.',
  'يمكن لأي مستخدم مسجل قراءة الكتالوج؛ وتتطلب عمليات الكتابة دور compliance_admin أو form_admin. يحافظ إلغاء التفعيل على السجل ويسجل السبب. تؤرشف عملية التحرير التهيئة السابقة قبل ترقية الإصدار، وتخضع كل تغييرات الصفوف للتدقيق.',
  'draft',
  'CD-007 current governance body after backend completion'
)
on conflict (key) do update
set en = excluded.en,
    ar = excluded.ar,
    context = excluded.context,
    updated_at = now()
where public.ui_strings.status = 'draft';
