# Inspection Platform data model and external-system boundaries

This document describes the data model present in the repository. It separates:

- **Native Saqeel records** stored in the project’s Supabase PostgreSQL database.
- **External-source custody and projections** stored by Saqeel but sourced from another system.
- **External provider-owned data or processing** that remains outside the Saqeel database.
- **Unclear or unavailable boundaries** where the repository does not prove a live contract.

It is a logical model, not a complete column-level ERD of every table in the migration history.

## System boundary

```mermaid
flowchart LR
  subgraph EXT["External systems — not native Saqeel data stores"]
    SENAEI["Senaei APIs<br/>factory, licence, task and submission data"]
    INDUSTRY["Industry Shared APIs<br/>contract not supplied / unavailable"]
    DOCUSIGN["DocuSign eSignature<br/>OAuth, envelopes and envelope status"]
    TWILIO_VIDEO["Twilio Video<br/>rooms, access tokens and remote media"]
    TWILIO_SMS["Twilio SMS<br/>fallback message transport"]
    RESEND["Resend<br/>email transport"]
    PUSH["Browser push services<br/>Apple / Google / Mozilla"]
    MARKER["Marker OCR worker<br/>document conversion and derivatives"]
    GEMINI["Google Gemini<br/>assistive AI advisories"]
    MAPBOX["Mapbox<br/>Directions API and map services"]
    CARTO["CARTO tile service<br/>Leaflet basemap tiles"]
  end

  subgraph EDGE["Saqeel integration and provider adapters"]
    SENAEI_ADAPTER["lib/integrations/senaei/*"]
    INDUSTRY_ADAPTER["lib/integrations/industry-shared/*"]
    SIGNATURE_ADAPTER["providers/signature-docusign.ts"]
    VIDEO_ADAPTER["providers/video-twilio.ts"]
    NOTIFY_ADAPTER["notify.ts + SMS / email / push adapters"]
    OCR_ADAPTER["providers/ocr-marker.ts"]
    AI_ADAPTER["providers/ai-gemini.ts"]
    MAP_ADAPTER["api/routing/eta + map rendering"]
  end

  subgraph NATIVE["Native Saqeel data in Supabase PostgreSQL"]
    IDENTITY["Identity and access<br/>profiles, roles, user_roles,<br/>permissions and capabilities"]
    CONFIG["Governed configuration<br/>regulations, inspection_items,<br/>packages, package_versions,<br/>engine_settings, config_versions"]
    FACTORY_CUSTODY["External-source custody<br/>external_source_connections,<br/>senaei_sync_runs/calls/raw_snapshots,<br/>factory_import_batches/rows,<br/>senaei_reconciliation_records"]
    FACTORY_MASTER["Native normalized factory projection<br/>commercial_registrations,<br/>industrial_licenses, factories,<br/>plant_addresses, production lines,<br/>factory documents/media/government records"]
    PLANNING["Planning and assignment<br/>visit_plans, visits, assignments,<br/>planning supervision/receipts"]
    EXECUTION["Inspection execution<br/>journey_sessions, geo_events,<br/>inspections, checklist_responses,<br/>evidence, findings"]
    OUTCOMES["Submission and outcomes<br/>submission_versions, reviews,<br/>violations, penalties, action forms,<br/>visit result reports"]
    VIRTUAL["Virtual inspection facts<br/>virtual_sessions, virtual_participants"]
    SIGNATURE["Signature and verification facts<br/>signature_acts, report_verifications,<br/>mvp3_signature_refusals"]
    COMMS["Communication truth<br/>notifications, notification_rules,<br/>notification_preferences,<br/>push_subscriptions"]
    DERIVATIVES["Advisory derivatives<br/>ocr_extractions, ai_suggestions,<br/>ai_events, inspector_briefing_cache"]
    CONTROL["Audit and integration control<br/>audit_events, semantic audit tables,<br/>mvp3_integration_endpoints/api_events,<br/>export_jobs and error_queue"]
    STORAGE["Supabase Storage<br/>evidence objects addressed by storage_path"]
  end

  SENAEI --> SENAEI_ADAPTER
  INDUSTRY --> INDUSTRY_ADAPTER
  DOCUSIGN --> SIGNATURE_ADAPTER
  TWILIO_VIDEO --> VIDEO_ADAPTER
  TWILIO_SMS --> NOTIFY_ADAPTER
  RESEND --> NOTIFY_ADAPTER
  PUSH --> NOTIFY_ADAPTER
  MARKER --> OCR_ADAPTER
  GEMINI --> AI_ADAPTER
  MAPBOX --> MAP_ADAPTER
  CARTO --> MAP_ADAPTER

  SENAEI_ADAPTER --> FACTORY_CUSTODY
  FACTORY_CUSTODY --> FACTORY_MASTER
  INDUSTRY_ADAPTER -. "unavailable facts only;<br/>no supplied live contract" .-> FACTORY_MASTER
  FACTORY_MASTER --> PLANNING
  CONFIG --> PLANNING
  IDENTITY --> PLANNING
  PLANNING --> EXECUTION
  CONFIG --> EXECUTION
  EXECUTION --> OUTCOMES
  EXECUTION --> STORAGE
  EXECUTION --> DERIVATIVES
  EXECUTION --> VIRTUAL
  VIRTUAL --> VIDEO_ADAPTER
  OUTCOMES --> SIGNATURE
  SIGNATURE --> SIGNATURE_ADAPTER
  NOTIFY_ADAPTER --> COMMS
  OCR_ADAPTER --> DERIVATIVES
  AI_ADAPTER --> DERIVATIVES
  MAP_ADAPTER --> PLANNING
  MAP_ADAPTER --> EXECUTION
  CONTROL -. "audits and receipts" .-> FACTORY_CUSTODY
  CONTROL -. "audits and receipts" .-> PLANNING
  CONTROL -. "audits and receipts" .-> EXECUTION
  CONTROL -. "audits and receipts" .-> OUTCOMES

  classDef external fill:#fff3cd,stroke:#9a6700,color:#3d2b00;
  classDef native fill:#e7f5ee,stroke:#16794b,color:#083d27;
  classDef edge fill:#e8f0fe,stroke:#2457a7,color:#102a52;
  class SENAEI,INDUSTRY,DOCUSIGN,TWILIO_VIDEO,TWILIO_SMS,RESEND,PUSH,MARKER,GEMINI,MAPBOX,CARTO external;
  class SENAEI_ADAPTER,INDUSTRY_ADAPTER,SIGNATURE_ADAPTER,VIDEO_ADAPTER,NOTIFY_ADAPTER,OCR_ADAPTER,AI_ADAPTER,MAP_ADAPTER edge;
  class IDENTITY,CONFIG,FACTORY_CUSTODY,FACTORY_MASTER,PLANNING,EXECUTION,OUTCOMES,VIRTUAL,SIGNATURE,COMMS,DERIVATIVES,CONTROL,STORAGE native;
```

