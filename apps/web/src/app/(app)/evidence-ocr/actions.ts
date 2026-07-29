"use server";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";
import { getOcrProvider } from "@/lib/providers/ocr-marker";

// On-demand Marker extraction for one evidence row. Fail-closed: no private
// Marker worker -> records status='unavailable', extracts nothing.
// ADVISORY ONLY — extracted_text is never auto-applied to any authoritative
// field; a human reads it and transcribes/confirms manually.
export type OcrActionResult = { error?: string; ok?: boolean; text?: string; status?: string };

export async function requestOcrExtraction(evidenceId: string): Promise<OcrActionResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };

  const { data: ev, error: evErr } = await sb.from("evidence")
    .select("id, storage_path, evidence_type").eq("id", evidenceId).maybeSingle();
  if (evErr) { logProviderError("ocr evidence read", evErr); return { error: NEUTRAL_WRITE_ERROR }; }
  if (!ev) return { error: "Evidence not found, or outside your scope (RLS)." };
  if (!ev.storage_path) return { error: "This evidence row has no stored file to extract from." };

  const provider = getOcrProvider();
  if (!provider) {
    const { error } = await sb.from("ocr_extractions").insert({ evidence_id: evidenceId, status: "unavailable", requested_by: user.id });
    if (error) { logProviderError("ocr record unavailable", error); return { error: NEUTRAL_WRITE_ERROR }; }
    return { ok: true, status: "unavailable" };
  }

  const { data: file, error: dlErr } = await sb.storage.from("evidence").download(ev.storage_path);
  if (dlErr || !file) {
    logProviderError("ocr file download", dlErr);
    const { error } = await sb.from("ocr_extractions").insert({ evidence_id: evidenceId, status: "failed", requested_by: user.id });
    if (error) logProviderError("ocr record failed", error);
    return { error: "Could not read the stored evidence file." };
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "image/jpeg";
  const filename = ev.storage_path.split("/").pop() || "evidence";
  const result = await provider.extractDocument({
    contentBase64: buf.toString("base64"), mimeType, filename,
  });

  const status = !result.ok ? "failed" : (result.text ? "extracted" : "no_text_found");
  const { error: insErr } = await sb.from("ocr_extractions").insert({
    evidence_id: evidenceId,
    status,
    extracted_text: result.text || null,
    extraction_markdown: result.markdown || null,
    structured_output: result.structuredOutput ?? null,
    retrieval_chunks: result.retrievalChunks ?? null,
    source_sha256: result.sourceSha256 || null,
    processor_version: result.processorVersion || null,
    processor_job_id: result.jobId || null,
    provider: "marker",
    requested_by: user.id,
  });
  if (insErr) { logProviderError("ocr record insert", insErr); return { error: NEUTRAL_WRITE_ERROR }; }
  if (!result.ok) return { error: `Extraction failed (${result.reason ?? "unknown"}).` };
  return { ok: true, status, text: result.text };
}
