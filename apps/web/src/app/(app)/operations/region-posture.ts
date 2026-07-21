// Region RAG posture — the single source of the operations posture rule, shared
// by the Operations Center map (OpsMap) and Operations Live, so both surfaces
// derive factory bands and colour regions identically. No new thresholds are
// introduced here: band + posture rules are the accepted Operations Live
// derivations, lifted verbatim into one place.
import { resolveRegionId, type KsaRegionId } from "@/lib/ksa-regions";
import type { RagBand } from "./live/types";

const BAND: Record<string, RagBand> = { high: "high", medium: "medium", low: "low" };

/** Factory band from an explicit risk_band, falling back to the risk score. */
export function bandOf(riskBand: string | null, score: number | null): RagBand {
  if (riskBand && BAND[riskBand]) return BAND[riskBand];
  if (score == null) return "low";
  if (score >= 67) return "high";
  if (score >= 34) return "medium";
  return "low";
}

// posture: high if a quarter of the region is high-band or avg risk is high;
// medium if any elevated presence; else low. Bands are already normalised.
export function posture(items: { band: RagBand; score: number | null }[]): RagBand {
  if (!items.length) return "low";
  const scores = items.map(i => i.score).filter((n): n is number => n != null);
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  const high = items.filter(i => i.band === "high").length;
  return high / items.length >= 0.25 || (avg ?? 0) >= 60 ? "high"
    : high > 0 || items.some(i => i.band === "medium") || (avg ?? 0) >= 33 ? "medium"
      : "low";
}

export type PostureFactory = { region: string | null; riskBand: string | null; score: number | null };

// Aggregate a flat factory list into per-canonical-region postures. Factories
// whose region name does not resolve to a canonical id are ignored (no
// fabricated geography).
export function regionPostures(factories: PostureFactory[]): Partial<Record<KsaRegionId, RagBand>> {
  const byId = new Map<KsaRegionId, { band: RagBand; score: number | null }[]>();
  for (const f of factories) {
    const id = resolveRegionId(f.region);
    if (!id) continue;
    (byId.get(id) ?? byId.set(id, []).get(id)!).push({ band: bandOf(f.riskBand, f.score), score: f.score });
  }
  const out: Partial<Record<KsaRegionId, RagBand>> = {};
  for (const [id, items] of byId) out[id] = posture(items);
  return out;
}