## Native core relationships

```mermaid
erDiagram
  AUTH_USERS ||--|| PROFILES : "has profile"
  PROFILES ||--o{ USER_ROLES : "holds"
  ROLES ||--o{ USER_ROLES : "granted as"

  REGULATIONS ||--o{ REGULATION_CLAUSES : "contains"
  REGULATION_CLAUSES ||--o{ INSPECTION_ITEMS : "governs"
  PACKAGES ||--o{ PACKAGE_VERSIONS : "versions"
  PACKAGE_VERSIONS ||--o{ INSPECTIONS : "frozen into"

  COMMERCIAL_REGISTRATIONS ||--o{ INDUSTRIAL_LICENSES : "holds"
  FACTORIES ||--o| INDUSTRIAL_LICENSES : "normalized plant"
  FACTORIES ||--o{ PLANT_ADDRESSES : "has versions"
  FACTORIES ||--o{ VISITS : "is inspected by"

  VISIT_PLANS ||--o{ VISITS : "publishes"
  VISITS ||--o{ ASSIGNMENTS : "assigned through"
  PROFILES ||--o{ ASSIGNMENTS : "inspector"
  VISITS ||--o| INSPECTIONS : "executes as"
  VISITS ||--o| VIRTUAL_SESSIONS : "may schedule"
  VIRTUAL_SESSIONS ||--o{ VIRTUAL_PARTICIPANTS : "includes"

  INSPECTIONS ||--o{ CHECKLIST_RESPONSES : "records"
  INSPECTION_ITEMS ||--o{ CHECKLIST_RESPONSES : "answered by"
  INSPECTIONS ||--o{ EVIDENCE : "owns"
  INSPECTIONS ||--o{ FINDINGS : "produces"
  INSPECTIONS ||--o{ VIOLATIONS : "produces"
  FINDINGS ||--o{ VIOLATIONS : "supports"
  INSPECTIONS ||--o{ SUBMISSION_VERSIONS : "snapshotted as"
  SUBMISSION_VERSIONS ||--o{ REVIEWS : "reviewed by"
  SUBMISSION_VERSIONS ||--o{ SIGNATURE_ACTS : "signed or refused"
  SIGNATURE_ACTS ||--o| SIGNATURE_REFUSALS : "details refusal"

  EVIDENCE ||--o{ OCR_EXTRACTIONS : "derives advisory text"
  PROFILES ||--o{ NOTIFICATIONS : "receives"
  PROFILES ||--o{ PUSH_SUBSCRIPTIONS : "registers"
```

