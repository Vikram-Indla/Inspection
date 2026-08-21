import { generateContextualInsight, type ContextualResult } from "@/lib/ai/contextual-actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

function tokenize(text: string): readonly string[] {
  return text.match(/\S+\s*|\s+/g) ?? [text];
}

export async function POST(request: Request): Promise<Response> {
  const formData = await request.formData();
  const fallback = String(formData.get("fallback") ?? "").trim();
  const result: ContextualResult = await generateContextualInsight({}, formData).catch(() => ({ error: "generation_failed" }));
  const text = result.text && result.text.trim() ? result.text : fallback;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const token of tokenize(text)) {
        controller.enqueue(encoder.encode(token));
        await new Promise(resolve => setTimeout(resolve, 16));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-accel-buffering": "no",
    },
  });
}
