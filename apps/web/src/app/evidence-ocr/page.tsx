import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";
import { NotYetBoundary } from "@/components/NotYetBoundary";
import { OcrRowView, type OcrRow, type OcrStrings } from "./OcrReview";

// TASK-MVP2-OCR-001. Advisory OCR review — extracted text helps a human read
// a photo faster, never auto-fills any authoritative field. Flag-gated OFF by
// default (FEATURE_OCR_REVIEW), Gemini vision, fail-closed without a key.
export const dynamic = "force-dynamic";
const MODES = ["off", "on"] as const;

export default async function EvidenceOcrPage() {
  const { t } = await useT();
  if (resolveFeatureFlag(process.env.FEATURE_OCR_REVIEW, MODES, "off") !== "on") {
    return (
      <Shell current="/evidence-ocr" title={t("ocr.title", "Evidence text extraction (OCR)")} context={<span className="ax-lozenge ax-lozenge--warning">REQ-OCR</span>}>
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
    extract: t("ocr.extract", "Extract text (OCR)"), extracting: t("ocr.extracting", "Extracting…"),
    extracted: t("ocr.extracted", "Extracted text (advisory — verify against the source image)"),
    noText: t("ocr.noText", "No text detected in this image."),
    unavailable: t("ocr.unavailable", "OCR provider unavailable — recorded as a request only; no extraction was attempted."),
  };
  return (
    <Shell current="/evidence-ocr" title={t("ocr.title", "Evidence text extraction (OCR)")} context={<span className="ax-lozenge ax-lozenge--info">REQ-OCR</span>}>
      <div className="ax-banner"><div><strong>{t("ocr.banner.title", "Advisory only.")}</strong> {t("ocr.banner.body", "Extracted text helps a human read a photo faster — it is never auto-applied to any authoritative field. Always verify against the source image before acting on it.")}</div></div>
      <section className="ax-surface" style={{ padding: "var(--ax-space-300)", marginBlock: "var(--ax-space-300)" }} aria-labelledby="ocr-how-it-works">
        <h3 id="ocr-how-it-works">{t("ocr.journey.title", "How to use evidence text extraction")}</h3>
        <ol style={{ marginBlock: "var(--ax-space-150)", paddingInlineStart: "var(--ax-space-400)" }}>
          <li>{t("ocr.journey.capture", "Open the relevant field inspection and attach a photo or document to its checklist item.")}</li>
          <li>{t("ocr.journey.return", "Return here, find that stored evidence, then choose Extract text.")}</li>
          <li>{t("ocr.journey.verify", "Read the result beside the source evidence and verify it manually. OCR never fills or changes an inspection answer.")}</li>
        </ol>
        <a className="ax-btn ax-btn--secondary" href="/field">{t("ocr.journey.openField", "Open field inspections to capture evidence")}</a>
      </section>
      {error && <div className="ax-banner ax-banner--critical" role="alert"><div><strong>{t("ocr.error", "Couldn’t load evidence. Nothing changed.")}</strong></div></div>}
      {!error && rows.length === 0 && (
        <div className="ax-surface"><div className="ax-state"><span className="ax-state__glyph">🔎</span>
          <h4>{t("ocr.empty.title", "No evidence in scope")}</h4>
          <p className="ax-caption">{t("ocr.empty.body", "Only stored photos and documents appear here. First attach evidence to a checklist item in a field inspection; empty may also mean none are in your scope (RLS).")}</p></div></div>
      )}
      {rows.map((row) => <OcrRowView key={row.id} row={row} strings={strings} />)}
    </Shell>
  );
}