## Ownership and persistence by external system

| External system | What remains external | Native Saqeel records or references | Proven repository boundary |
|---|---|---|---|
| **Senaei** | Upstream API data and provider-side task/submission state | `external_source_connections`, `senaei_sync_runs`, `senaei_sync_calls`, `senaei_raw_snapshots`, import/reconciliation records, then normalized commercial registration/licence/factory/plant records with source metadata | `apps/web/src/lib/integrations/senaei/*`; `20260720010000_factory360_v2_foundation.sql` |
| **Industry Shared** | All authoritative provider data | Canonical projection returns explicit unavailable/contract-unverified facts; demo rows can carry `industry_shared_demo_seed` provenance | Client exists under `lib/integrations/industry-shared/*`, but it returns `INDUSTRY_SHARED_API_CONTRACT_NOT_SUPPLIED`; live ownership is **unclear — needs confirmation** |
| **DocuSign** | OAuth tokens, envelopes, signer workflow, envelope status | `signature_acts` stores the native signature/refusal fact; `report_verifications` stores provider/status/detail evidence | `providers/signature-docusign.ts`; committee actions. Adapter is explicitly short-term and not the production KSA PKI/EBDA authority |
| **Twilio Video** | Twilio room resource, access-token service, remote participant media and any provider-side media state | `virtual_sessions` and `virtual_participants`; Saqeel uses the session ID as the Twilio room unique name | `providers/video-twilio.ts`; virtual video actions. No native table column for Twilio Room SID was found |
| **Twilio SMS** | Message transport and Twilio message SID/status | `notifications` remains the communication source of truth, including channel and delivery state | `providers/sms-twilio.ts` registered through `notify.ts`; Twilio is coded as the fallback SMS transport, not a native OTP engine |
| **Resend** | Email transport and provider message ID | `notifications` delivery row | `providers/email-resend.ts` registered through `notify.ts` |
| **Browser push services** | Apple/Google/Mozilla delivery infrastructure | `push_subscriptions` stores endpoints/keys; `notifications` stores the delivery attempt/truth | `providers/push-webpush.ts`; Web Push uses self-issued VAPID credentials but external browser push services |
| **Marker OCR worker** | Document conversion process and worker job execution | `ocr_extractions` stores advisory derivatives linked to original `evidence`; original evidence is not replaced | `providers/ocr-marker.ts`; imported by both current OCR action paths |
| **Google Gemini** | Model inference | `ai_suggestions`, append-only `ai_events`, and `inspector_briefing_cache` store advisory output/state | `providers/ai-gemini.ts`. `ocr-gemini.ts` exists but has no import site; current OCR actions import Marker |
| **Mapbox** | Directions response and provider map services | ETA/distance is returned by the route handler; native planning/journey/geo records retain Saqeel coordinates and events | `app/api/routing/eta/route.ts`, Mapbox-related provider code |
| **CARTO** | Basemap tiles | No CARTO-owned business data is copied into native tables | Leaflet map components reference remote tile service; exact deployment/provider SLA is **unclear — needs confirmation** |
| **Supabase managed platform** | Hosted Auth, PostgREST, Storage service and database infrastructure | The PostgreSQL schema is the native Saqeel system of record; `profiles.user_id` references `auth.users`; evidence rows reference Storage object paths | `@supabase/ssr`, `@supabase/supabase-js`, migrations and Storage calls |

