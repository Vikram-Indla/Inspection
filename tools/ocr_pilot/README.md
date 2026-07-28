# Saqeel OCR Pilot

This is a **local, non-production worker pilot** for converting one inspection
document at a time into retrieval-ready derivatives:

- `document.md` — human-readable Markdown
- `document.json` — a machine-readable envelope around the Markdown and its
  provenance
- `chunks.json` — deterministic text chunks for a future retrieval service
- `job.json` — immutable input and processing provenance

It does not connect to Supabase, storage buckets, Senaei, or the web
application. It never updates an evidence row or an authoritative inspection
field. The original input remains the evidence of record; every derivative is
advisory.

## Why it exists

The application already has an `/evidence-ocr` review flow. Its Gemini adapter
is image-only. This worker is the replacement seam for PDFs and images when the
platform is ready to run a private document-conversion service.

## Run locally

```sh
cd tools/ocr_pilot
uv run saqeel-ocr-pilot extract \
  --input /safe/local/inspection-report.pdf \
  --output /safe/local/derivatives
```

The command calls `marker_single` three times, once for each Marker output
format (`markdown`, `json`, `chunks`), then writes the custody envelope. No LLM
enhancement is enabled. The worker fails closed if Marker is unavailable or a
format does not yield an artifact.

## Runtime gate

Marker is not embedded in the Next.js server. Deploy it as a separate private
worker with no public ingress and no outbound LLM configuration. On Apple
Silicon it requires a local `llama-server`; on NVIDIA it requires the approved
vLLM/Docker runtime. The pilot intentionally does not install or start those
services.

## Licence gate

Marker's source code is Apache-2.0. Its model weights are separately licensed
under a modified OpenRAIL-M licence; the upstream project states that commercial
use beyond its stated revenue/funding threshold requires an appropriate licence.
Do not use Marker models outside this local pilot until Legal confirms the
organisation's entitlement. `Docling` is the fallback evaluation candidate;
its code is MIT, but its selected model artefacts still require a model-by-model
licence review.

## Promotion gate

Before this can be connected to Saqeel evidence:

1. Legal records the selected processor and model entitlement.
2. Platform supplies an isolated worker runtime and private derivative storage.
3. A representative Arabic/English PDF and image corpus is approved for a
   quality benchmark.
4. A governed schema change adds job/processor/source-hash/derivative-path
   provenance without overwriting the existing append-only OCR history.
5. The application receives a feature-flagged enqueue adapter only; a human
   remains responsible for checking any extracted text against the original.
