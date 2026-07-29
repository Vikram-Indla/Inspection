"use server";

import { getOcrProvider, ocrProviderState } from "@/lib/providers/ocr-marker";

export type FieldOcrActionResult =
  | { status: "configured" }
  | { status: "unavailable"; reason: "missing_api_key" }
  | { status: "extracted"; text: string }
  | { status: "no_text_found" }
  | { status: "failed"; reason: string };

export async function getFieldOcrAvailability(): Promise<FieldOcrActionResult> {
  return ocrProviderState() === "configured"
    ? { status: "configured" }
    : { status: "unavailable", reason: "missing_api_key" };
}

export async function extractFieldEvidenceText(imageBase64: string, mimeType: string): Promise<FieldOcrActionResult> {
  if (!mimeType.startsWith("image/")) return { status: "failed", reason: "unsupported_media" };
  if (!imageBase64 || imageBase64.length > 14_000_000) return { status: "failed", reason: imageBase64 ? "image_too_large" : "no_image" };

  const provider = getOcrProvider();
  if (!provider) return { status: "unavailable", reason: "missing_api_key" };

  const result = await provider.extractDocument({
    contentBase64: imageBase64,
    mimeType,
    filename: "field-evidence",
  });
  if (!result.ok) return { status: "failed", reason: result.reason ?? "unknown" };
  if (!result.text) return { status: "no_text_found" };
  return { status: "extracted", text: result.text };
}
