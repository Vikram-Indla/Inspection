import { readFileSync } from "node:fs";
import { join } from "node:path";

// Minimal PostgREST client mirroring product-contract/evidence/b10_golden_journey.py:
// every call runs with the acting persona's own JWT so RLS and triggers stay the
// enforcement under test. Used only to stage sacrificial fixtures (e.g. an assigned
// visit for the offline drill) — journey assertions themselves go through the UI.
const env = readFileSync(join(__dirname, "..", ".env.local"), "utf-8");
const BASE = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)![1].trim();
const ANON = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)![1].trim();

export async function login(email: string, password: string) {
  const r = await fetch(`${BASE}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) throw new Error(`auth failed for ${email}: ${r.status} ${await r.text()}`);
  const d = await r.json();
  return { jwt: d.access_token as string, userId: d.user.id as string };
}

export async function rest<T = any>(
  method: string,
  path: string,
  jwt: string,
  body?: unknown,
  prefer = "return=representation",
): Promise<{ data: T | null; error: string | null }> {
  const r = await fetch(`${BASE}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
      Prefer: prefer,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const raw = await r.text();
  if (!r.ok) return { data: null, error: `${r.status} ${raw.slice(0, 220)}` };
  return { data: raw ? JSON.parse(raw) : null, error: null };
}

// Fixture plumbing: rows are untyped PostgREST JSON; assertions give them shape.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function must(res: { data: unknown; error: string | null }, step: string): any {
  if (res.error || res.data == null) throw new Error(`${step}: ${res.error ?? "no data"}`);
  return res.data;
}

// For prefer="return=minimal" writes: PostgREST returns no body on success, so
// only the error is meaningful (mirrors must([1], err, step) in b10_golden_journey.py).
export function assertOk(res: { error: string | null }, step: string): void {
  if (res.error) throw new Error(`${step}: ${res.error}`);
}
