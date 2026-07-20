# Approved Plain-Language Terminology Glossary

This is the canonical glossary applied across Waves 1-4 of the plain-language
terminology remediation project. It reflects what was actually implemented,
not just what was proposed — where implementation diverged from the initial
proposal (usually because a term turned out to describe a different concept
in a given context), the divergence and rationale are noted inline.

## Principal decision: "dossier" is banned

| Context | English | Arabic |
|---|---|---|
| Factory-list row action | View factory | عرض المصنع |
| Destination-page concept (Factory 360) | Factory profile | ملف المصنع |
| "Factory 360" module name | **unchanged** | **unchanged** |

Contextual exceptions actually applied (the word "dossier" describes a
different business object in these surfaces, so the Factory-360-specific
mapping does not apply — a generic plain-language noun was used instead):

| Surface | Old | New | Why not "Factory profile" |
|---|---|---|---|
| Regulations detail (`/admin/regulations`) | Open dossier | Open record | Regulation/clause detail record, not a factory |
| Audit replay (`/admin/audit`) | Point-in-time dossier | Point-in-time snapshot | Forensic event-replay snapshot, not a factory |
| Committee (`/committee`) | Committee decision dossier | Committee decision record | Committee decision packet, not a factory |

## Factory 360

| Old | New (EN) | New (AR) |
|---|---|---|
| dossier (row action) | View factory | عرض المصنع |
| Factory dossier / CR dossier | Factory profile | ملف المصنع |
| factory registry / registry | Factory list | قائمة المصانع |
| license portfolio | All licenses | جميع التراخيص / كل التراخيص |
| selected context | Current factory and license | — |
| penalty lineage | Penalty history | سجل العقوبات |
| source-backed | From official records | — |
| degraded | Temporarily unavailable | — |
| available — no records | No records found | — |
| "CR not in your scope or does not exist" | Factory registration not found or not available to you. | — |
| "This CR dossier is outside your authorized permissions." | You do not have access to this factory profile. | ليس لديك صلاحية لعرض ملف هذا المصنع |
| factory master | Factory list | — |

## Planning

| Old | New |
|---|---|
| Bulk planning | Plan multiple visits |
| Single visit | Plan one visit |
| Immediate visit / Urgent dispatch | Create an urgent visit |
| plan register | Visit plans |
| inspection package (ordinary user) | Inspection checklist |
| published inspection package (ordinary user) | Active inspection checklist |

## Review & Approval

| Old | New (EN) | New (AR) |
|---|---|---|
| Level 2 review queue (page title) | Inspection review queue | قائمة انتظار مراجعة التفتيش |
| Evidence readiness & SLA-risk fingerprint | Review readiness | جاهزية المراجعة |
| Workspace (action) | Open review | فتح المراجعة |
| Scan-first queue | Review overview | نظرة عامة على المراجعة |
| Queue clear | No inspections awaiting review | لا توجد عمليات تفتيش بانتظار المراجعة |
| immutable submitted version (ordinary user) | Final submitted version | النسخة النهائية المُقدَّمة |
| frozen package definition | Checklist version used for the inspection | — |

## Operations Center

| Old | New (EN) | New (AR) |
|---|---|---|
| SLA watch | Deadline alerts | تنبيهات المواعيد النهائية |
| operational (column) | Visit status | حالة الزيارة |
| geofence override approvals | Location exception requests | طلبات استثناء الموقع |
| KSA operations map | Live inspection map | خريطة التفتيش المباشرة |
| Partial service | Some information could not be loaded | تعذّر تحميل بعض المعلومات |

## Navigation & Administration

| Old | New (EN) | New (AR) |
|---|---|---|
| Compliance Library | Inspection Rules | قواعد التفتيش |
| Enforcement Library | Violations & Penalties | المخالفات والعقوبات |
| Approval Queue | Awaiting Approval | بانتظار الاعتماد |
| Lookup Management | Reference Lists | القوائم المرجعية |
| Risk Configuration | Risk Settings | إعدادات المخاطر |
| Survey Configuration | Inspection Forms | نماذج التفتيش |
| Notification Configuration | Notification Settings | إعدادات الإشعارات |
| Integration Management | System Connections | اتصالات النظام |
| Workflow Configuration | Workflow Settings | إعدادات سير العمل |
| GIS Configuration | Map Settings | إعدادات الخرائط |
| Audit Trail | Activity Log | سجل النشاط |
| Platform Operations | System Operations | عمليات النظام |
| Localization | Language & Translations | اللغة والترجمة |
| Bulk Violation Issuance | Issue Multiple Violations | إصدار عدة مخالفات |
| Enforcement Cases | Violation Cases | قضايا المخالفات |
| "RLS-scoped" (dev jargon) | Filtered to your access (contextual) | — |

## Legal / regulatory terms — kept, not simplified

Commercial Registration, Industrial License, Violation, Penalty, Compliance,
Corrective Action, Approved, Rejected, Returned, Legal Identity, Inspection
Evidence — these keep their precise legal meaning. "CR" is spelled out as
"Commercial Registration (CR)" on first meaningful occurrence per screen,
then compacted to "CR number" on subsequent occurrences (existing pattern,
verified not regressed).

## Contextual, not global, exceptions

- **SLA**: rendered as "Deadline"/"Deadline status" for ordinary
  planner/reviewer-facing surfaces (Reviews, Operations Center). Kept as
  literal "SLA" in `admin/notifications` and config-provenance text
  (`ops.sla.confNote`, "Thresholds from engine_settings") — these are
  admin-configuration surfaces where SLA is the actual setting being edited.
- **geofence**: reworded to "location exception"/"approved inspection
  location" for inspector-facing text (Operations override queue). Kept as
  literal "geofence" in `/admin/gis` (the GIS admin configuration screen
  itself — an admin configuring geofencing needs the precise term) and in
  technical/audit contexts (`geofence_result` DB enum values shown in an
  audit trail).
- **registry**: mapped to "Factory list" specifically for the app's own
  factory listing. Left unchanged where it names a different domain object:
  "Governed endpoint registry" (integration endpoints, `/admin/integrations`),
  "Governed template registry" / `TemplateRegistry` (package/checklist
  templates, `/admin/packages`), `audit_event_registry` (DB table name).

## Not touched (internal architecture)

`dossier.ts`, `loadFactory360Dossier`, `Factory360Dossier`, `dossierStrings`,
`dossier_href`, `IdentityDossier`/`SaudiAtlasDossier` (unrelated internal
component names), CSS classes (`lg-atlas3d__dossier*`, `ar-dossier`), route
paths, database columns/tables, API contract field names, test IDs,
`FEATURE_DECISION_DOSSIER` env var name, and code comments. See
`docs/terminology/PLAIN_LANGUAGE_INVENTORY.csv` finding `F0-048` for the
full internal-symbol inventory.
