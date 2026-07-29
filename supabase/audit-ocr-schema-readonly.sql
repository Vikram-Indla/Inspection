-- Read-only Marker derivative schema evidence. This file does not change database state.
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'ocr_extractions'
  and column_name in (
    'extraction_markdown', 'structured_output', 'retrieval_chunks',
    'source_sha256', 'processor_version', 'processor_job_id'
  )
order by column_name;
