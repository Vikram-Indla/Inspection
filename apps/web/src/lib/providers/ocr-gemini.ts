// OCR provider — reuses the same Gemini API key already configured for M2-11
// assistive AI (multimodal vision handles OCR natively; no separate account,
// no marginal cost within the free tier: gemini-flash-latest, 1000+ req/day).
// TASK-MVP2-OCR-001.
//
// ADVISORY ONLY, same philosophy as M2-11: extracted text helps a human read
// a photo faster (e.g. a blurry CR number or license text); it is NEVER
// auto-filled into an authoritative field. A human always reviews and
// transcribes/confirms. Fail-closed: no GEMINI_API_KEY -> provider
// 'unavailable', no extraction attempted, nothing fabricated.
export type OcrResult = { ok: boolean; text?: string; reason?: string };

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const OCR_TIMEOUT_MS = 20_000;

export class GeminiOcrProvider {
  constructor(private readonly apiKey: string, private readonly model = "gemini-flash-latest") {}

  /** imageBase64 is the raw image bytes, base64-encoded (no data: prefix). */
  async extractText(imageBase64: string, mimeType: string): Promise<OcrResult> {
    if (!imageBase64) return { ok: false, reason: "no_image" };
    if (!this.apiKey) return { ok: false, reason: "provider_unavailable" };
    if (!mimeType.startsWith("image/")) return { ok: false, reason: "unsupported_media" };
    const prompt = "Transcribe ALL visible text in this image EXACTLY as written, preserving line breaks. If no text is visible, respond with exactly: NO_TEXT_FOUND. Do not describe the image, do not add commentary, do not translate — verbatim transcription only.";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OCR_TIMEOUT_MS);
    try {
      const res = await fetch(`${GEMINI_BASE}/${this.model}:generateContent`, {
        method: "POST",
        headers: { "x-goog-api-key": this.apiKey, "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: imageBase64 } }] }],
          generationConfig: { maxOutputTokens: 2048, temperature: 0 },
        }),
      });
      if (!res.ok) return { ok: false, reason: `gemini_${res.status}` };
      const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const text = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
      if (!text) return { ok: false, reason: "empty_response" };
      if (text === "NO_TEXT_FOUND") return { ok: true, text: "" };
      return { ok: true, text };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return { ok: false, reason: "gemini_timeout" };
      return { ok: false, reason: "gemini_network_error" };
    } finally {
      clearTimeout(timeout);
    }
  }
}

// Same key resolution as the assistive-AI adapter (ai-gemini.ts): the shared
// dev/staging envs provision the project-scoped GEMINI_API_KEY_INSPECTION, and
// only fall back to the plain GEMINI_API_KEY. Reading GEMINI_API_KEY alone made
// OCR report 'unavailable' on an environment where the key is present, which is
// fail-closed for the wrong reason.
function resolveGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY_INSPECTION || process.env.GEMINI_API_KEY;
}

export function ocrProviderState(): "configured" | "unavailable" {
  return resolveGeminiApiKey() ? "configured" : "unavailable";
}

/** Fail-closed factory: null when no key is configured. */
export function getOcrProvider(): GeminiOcrProvider | null {
  const key = resolveGeminiApiKey();
  if (!key) return null;
  return new GeminiOcrProvider(key, process.env.GEMINI_MODEL ?? "gemini-flash-latest");
}
