-- CD-025 / SCR-WEB-150 / P03 — Plan Review & Publish · Arabic value for the new
-- scope-reduction (S10) polite announcement string added in the R3 accessibility
-- correction. Forward-only; does not edit the applied 20260714093000 seed.
-- Guarded upsert never clobbers a human-reviewed translation (status='draft' only).
-- Not a product-scope change: Arabic value for an already-accepted EN UI string;
-- no new scope, policy, or behaviour.

insert into ui_strings (key, en, ar, status, context) values
  ('plan.review.scopeReduced',
   'Removed {removed} duplicate factory record(s). {retained} retained — readiness re-checked.',
   'تمت إزالة {removed} سجل مصنع مكرر. {retained} مُبقاة — أُعيد فحص الجاهزية.',
   'draft', 'CD-025 SCR-WEB-150 — S10 scope-reduction polite announcement')
on conflict (key) do update
  set ar = excluded.ar, en = excluded.en, context = excluded.context
  where ui_strings.status = 'draft';   -- never clobber a human-reviewed translation
