// Marker OCR adapter. Saqeel never runs document conversion in the web
// process: it sends an authorised, private request to the dedicated Marker
// worker and stores only the resulting advisory derivatives against the
// original evidence. The original object is never modified or replaced.

export type MarkerOcrResult = {
  ok: boolean;
  text?: string;
  markdown?: string;
  structuredOutput?: Record<string, unknown> | null;
  retrievalChunks?: unknown[] | null;
  sourceSha256?: string;
  processorVersion?: string;
  jobId?: string;
  reason?: string;
};

type MarkerWorkerResponse = {
  status?: "completed" | "no_text_found" | "failed";
  markdown?: string;
  text?: string;
  structured_output?: Record<string, unknown> | null;
  retrieval_chunks?: unknown[] | null;
  source_sha256?: string;
  processor_version?: string;
  job_id?: string;
  error_code?: string;
};

const OCR_TIMEOUT_MS = 15 * 60_000;

export class MarkerOcrProvider {
  constructor(
    private readonly workerUrl: string,
    private readonly token?: string,
  ) {}

  async extractDocument(input: {
    contentBase64: string;
    mimeType: string;
    filename: string;
  }): Promise<MarkerOcrResult> {
    if (!input.contentBase64) return { ok: false, reason: "no_file" };
    if (!isSupportedMimeType(input.mimeType)) return { ok: false, reason: "unsupported_media" };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OCR_TIMEOUT_MS);
    try {
      const res = await fetch(`${this.workerUrl.replace(/\/$/, "")}/v1/extractions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
        signal: controller.signal,
        body: JSON.stringify({
          content_base64: input.contentBase64,
          mime_type: input.mimeType,
          filename: input.filename,
          requested_outputs: ["markdown", "json", "chunks"],
        }),
      });
      if (!res.ok) return { ok: false, reason: `marker_${res.status}` };
      const body = (await res.json()) as MarkerWorkerResponse;
      if (body.status === "failed") return { ok: false, reason: body.error_code ?? "marker_failed" };
      const markdown = body.markdown?.trim() ?? "";
      const text = body.text?.trim() || markdown;
      return {
        ok: true,
        text,
        markdown,
        structuredOutput: body.structured_output ?? null,
        retrievalChunks: body.retrieval_chunks ?? null,
        sourceSha256: body.source_sha256,
        processorVersion: body.processor_version,
        jobId: body.job_id,
        reason: body.status === "no_text_found" ? "no_text_found" : undefined,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return { ok: false, reason: "marker_timeout" };
      return { ok: false, reason: "marker_network_error" };
    } finally {
      clearTimeout(timeout);
    }
  }
}

function isSupportedMimeType(mimeType: string): boolean {
  return mimeType === "application/pdf" || mimeType.startsWith("image/");
}

function markerWorkerUrl(): string | undefined {
  return process.env.MARKER_OCR_WORKER_URL?.trim() || undefined;
}

function markerWorkerToken(): string | undefined {
  return process.env.MARKER_OCR_WORKER_TOKEN?.trim() || undefined;
}

export function ocrProviderState(): "configured" | "unavailable" {
  return markerWorkerUrl() && markerWorkerToken() ? "configured" : "unavailable";
}

export function getOcrProvider(): MarkerOcrProvider | null {
  const url = markerWorkerUrl();
  const token = markerWorkerToken();
  return url && token ? new MarkerOcrProvider(url, token) : null;
}
