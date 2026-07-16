# STATE_MATRIX_CD-004_R2.md
| # | State | Frame | Announce | Notes |
|---|---|---|---|---|
| 1 | Loading (per-source) | r2l-1 | polite | structure first; no invented numbers |
| 2 | Populated | r2e/r2f/r2g/r2h/r2i/r2j | none | AR/EN x dark/light x 1440/1024, identical state |
| 3 | Verified zero (first-use) | r2l-2 | none | distinct in glyph+word from unavailable |
| 4 | Degraded — one source | r2e row3, r2l-3 + r2l-3AR | assertive once | isolated; unknown not zero; per-source retry |
| 5 | Total read failure | r2l-5 | assertive | reads failed; no platform/provider verdict |
| 6 | Stale/last-known | r2l-8 | polite | age as fact; no threshold verdict |
| 7 | Unauthorized | r2l-6 | none | designed; guard HANDOFF_BLOCKED; truth stated |
| 8 | Read-only role | r2l-7 | none | visibility != authority; no unauthorized affordance |
| 9 | Recovery | r2l-4 + r2l-4AR | polite | focus to retried row; chrome drops |
| 10 | Offline | — | — | NOT_APPLICABLE: server-rendered, no client mutation |
| 11 | Sync conflict | — | — | NOT_APPLICABLE: same reason |