## Native domain groups

| Native domain | Key tables |
|---|---|
| Identity and authorization | `profiles`, `roles`, `user_roles`, `permissions`, `role_permissions`, `capabilities`, `role_capabilities`, `user_capability_grants` |
| Governed configuration | `config_versions`, `engine_settings`, `regulations`, `regulation_clauses`, `inspection_items`, item versions/states, `packages`, `package_versions`, package snapshots, `violation_codes`, `penalty_mappings`, notification and planning configuration |
| Factory 360 and master data | `commercial_registrations`, `industrial_licenses`, `factories`, `plant_addresses`, `plant_production_line_items`, products/materials, documents/media/government records, risk snapshots, inspection factory snapshots |
| Planning and assignment | `visit_plans`, `visits`, `assignments`, `visit_packages`, planning supervision requests, process commands/targets/receipts, mutation receipts and archives |
| Field journey and inspection | `journey_sessions`, `geo_events`, location corrections/events, `inspections`, `checklist_responses`, `evidence`, `findings`, visit preparations and attachments |
| Submission, review and enforcement | `submission_versions`, `reviews`, review comments, `violations`, `inspection_penalties`, penalty notices, `action_forms`, enforcement recommendations, bulk violation batches/items, visit result reports/samples/seized products |
| Virtual inspection | `virtual_sessions`, `virtual_participants` |
| Communication | `notifications`, `notification_rules`, `notification_preferences`, `push_subscriptions` |
| Advisory AI/OCR | `ai_suggestions`, `ai_events`, `ocr_extractions`, `inspector_briefing_cache` |
| Audit and integration control | `audit_events`, semantic audit tables, `mvp3_integration_endpoints`, `mvp3_api_events`, `mvp3_export_jobs`, `mvp3_error_queue` |

## Boundary findings

- **Native does not mean locally hosted.** Supabase is an external managed platform, but its PostgreSQL schema is the native Saqeel system of record.
- **A provider adapter is not a data store.** Credentials remain in environment variables; they are not part of the database model.
- **External-source copies keep provenance.** Senaei custody/raw/import tables are native Saqeel records about an external feed; normalized factory records remain source-labelled.
- **Remote media is not evidence by default.** Twilio owns room/media transport. The checked-in model does not prove that a recording is enabled, retained, or copied into `evidence`.
- **Delivery acceptance is not human receipt.** Twilio SMS, Resend, and Web Push adapter success means the external service accepted the message; `notifications.delivery_state` must not be interpreted as proof that a person read it.
- **OCR and AI outputs are advisory.** `ocr_extractions` and `ai_suggestions` do not become authoritative inspection answers without governed human action.
- **Industry Shared remains an explicit gap.** The repository contains types and an unavailable-result client, but no supplied live API contract or runtime fetch.
- **DocuSign is not the final trust authority.** The adapter comments identify it as a short-term provider; production KSA PKI/EBDA selection remains outside the proven model.

## Evidence used

- Table, foreign-key, RLS, trigger, view and RPC definitions under `supabase/migrations/*`.
- Provider and integration adapters under `apps/web/src/lib/providers/*` and `apps/web/src/lib/integrations/*`.
- Actual provider import/call sites in committee, virtual inspection, notification, Factory 360, AI and OCR flows.
- Environment-variable contract in `apps/web/.env.example`.
- Supabase client, Storage and route-handler calls under `apps/web/src`.
