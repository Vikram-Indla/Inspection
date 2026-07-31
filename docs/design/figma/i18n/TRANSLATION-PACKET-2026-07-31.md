# Translation packet — 2026-07-31

Arabic needed for the 13 screens added to the SAQEEL Figma file on 2026-07-31 (`SCR-WEB-110/120/130/140/150/200/210/310/320/400`, `SCR-VIR-700/710/720`).

## Why this exists

All four Figma sections now carry those screens. The AR·RTL and AR·RTL·Dark copies are structurally mirrored — children of every horizontal auto-layout reversed, inline padding swapped, text alignment flipped — but the copy is only as Arabic as the approved catalogue allowed.

- Strings on the new screens: **421**
- Already approved in `docs/design/saqeel-ar-strings.json`: **61**
- Numbers, codes and glyphs needing no translation: **~68**
- **In this packet: 311**

Nothing here was machine-translated. CLAUDE.md rule 8 keeps Arabic in the i18n layer under review; inventing it in a design file would put unreviewed government copy in front of inspectors.

## How to use it

1. Fill the `ar` column in `TRANSLATION-PACKET-2026-07-31.csv`. Leave a row blank if the English is wrong — that is a copy defect, not a translation task.
2. Return the file. The approved pairs merge into `docs/design/saqeel-ar-strings.json` and seed `ui_strings` via `/admin/localization`, which is where the runtime reads Arabic from (`apps/web/src/lib/i18n.ts`).
3. The Figma AR sections are then re-run from the same dictionary.

## Priority

| Priority | Meaning | Rows |
|---|---|---|
| P1 | Interface copy an Arabic user reads to operate the screen — titles, field terms and hints, form labels, actions, alert and empty-state bodies. Blocks AR sign-off. | 153 |
| P2 | Status and badge labels, counts, evidence captions. Should be translated; several may already exist in the catalogue under a different English string. | 89 |
| P3 | Seeded demo content — factory names, visit references, timestamps. Visible in the AR screenshots but not governed copy. | 69 |

## P1 — blocks AR sign-off

