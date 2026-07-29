-- Marker replaces Gemini for OCR. The original evidence object remains the
-- source of record; extraction rows are append-only derivatives with enough
-- provenance to reproduce or invalidate a result later.

alter table public.ocr_extractions
  alter column provider set default 'marker';

alter table public.ocr_extractions
  add column if not exists extraction_markdown text,
  add column if not exists structured_output jsonb,
  add column if not exists retrieval_chunks jsonb,
  add column if not exists source_sha256 text,
  add column if not exists processor_version text,
  add column if not exists processor_job_id text;

create index if not exists ocr_extractions_source_sha256_idx
  on public.ocr_extractions (source_sha256)
  where source_sha256 is not null;

create index if not exists ocr_extractions_processor_job_idx
  on public.ocr_extractions (processor_job_id)
  where processor_job_id is not null;
