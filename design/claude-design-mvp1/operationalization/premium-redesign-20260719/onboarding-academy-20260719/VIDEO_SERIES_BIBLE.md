# VIDEO_SERIES_BIBLE — Persona Academy & Platform Learning Media

**Document ID:** OBM-BIBLE-20260719-001
**Status:** CONTROLLED PROPOSAL — production standard for all learning media. No media exists yet: every filmed item in this bible is `MEDIA_DEP`; every provider-touching scene is `PROVIDER_DEP`.

## 1. Series architecture

| Series | Items | Type | Duration each |
|---|---|---|---|
| S1 Persona chapters | 13 launch personas (+ up to 3 reconciliation personas later) | Real-character film | 20–45s |
| S2 "Your day" storylines | 13 | Stills + narration (film optional later) | 2–4 min |
| S3 Task demonstrations | ~40 (from content matrix TASK rows) | Screen capture of real routes | 60–120s |
| S4 Visual explainers | 8 concepts | Motion graphics | 90–180s |
| S5 Demonstration chapters | 24 (4-hour storyline) + 8 (30-min) + 4 (10-min) | Presenter + screen | per storyline |
| S6 Contextual micro-guides | ~30 | Text-first, optional silent clips | ≤30s |

The 8 explainer concepts (S4): the Plan→Prepare→Inspect→Prove→Decide→Improve spine; immutable versions; one-open-review; offline outbox & conflict safety; geofence & override governance; provenance & freshness; provider truth (why some surfaces say unavailable); Arabic-first bilingual design.

## 2. Truth rules for the lens

1. Screen content in any frame must come from the real product at a named commit, on fixture data. No mocked composites of features that do not exist.
2. Provider-pending surfaces are filmed in their honest state (provider-pending room, unavailable map lens, AI destinations hidden). Narration explains *why* — governance, not absence of ambition.
3. Projected movement on operations screens is always narrated as projected. The words "live GPS" never appear in scripts unless the telemetry becomes live in a certified release.
4. No real factory names, CR numbers, licenses, coordinates of real facilities, or real personal data. Fixture entities only (privacy-safe mock data rule).
5. No unlicensed music, footage, fonts, or brand marks. Vision 2030 and ministry emblem usage requires written sponsor/brand authority (`SPONSOR_DECISION`) — the source storyboards use them, but storyboards are not a license.

## 3. Real-character standard

- **Settings:** genuine Saudi industrial and government environments — factory floor, industrial-city exterior, government office, operations room, committee room. See `CASTING_LOCATION_PPE_AND_RIGHTS_BRIEF.md` for sourcing and rights.
- **Representation:** credible male and female Saudi professionals across personas (source storyboards depict male inspectors in thobe/ghutra and female professionals in abaya/hijab, plus field staff in PPE — the series continues credible mixed representation without tokenism; final casting mix is a production decision under the brief).
- **PPE correctness:** any factory-floor frame shows correct PPE (hard hat, hi-vis, safety footwear; eye/hearing protection where the depicted zone requires it). Office/committee frames: business attire, no PPE props. PPE errors are P0 reshoot defects.
- **Language:** every filmed chapter is produced in Arabic and English (two VO/dialogue tracks or two shoots per production choice). Arabic is the primary track; Arabic scripts require qualified native review before release (inherits the platform's open Arabic human gate).

## 4. Accessibility (non-negotiable, per item)

Every video item ships with: closed captions (AR + EN), full transcript (AR + EN, downloadable), audio description track or AD-integrated narration, poster image fallback (also the pre-load state), reduced-motion alternative (stills sequence or transcript-first layout), and **no audible autoplay anywhere**. Player controls must be keyboard-operable and RTL-correct. These map to OB-AC-010..016.

## 5. Visual grammar

- Institutional, calm, light-first with dark peer; typography follows platform foundation (IBM Plex Sans Arabic; monospaced identifiers for IDs shown on screen).
- Screen captures: real viewport ratios (desktop 16:9, iPad field frames in both orientations); state chips and IDs legible at 1080p.
- Lower-thirds bilingual; RTL mirroring verified per frame in Arabic edits.
- Chapter cards carry: item ID, content version, product commit, release tag (e.g., `g11-g12-release-2026-07-16`), capture date.

## 6. Production pipeline

script (EN+AR) → truth review against CURRENT_STATE/route map → legal/rights check → shoot/capture → edit → accessibility pass (captions/transcript/AD/poster/reduced-motion) → native Arabic linguistic review → sponsor review where flagged → publish with content-version record.

A truth reviewer signs each script against the traceability CSV before shooting. Any script referencing a route/state not in the route map fails review.

## 7. Media states

Every content-matrix row carries `media_state` ∈ `NOT_STARTED | SCRIPTED | TRUTH_REVIEWED | SHOT | EDITED | A11Y_COMPLETE | AR_REVIEWED | PUBLISHED | STALE`. `STALE` is set automatically when a referenced route/state changes in a release. Poster/text fallback must reach `PUBLISHED` before or with any filmed chapter; the Academy never blocks on film.

## 8. Provider-dependency register for media

| Scene need | Dependency | Filmable now? |
|---|---|---|
| Virtual room with video tiles | Video provider (fail-closed) | Film provider-pending room only |
| Notification received by factory | Delivery confirmation (queued-only truth) | Film "queued" state; never show a delivered claim |
| Live route movement | GPS telemetry (projected-only) | Film projected view with label |
| Signature/PKI ceremony | Signature provider (acknowledgement unverified, never PKI-labelled) | Film generic acknowledgement truth |
| AI briefing | AI adapter + governance | Film `AI briefing not enabled` state |

## 9. Versioning & release linkage

Content register (proposed, `PROPOSAL`): one CSV/YAML row per item — `item_id, content_version, product_commit, release_tag, routes, states, languages, media_state, a11y_state, rights_expiry, stale_flag`. Release checklist adds: recapture or re-certify all TASK/S5 items whose routes changed; update `STALE` flags; re-issue posters where UI changed visibly. Talent/location rights carry expiry dates; expired rights force item unpublish (see rights brief).

## 10. Analytics

Per-item completion, revisit, drop-off point; per-persona-space entry counts. No numeric targets are defined here (`SPONSOR_DECISION`); analytics exist to find confusing chapters, not to grade users.
