-- Read-only OCR inventory. This file does not change evidence or extraction state.
select
  provider,
  count(*)::int as extraction_count,
  count(extraction_markdown)::int as markdown_records,
  count(structured_output)::int as structured_records,
  count(retrieval_chunks)::int as retrieval_records,
  count(source_sha256)::int as provenance_records,
  count(processor_job_id)::int as job_records
from public.ocr_extractions
group by provider
order by provider;
