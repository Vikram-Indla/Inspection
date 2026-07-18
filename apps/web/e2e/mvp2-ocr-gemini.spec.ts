import { test, expect } from "@playwright/test";
import { GeminiOcrProvider, ocrProviderState, getOcrProvider } from "../src/lib/providers/ocr-gemini";

// Gemini OCR provider certification. No browser/DB. LIVE test runs only when
// GEMINI_API_KEY is present (fail-closed contract otherwise). Reuses the same
// key/account as M2-11 assistive AI — no new signup, no marginal cost within
// the free tier. TASK-MVP2-OCR-001.

test("fail-closed: no GEMINI_API_KEY -> provider unavailable, factory null", () => {
  const prev = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    expect(ocrProviderState()).toBe("unavailable");
    expect(getOcrProvider()).toBeNull();
  } finally { if (prev !== undefined) process.env.GEMINI_API_KEY = prev; }
});

test("fail-closed: empty image -> no_image, no call attempted", async () => {
  const p = new GeminiOcrProvider("dummy-key");
  const r = await p.extractText("", "image/png");
  expect(r.ok).toBe(false);
  expect(r.reason).toBe("no_image");
});

test("LIVE: Gemini vision extracts real text from a real generated image", async ({ page }) => {
  test.skip(!process.env.GEMINI_API_KEY, "GEMINI_API_KEY not set in this run");
  // Render a real PNG containing known, distinctive text via a headless browser
  // canvas — no browser/DB dependency beyond a throwaway canvas render, and no
  // external test-fixture image needed. This proves genuine OCR, not a stub.
  const marker = `MIM-OCR-CERT-${Date.now() % 100000}`; // short, distinctive, never seen before
  const dataUrl = await page.evaluate((text) => {
    const canvas = document.createElement("canvas");
    canvas.width = 700; canvas.height = 200; // generous width so nothing clips at the edge
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, 700, 200);
    ctx.fillStyle = "#000000"; ctx.font = "bold 36px sans-serif";
    ctx.fillText(text, 30, 110);
    return canvas.toDataURL("image/png");
  }, marker);
  const base64 = dataUrl.split(",")[1];

  const provider = getOcrProvider()!;
  const result = await provider.extractText(base64, "image/png");
  expect(result.ok).toBe(true);
  expect(result.text).toBeTruthy();
  // OCR tolerance: the fixed prefix must match exactly; allow the numeric
  // suffix (subject to sub-pixel rendering variance) to differ by a digit —
  // this proves genuine vision-model transcription, not a canned response.
  expect(result.text).toContain("MIM-OCR-CERT-");
  const prefixLen = marker.length - 1;
  expect(result.text!.slice(0, prefixLen)).toBe(marker.slice(0, prefixLen));
});
