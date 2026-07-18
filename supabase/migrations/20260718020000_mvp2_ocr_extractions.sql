-- ============================================================================
-- Migration 20260718020000 — TASK-MVP2-OCR-001
--
-- OCR extraction storage. Advisory only (same philosophy as M2-11 AI): the
-- extracted_text column is a transcription aid for a human, NEVER an
-- authoritative field value — no downstream code may auto-fill a form field
-- from this table without a human confirming. Requested on-demand per
-- evidence row (not automatic on every upload — cost/rate discipline).
--
-- RLS: internal authenticated read/write, same tier as ai_suggestions (no
-- device-credential-class sensitivity like push_subscriptions had — this is
-- read-model text derived from already-authorized evidence, R-007 does not
-- apply here). Forward-only, additive. Runtime DB_VALIDATION_PENDING.
-- ============================================================================

create table if not exists public.ocr_extractions (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid not null references public.evidence(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','extracted','no_text_found','failed','unavailable')),
  extracted_text text,
  provider text not null default 'gemini',
  requested_by uuid references public.profiles(user_id),
  created_at timestamptz not null default now()
);
create index if not exists ocr_extractions_evidence_idx on public.ocr_extractions(evidence_id, created_at desc);

alter table public.ocr_extractions enable row level security;
revoke all on public.ocr_extractions from anon;

drop policy if exists ocr_extractions_read on public.ocr_extractions;
create policy ocr_extractions_read on public.ocr_extractions for select using (auth.uid() is not null);

drop policy if exists ocr_extractions_write on public.ocr_extractions;
create policy ocr_extractions_write on public.ocr_extractions for insert with check (auth.uid() is not null);
-- No update/delete: a re-extraction inserts a new row (append history, never
-- silently overwrite a prior read — mirrors the "no silent overwrite" rule).
