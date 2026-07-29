import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";
import EmptyState from "@/components/EmptyState";
import { NotYetBoundary } from "@/components/NotYetBoundary";
import { OcrRowView, type OcrRow, type OcrStrings } from "./OcrReview";
import { IconSearch } from "@/app/icons";

// TASK-MVP2-OCR-001. Advisory OCR review — extracted text helps a human read
// a photo faster, never auto-fills any authoritative field. Flag-gated OFF by
// Marker OCR is a permanent Saqeel capability. The private worker remains
// fail-closed when its runtime is unavailable, but the governed review surface
// is visible by default instead of being hidden behind an off switch.
const MODES = ["off", "on"] as const;

export default async function EvidenceOcrPage() {
  const { t } = await useT();
  if (resolveFeatureFlag(process.env.FEATURE_OCR_REVIEW, MODES, "on") !== "on") {
    return (
      <Shell current="/evidence-ocr" title={t("ocr.title", "Evidence text extraction (OCR)")} context={<span className="badge badge-warning">REQ-OCR</span>}>
        <NotYetBoundary title={t("ocr.title", "Evidence text extraction (OCR)")}
          consequence={t("ocr.off", "OCR review is not enabled here. Extracted text is always advisory and never auto-fills a field.")}
          seam="FEATURE_OCR_REVIEW=off" notAvailableLabel={t("tasks.notYet", "Not available yet")} detailLabel={t("common.whyPrereq", "Why / prerequisites")} />
      </Shell>
    );
  }
  const sb = await supabaseServer();
  // OCR works on a stored image/document only. Comments and other text-only
  // evidence do not get a meaningless “Extract” action.
  const { data: evRows, error } = await sb.from("evidence")
    .select("id, evidence_type, captured_at, inspection_id, linked_type, linked_id")
    .not("storage_path", "is", null).order("captured_at", { ascending: false }).limit(25);
  if (error) console.error("[evidence-ocr] load", error);
  const ids = (evRows ?? []).map((r) => r.id);
  const { data: extractions } = ids.length
    ? await sb.from("ocr_extractions").select("evidence_id, status, extracted_text, created_at").in("evidence_id", ids).order("created_at", { ascending: false })
    : { data: [] as { evidence_id: string; status: string; extracted_text: string | null }[] };
  const latestByEvidence = new Map<string, { status: string; text: string | null }>();
  for (const e of extractions ?? []) if (!latestByEvidence.has(e.evidence_id)) latestByEvidence.set(e.evidence_id, { status: e.status, text: e.extracted_text });

  const rows: OcrRow[] = (evRows ?? []).map((r) => ({
    id: r.id, evidenceType: r.evidence_type, capturedAt: r.captured_at,
    inspectionId: r.inspection_id, linkedType: r.linked_type, linkedId: r.linked_id,
    lastExtraction: latestByEvidence.get(r.id) ?? null,
  }));
  const strings: OcrStrings = {
    extract: t("ocr.extract", "Extract text"), extracting: t("ocr.extracting", "Extracting…"),
    retry: t("ocr.retry", "Retry extraction"),
    extracted: t("ocr.extracted", "Extracted text (advisory — verify against the source image)"),
    noText: t("ocr.noText", "No text detected in this image."),
    unavailable: t("ocr.unavailable", "OCR provider unavailable — recorded as a request only; no extraction was attempted."),
    openInspection: t("ocr.openInspection", "Open the inspection item that owns this evidence"),
    notExtracted: t("ocr.notExtracted", "not extracted"), extractedBadge: t("ocr.extractedBadge", "extracted"),
    failedBadge: t("ocr.failedBadge", "failed"),
    extractHint: t("ocr.extractHint", "Runs the private Marker document worker on the stored file. Markdown and retrieval derivatives are stored with provenance for a human to review."),
    failedBody: t("ocr.failedBody", "Extraction failed. The evidence is unaffected; no text is invented. Retry when the provider is available."),
    copy: t("ocr.copy", "Copy to note"), copied: t("ocr.copied", "Copied"),
    copyHint: t("ocr.copyHint", "Copy is manual — no field is auto-filled"),
    advisory: t("ocr.confidence", "confidence: model-reported, unverified"),
    linked: t("ocr.linked", "linked"), captured: t("ocr.captured", "captured"),
  };
  return (
    <Shell current="/evidence-ocr" title={t("ocr.title", "Evidence text extraction (OCR)")}
      context={
        <>
          <span className="id-code">{t("ocr.provenance", "REQ-OCR · Marker · advisory only")}</span>
          <span className="badge badge-info"><span className="dot" />{t("ocr.advisoryBadge", "Advisory · never auto-fills")}</span>
        </>
      }>
      <div className="alert alert-warning">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true"><path d="M12 3 2 20h20L12 3z" /><path d="M12 10v4M12 17h.01" /></svg>
        <div>{t("ocr.banner.body", "Extracted text is advisory — it helps a human read a photo faster and never auto-fills any authoritative field. OCR runs only on stored images and documents; it fails closed without a provider key.")}</div>
      </div>
      {error && <div className="sq-banner sq-banner--critical" role="alert"><div><strong>{t("ocr.error", "Couldn’t load evidence. Nothing changed.")}</strong></div></div>}
      {!error && rows.length === 0 && (
        <EmptyState icon={<IconSearch size={28} />} title={t("ocr.empty.title", "No evidence in scope")}
          body={t("ocr.empty.body", "Only stored photos and documents appear here. First attach evidence to a checklist item in a field inspection; empty may also mean none are in your scope (RLS).")} />
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "var(--space-4)" }}>
        {rows.map((row) => <OcrRowView key={row.id} row={row} strings={strings} />)}
      </div>
      <section className="panel" style={{ padding: "var(--space-6)" }} aria-labelledby="ocr-how-it-works">
        <h3 id="ocr-how-it-works">{t("ocr.journey.title", "How to use evidence text extraction")}</h3>
        <ol style={{ marginBlock: "var(--space-3)", paddingInlineStart: "var(--space-8)" }}>
          <li>{t("ocr.journey.capture", "Open the relevant field inspection and attach a photo or document to its checklist item.")}</li>
          <li>{t("ocr.journey.return", "Return here, find that stored evidence, then choose Extract text.")}</li>
          <li>{t("ocr.journey.verify", "Read the result beside the source evidence and verify it manually. OCR never fills or changes an inspection answer.")}</li>
        </ol>
        <a className="btn btn-secondary btn-touch" href="/field">{t("ocr.journey.openField", "Open field inspections to capture evidence")}</a>
      </section>
    </Shell>
  );
}
