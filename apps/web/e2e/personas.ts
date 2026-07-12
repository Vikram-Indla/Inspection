// Seeded demo personas (supabase/migrations/0011_factory360_gis_ksa_seed.sql;
// credentials as exercised by product-contract/evidence/b10_golden_journey.py).
// Domain renamed @mim.example → @mim.gov.sa 2026-07-12 (DEC-011 / SAQEEL-10),
// applied live via Auth Admin. G11 will rotate these; update here when rotation lands.
export const PERSONAS = {
  planner: { email: "planner@mim.gov.sa", password: "MimPlan!2026", home: "/planning" },
  inspector: { email: "inspector@mim.gov.sa", password: "MimField!2026", home: "/field" },
  reviewer: { email: "reviewer@mim.gov.sa", password: "MimRev!2026", home: "/reviews" },
} as const;

export type PersonaKey = keyof typeof PERSONAS;

export const storageStatePath = (key: PersonaKey) => `test-results/.auth/${key}.json`;