| Key | English | Screens | Kind |
|---|---|---|---|
| `factory360.approvedViolationsCorrectiveActions` | Approved violations & corrective actions | SCR-WEB-400 | section-title |
| `factory360.commercialRegistrationLegalIdentity` | Commercial registration & legal identity | SCR-WEB-400 | section-title |
| `factory360.licensesPlants` | Licenses & plants | SCR-WEB-400 | section-title |
| `planning.bulk.andOr` | AND/OR | SCR-WEB-110 | section-title |
| `planning.bulk.carriedIntoVisitConfiguration` | Carried into visit configuration | SCR-WEB-110 | field-hint |
| `planning.bulk.conditionGroupingIsAMandatory` | Condition grouping is a mandatory region of SCR-WEB-110. The operator model is not configured. | SCR-WEB-110 | state-body |
| `planning.bulk.filterBuilder` | Filter builder | SCR-WEB-110 | section-title |
| `planning.bulk.lastInspectionBefore` | Last inspection before | SCR-WEB-110 | form-label |
| `planning.bulk.matchingFactories` | Matching factories | SCR-WEB-110 | field-term |
| `planning.bulk.resultCount` | Result count | SCR-WEB-110 | section-title |
| `planning.bulk.retrievedFromTheGovernedSenaei` | Retrieved from the governed SENAEI mirror | SCR-WEB-110 | field-hint |
| `planning.bulk.riskBand` | Risk band | SCR-WEB-110 SCR-WEB-120 | form-label |
| `planning.bulk.selectedTargets` | Selected targets | SCR-WEB-110 | field-term |
| `planning.bulk.selection` | Selection | SCR-WEB-110 | section-title |
| `planning.bulk.targetingCriteria` | Targeting criteria | SCR-WEB-110 | page-title |
| `planning.configure.configurationForm` | Configuration form | SCR-WEB-140 | section-title |
| `planning.configure.conflictPanel` | Conflict panel | SCR-WEB-140 | section-title |
| `planning.configure.mode` | Mode | SCR-WEB-140 SCR-VIR-700 | section-title |
| `planning.configure.overlappingVisitsAndInspectorAvailability` | Overlapping visits and inspector availability are a mandatory region of SCR-WEB-140. No conflict source is configured. | SCR-WEB-140 | state-body |
| `planning.configure.packageVersion` | Package version | SCR-WEB-140 | section-title |
| `planning.configure.physicalOrVirtualDrivesJourney` | Physical or virtual; drives journey and arrival rules | SCR-WEB-140 | field-hint |
| `planning.configure.supportingInspectors` | Supporting inspectors | SCR-WEB-140 | form-label |
| `planning.configure.team` | Team | SCR-WEB-140 | section-title |
| `planning.configure.thePublishedVersionTheVisit` | The published version the visit will execute | SCR-WEB-140 | field-hint |
| `planning.configure.visitConfigurationAssignment` | Visit configuration & assignment | SCR-WEB-140 | page-title |
| `planning.immediate.assignment` | Assignment | SCR-WEB-130 SCR-WEB-210 | section-title |
| `planning.immediate.identityLocation` | Identity / location | SCR-WEB-130 | section-title |
| `planning.immediate.immediateVisit` | Immediate visit | SCR-WEB-130 | page-title |
| `planning.immediate.location` | Location | SCR-WEB-130 | form-label |
| `planning.immediate.reasonForImmediateVisit` | Reason for immediate visit | SCR-WEB-130 | form-label |
| `planning.immediate.registeredFactory` | Registered factory | SCR-WEB-130 | form-label |
| `planning.immediate.unregisteredEstablishmentName` | Unregistered establishment name | SCR-WEB-130 | form-label |
| `planning.immediate.urgencyReason` | Urgency reason | SCR-WEB-130 | section-title |
| `planning.review.assignedInspectors` | Assigned inspectors | SCR-WEB-150 | field-term |
| `planning.review.assignments` | Assignments | SCR-WEB-150 | section-title |
| `planning.review.draftPlanUnderReview` | Draft plan under review | SCR-WEB-150 | field-hint |
| `planning.review.howTheTargetsWereSelected` | How the targets were selected | SCR-WEB-150 | field-hint |
| `planning.review.method` | Method | SCR-WEB-150 | field-term |
| `planning.review.notifications` | Notifications | SCR-WEB-150 | section-title |
| `planning.review.planReviewPublish` | Plan review & publish | SCR-WEB-150 | page-title |
| `planning.review.plannerAndTimestamp` | Planner and timestamp | SCR-WEB-150 | field-hint |
| `planning.review.publishNotificationsAreAMandatory` | Publish notifications are a mandatory region of SCR-WEB-150. No notification rule is configured. | SCR-WEB-150 | state-body |
| `planning.review.publishValidationIsAMandatory` | Publish validation is a mandatory region of SCR-WEB-150. No validation rule set is configured. | SCR-WEB-150 | state-body |
| `planning.review.setDuringVisitConfiguration` | Set during visit configuration | SCR-WEB-150 SCR-VIR-700 | field-hint |
| `planning.review.targets` | Targets | SCR-WEB-150 | section-title |
| `planning.review.validation` | Validation | SCR-WEB-150 | section-title |
| `planning.review.visits` | Visits | SCR-WEB-150 | section-title |
| `planning.single.assignedInspector` | Assigned inspector | SCR-WEB-120 SCR-WEB-130 SCR-WEB-140 SCR-WEB-210 | form-label |
| `planning.single.commercialRegistration` | Commercial registration | SCR-WEB-120 | field-hint |
| `planning.single.currentGovernedBand` | Current governed band | SCR-WEB-120 | field-hint |
| `planning.single.inspectionPackage` | Inspection package | SCR-WEB-120 SCR-WEB-140 SCR-WEB-210 SCR-VIR-720 | form-label |
| `planning.single.resolvedFromTheGovernedMirror` | Resolved from the governed mirror | SCR-WEB-120 | field-hint |
| `planning.single.singleVisitPlanning` | Single visit planning | SCR-WEB-120 | page-title |
| `planning.single.visitConfiguration` | Visit configuration | SCR-WEB-120 | section-title |
| `reviews.compare.baseline` | Baseline | SCR-WEB-320 | field-term |
| `reviews.compare.comparedVersions` | Compared versions | SCR-WEB-320 | section-title |
| `reviews.compare.fieldLevelDifferences` | Field-level differences | SCR-WEB-320 | section-title |
| `reviews.compare.inspectionWindow` | Inspection window | SCR-WEB-320 | field-term |
| `reviews.compare.riskWeight` | Risk weight | SCR-WEB-320 | field-term |
| `reviews.compare.theResubmittedVersionUnderReview` | The resubmitted version under review | SCR-WEB-320 | field-hint |
| `reviews.compare.theVersionCurrentlyApproved` | The version currently approved | SCR-WEB-320 | field-hint |
| `reviews.compare.versionComparison` | Version comparison | SCR-WEB-320 | page-title |
| `reviews.workspace.approve` | Approve | SCR-WEB-310 | action |
| `reviews.workspace.decisionNote` | Decision note | SCR-WEB-310 | form-label |
| `reviews.workspace.escalate` | Escalate | SCR-WEB-310 | action |
| `reviews.workspace.findings` | Findings | SCR-WEB-310 | section-title |
| `reviews.workspace.fireSuppressionSystemNotServiced` | Fire suppression system not serviced | SCR-WEB-310 | section-title |
| `reviews.workspace.inspectionReviewQueue` | Inspection review queue | SCR-WEB-310 | page-title |
| `reviews.workspace.queue` | Queue | SCR-WEB-310 | section-title |
| `reviews.workspace.reject` | Reject | SCR-WEB-310 | action |
| `reviews.workspace.requiredForRejectionOrEscalation` | Required for rejection or escalation | SCR-WEB-310 | placeholder |
| `reviews.workspace.supervisorReview` | Supervisor review | SCR-WEB-310 | section-title |
| `reviews.workspace.unverified` | Unverified | SCR-WEB-310 | form-label |
| `reviews.workspace.verified` | Verified | SCR-WEB-310 SCR-VIR-700 | form-label |
| `virtual.appointment.appointment` | Appointment | SCR-VIR-700 | section-title |
| `virtual.appointment.camera` | Camera | SCR-VIR-700 | field-term |
| `virtual.appointment.checkedInTheBrowserBefore` | Checked in the browser before joining | SCR-VIR-700 | field-hint |
| `virtual.appointment.connection` | Connection | SCR-VIR-700 SCR-VIR-720 | field-term |
| `virtual.appointment.deviceReadiness` | Device readiness | SCR-VIR-700 | section-title |
| `virtual.appointment.instructions` | Instructions | SCR-VIR-700 | section-title |
| `virtual.appointment.joinAdmitAndRescheduleAre` | Join, admit and reschedule are a mandatory region of SCR-VIR-700. The virtual session provider is not configured. | SCR-VIR-700 | state-body |
| `virtual.appointment.joinControls` | Join controls | SCR-VIR-700 | section-title |
| `virtual.appointment.joiningInstructionsAreAMandatory` | Joining instructions are a mandatory region of SCR-VIR-700. No instruction template is configured. | SCR-VIR-700 | state-body |
| `virtual.appointment.measuredAgainstTheMinimumGoverned` | Measured against the minimum governed threshold | SCR-VIR-700 | field-hint |
| `virtual.appointment.microphone` | Microphone | SCR-VIR-700 | field-term |
| `virtual.appointment.participants` | Participants | SCR-VIR-700 | section-title |
| `virtual.appointment.participantsAreHeldUntilThe` | Participants are held until the inspector admits them. Admission is recorded on the visit audit trail. | SCR-VIR-700 | alert-body |
| `virtual.appointment.plannedAppointmentWindow` | Planned appointment window | SCR-VIR-700 | field-hint |
| `virtual.appointment.scheduledWindow` | Scheduled window | SCR-VIR-700 | field-term |
| `virtual.appointment.theGovernedVisitThisAppointment` | The governed visit this appointment serves | SCR-VIR-700 | field-hint |
| `virtual.appointment.unavailable` | Unavailable | SCR-VIR-700 SCR-VIR-720 | state-title |
| `virtual.appointment.virtualAppointmentVa2081` | Virtual appointment · VA-2081 | SCR-VIR-700 | page-title |
| `virtual.appointment.waitingRoom` | Waiting room | SCR-VIR-700 | alert-title |
| `virtual.session.agenda` | Agenda | SCR-VIR-720 | section-title |
| `virtual.session.appliedWhenTheSessionCannot` | Applied when the session cannot continue remotely | SCR-VIR-720 | field-hint |
| `virtual.session.checklist` | Checklist | SCR-VIR-720 | section-title |
| `virtual.session.derivedFromThePackage` | Derived from the package | SCR-VIR-720 | field-hint |
| `virtual.session.everyCaptureIsBoundTo` | Every capture is bound to the checklist item open at the time and cannot be reassigned afterwards. | SCR-VIR-720 | alert-body |
| `virtual.session.evidenceIsCapturedLive` | Evidence is captured live | SCR-VIR-720 | alert-title |
| `virtual.session.fallback` | Fallback | SCR-VIR-720 | field-term |
| `virtual.session.independentOfTheVisitPlanning` | Independent of the visit planning status | SCR-VIR-720 | field-hint |
| `virtual.session.insufficientEvidence` | Insufficient evidence | SCR-VIR-720 | state-title |
| `virtual.session.notes` | Notes | SCR-VIR-720 | section-title |
| `virtual.session.oneAnsweredItemHasNo` | One answered item has no evidence attached. The session cannot be closed until every non-compliant response carries evidence. | SCR-VIR-720 | state-body |
| `virtual.session.participantList` | Participant list | SCR-VIR-720 | section-title |
| `virtual.session.sections` | Sections | SCR-VIR-720 | field-term |
| `virtual.session.sessionNotes` | Session notes | SCR-VIR-720 | form-label |
| `virtual.session.sessionState` | Session state | SCR-VIR-720 | field-term |
| `virtual.session.theLiveVideoRegionIs` | The live video region is a mandatory region of SCR-VIR-720. The virtual session provider is not configured. | SCR-VIR-720 | state-body |
| `virtual.session.thePublishedVersionThisSession` | The published version this session executes | SCR-VIR-720 | field-hint |
| `virtual.session.video` | Video | SCR-VIR-720 | section-title |
| `virtual.verify.appliedWhenTheRetryLimit` | Applied when the retry limit is reached | SCR-VIR-710 | field-hint |
| `virtual.verify.attemptsUsed` | Attempts used | SCR-VIR-710 | field-term |
| `virtual.verify.audit` | Audit | SCR-VIR-710 | section-title |
| `virtual.verify.countedAgainstTheGovernedRetry` | Counted against the governed retry limit | SCR-VIR-710 | field-hint |
| `virtual.verify.declaredAtAppointmentCreation` | Declared at appointment creation | SCR-VIR-710 | field-hint |
| `virtual.verify.determinesWhatTheParticipantMay` | Determines what the participant may see | SCR-VIR-710 | field-hint |
| `virtual.verify.exception` | Exception | SCR-VIR-710 | section-title |
| `virtual.verify.identityDetails` | Identity details | SCR-VIR-710 | section-title |
| `virtual.verify.identityVerificationVs40066` | Identity verification · VS-40066 | SCR-VIR-710 | page-title |
| `virtual.verify.lockout` | Lockout | SCR-VIR-710 | field-term |
| `virtual.verify.matchedAgainstTheGovernedRecord` | Matched against the governed record | SCR-VIR-710 | field-hint |
| `virtual.verify.nationalId` | National ID | SCR-VIR-710 | field-term |
| `virtual.verify.oneTimePasscode` | One-time passcode | SCR-VIR-710 | form-label |
| `virtual.verify.otpState` | OTP state | SCR-VIR-710 | section-title |
| `virtual.verify.retries` | Retries | SCR-VIR-710 | section-title |
| `virtual.verify.sessionLocked` | Session locked | SCR-VIR-710 | alert-title |
| `virtual.verify.theSessionStaysLockedUntil` | The session stays locked until every required participant is verified. Verification cannot be waived from this screen. | SCR-VIR-710 | alert-body |
| `virtual.verify.theVerificationExceptionPathIs` | The verification exception path is a mandatory region of SCR-VIR-710. No escalation rule is configured. | SCR-VIR-710 | state-body |
| `visits.detail.currentOfficialRecord` | Current official record | SCR-WEB-210 | field-hint |
| `visits.detail.fromTheGovernedMirror` | From the governed mirror | SCR-WEB-210 | field-hint |
| `visits.detail.geofenceAndArrivalAreA` | Geofence and arrival are a mandatory region of SCR-WEB-210. The map provider is not configured. | SCR-WEB-210 | state-body |
| `visits.detail.independentOfOperationalState` | Independent of operational state | SCR-WEB-210 | field-hint |
| `visits.detail.independentOfPlanningStatus` | Independent of planning status | SCR-WEB-210 | field-hint |
| `visits.detail.industrialLicence` | Industrial licence | SCR-WEB-210 | field-term |
| `visits.detail.map` | Map | SCR-WEB-210 | section-title |
| `visits.detail.package` | Package | SCR-WEB-210 | section-title |
| `visits.detail.plannedWindow` | Planned window | SCR-WEB-210 | field-hint |
| `visits.detail.schedule` | Schedule | SCR-WEB-210 | section-title |
| `visits.detail.setDuringPlanning` | Set during planning | SCR-WEB-210 | field-hint |
| `visits.detail.thePublishedVersionThisVisit` | The published version this visit executes | SCR-WEB-210 | field-hint |
| `visits.detail.theVisitTimelineIsA` | The visit timeline is a mandatory region of SCR-WEB-210. No timeline source is configured. | SCR-WEB-210 | state-body |
| `visits.list.anyCity` | Any city | SCR-WEB-200 | filter-option |
| `visits.list.anyInspector` | Any inspector | SCR-WEB-200 | filter-option |
| `visits.list.anyRegion` | Any region | SCR-WEB-200 | filter-option |
| `visits.list.anyStatus` | Any status | SCR-WEB-200 | filter-option |
| `visits.list.anyType` | Any type | SCR-WEB-200 | filter-option |
| `visits.list.anyWindow` | Any window | SCR-WEB-200 | filter-option |
| `visits.list.cancelled` | Cancelled | SCR-WEB-200 | kpi-label |
| `visits.list.planningStatusAndOperationalState` | Planning status and operational state are two independent tracks and are never merged. Rescheduling, reassignment, cancellation, bulk actions and publish/return are not available here. | SCR-WEB-200 | alert-body |
| `visits.list.readOnlyWorkspace` | Read-only workspace | SCR-WEB-200 | alert-title |
| `visits.list.visitIdReferenceFactoryName` | Visit ID / reference, factory name, CR number, industrial licence, inspector | SCR-WEB-200 | placeholder |
| `visits.list.visitManagement` | Visit management | SCR-WEB-200 | page-title |

## Notes for the reviewer

- `shared = yes` means the string appears on more than one screen; one Arabic value serves all of them, so keep it screen-neutral.

- Every `state-body` row follows one pattern: *what the region is, why it is empty*. Keep that two-part shape — it is what tells an inspector the data is missing rather than the screen being broken.

- `field-hint` rows state a value's provenance ("From the governed mirror", "Set during planning"). They are not help text and should not become instructions.

- Contract IDs inside a string (`SCR-WEB-140`, `SFR-2021 §4.2`) stay untranslated, as they do in `i18n-keys.generated.ts`.

