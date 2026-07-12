# MVP1 Canonical End-to-End Inspection Process

This sequence is authoritative. P06A and P06B are alternate execution branches that converge into P07.

## P00 - Pre-Day-0 Configuration
**Owner:** Compliance Admin  
**Channel:** Admin Portal  
**Source modules:** M09  
**Purpose:** Make the platform executable before any inspection exists.

### Business events
1. Configure regulations, inspection items and response meanings
2. Configure evidence, violations, penalties and action triggers
3. Configure workflow, roles, notifications, SLA, risk inputs and GIS policies
4. Validate dependencies, publish and lock effective versions

### Outputs
- Published configuration versions
- Approved package catalogue
- Active workflow and reference data
- Audit and impact record

### State intent
`Draft -> Validated -> Approved -> Published -> Locked`

### Engines
- ENG-01
- ENG-02
- ENG-03
- ENG-04
- ENG-06
- ENG-08
- ENG-11
- ENG-12

### Failure controls
- Missing dependency blocks publish
- Invalid effective dates block publish
- Runtime may not consume draft configuration

## P01 - Targeting & Planning Method
**Owner:** Planner  
**Channel:** Web Portal  
**Source modules:** M01  
**Purpose:** Decide which factories require inspection and how the planning activity begins.

### Business events
1. Choose Bulk, Single or Immediate planning
2. Build AND/OR criteria or locate a specific factory
3. Review eligibility, risk context and Factory 360 summary
4. Select the exact target set

### Outputs
- Planning method
- Validated criteria
- Selected factory set
- Immediate-visit minimum data

### State intent
`Initiated -> Criteria Built -> Targets Retrieved -> Targets Selected`

### Engines
- ENG-04
- ENG-06
- ENG-12

### Failure controls
- No matching factory
- Duplicate or ineligible target
- Unregistered immediate factory requires controlled minimum capture

## P02 - Visit Design & Assignment
**Owner:** Planner  
**Channel:** Web Portal  
**Source modules:** M01  
**Purpose:** Convert selected targets into executable visits with the correct scope and resources.

### Business events
1. Select business visit type and inspection package
2. Set visit window, priority, mode eligibility and notes
3. Assign inspector automatically or manually
4. Validate availability, capacity, location and conflicts

### Outputs
- Configured visit plan
- Individual Visit IDs
- Inspector/team assignment
- Conflict/override record

### State intent
`Targets Selected -> Configured -> Assigned -> Ready to Publish`

### Engines
- ENG-02
- ENG-03
- ENG-05
- ENG-06
- ENG-11
- ENG-12

### Failure controls
- Missing package
- No eligible inspector
- Scheduling or workload conflict
- Invalid location

## P03 - Publish & Operational Management
**Owner:** Planner / Operations  
**Channel:** Web Portal  
**Source modules:** M01/M02/M08  
**Purpose:** Activate the plan, notify participants and keep visits operationally governable.

### Business events
1. Review plan completeness and publish
2. Create plan and visit records with stable IDs
3. Notify assigned inspectors and stakeholders
4. Search, edit allowed fields, reschedule, reassign, cancel, return/republish or expire

### Outputs
- Published Visit Plan
- Active Visits
- Notification and audit events
- Managed operational lifecycle

### State intent
`Ready to Publish -> Published -> Active / Returned / Cancelled / Expired`

### Engines
- ENG-03
- ENG-05
- ENG-11
- ENG-12

### Failure controls
- Partial publish prohibited
- Cancellation requires reason
- Automatic expiry must be rule-driven
- Bulk action reports per-row failures

## P04 - Inspector Startup Pack
**Owner:** Inspector  
**Channel:** iPad  
**Source modules:** M03  
**Purpose:** Ensure the inspector has everything needed before travel or virtual execution.

### Business events
1. Review assignment, agenda, factory and visit card
2. Resolve exact package version and download encrypted offline content
3. Review Factory 360, prior findings, contacts, map and documents
4. Validate device, battery, storage, network, GPS and execution eligibility

### Outputs
- Validated startup pack
- Offline-ready package
- Readiness result
- Return-assignment record if unable to proceed

### State intent
`Assigned -> Preparing -> Ready / Returned`

### Engines
- ENG-02
- ENG-06
- ENG-10
- ENG-11
- ENG-12

### Failure controls
- Package unavailable or invalid
- Insufficient device readiness
- Wrong execution mode
- Assignment returned with reason

## P05 - Execution Mode Gate
**Owner:** Inspector / System  
**Channel:** iPad / Virtual  
**Source modules:** M03/M04/M05  
**Purpose:** Route the visit into a valid physical or virtual execution path.

### Business events
1. Evaluate approved execution mode rules
2. Confirm physical or virtual prerequisites
3. Block invalid mode and explain reason
4. Create the correct journey or session context

### Outputs
- Physical Journey Session or Virtual Session
- Eligibility result
- Mode decision audit

### State intent
`Ready -> Physical Path / Virtual Path / Blocked`

### Engines
- ENG-03
- ENG-06
- ENG-10
- ENG-12

### Failure controls
- Mode not eligible
- Appointment not valid
- Mandatory prerequisites not met

## P06A - Physical Journey & Check-In
**Owner:** Inspector / Operations  
**Channel:** iPad + Operations  
**Source modules:** M04/M08  
**Purpose:** Prove the inspector travelled to the correct factory and started execution lawfully.

### Business events
1. Start journey and route guidance
2. Track ETA, distance, GPS accuracy and route deviation
3. Detect arrival and compare official vs observed location
4. Complete geofence check-in or governed override

### Outputs
- Journey Session
- Telemetry history
- Arrival and Check-In Event
- Exception/override record

### State intent
`Ready -> On Journey -> Arrived -> Checked-In -> Start Allowed`

### Engines
- ENG-03
- ENG-06
- ENG-10
- ENG-11
- ENG-12

### Failure controls
- Poor GPS accuracy
- Route deviation
- Factory unavailable or access denied
- Override requires permission, evidence and reason

## P06B - Virtual Session & Verification
**Owner:** Inspector / Factory Representative  
**Channel:** Virtual Session  
**Source modules:** M05  
**Purpose:** Create a governed remote inspection session with verified participants and traceable evidence.

### Business events
1. Open scheduled appointment and secure session
2. Record participant join and session timestamps
3. Perform identity and OTP verification where configured
4. Run device/network readiness and begin remote inspection

### Outputs
- Verified session
- Participant and OTP records
- Readiness result
- Remote inspection context

### State intent
`Scheduled -> Waiting -> Joined -> Verified -> In Progress`

### Engines
- ENG-03
- ENG-07
- ENG-11
- ENG-12

### Failure controls
- Identity/OTP failure
- Participant absent
- Poor connection or device failure
- Physical follow-up required when evidence is insufficient

## P07 - Inspection Execution
**Owner:** Inspector  
**Channel:** iPad / Virtual  
**Source modules:** M04/M05/M09  
**Purpose:** Execute the configured inspection package consistently in physical or virtual mode.

### Business events
1. Verify factory and representative context
2. Complete dynamic report and checklist sections
3. Apply required, optional and conditional rules
4. Autosave progress and expose mandatory blockers

### Outputs
- Inspection Session
- Report and checklist responses
- Progress and validation status
- Observation records

### State intent
`Start Allowed -> In Progress -> Ready for Validation`

### Engines
- ENG-01
- ENG-02
- ENG-03
- ENG-07
- ENG-10
- ENG-12

### Failure controls
- Mandatory response missing
- Package/configuration version mismatch
- Offline interruption and recovery
- Unable-to-execute exception

## P08 - Evidence, Findings, Violations & Actions
**Owner:** Inspector / System  
**Channel:** iPad / Virtual  
**Source modules:** M04/M05/M09  
**Purpose:** Turn observations into defensible, evidence-linked compliance outcomes.

### Business events
1. Capture photo, video, document, note or remote evidence
2. Link evidence to exact item, finding and location where applicable
3. Evaluate configured violation and penalty mapping
4. Create required corrective/action forms with owner and due date

### Outputs
- Evidence chain
- Findings and violation records
- Penalty context
- Action forms and blockers

### State intent
`Observation -> Evidence Linked -> Finding -> Violation/Action`

### Engines
- ENG-01
- ENG-02
- ENG-06
- ENG-07
- ENG-08
- ENG-12

### Failure controls
- Loose/unlinked evidence rejected
- Required evidence blocks completion
- Action form incomplete
- Violation mapping unresolved

## P09 - Submission & Immutable Version
**Owner:** Inspector / System  
**Channel:** iPad / Virtual  
**Source modules:** M04/M05  
**Purpose:** Finalize a complete inspection package without partial or ambiguous state.

### Business events
1. Run pre-submit validation
2. Capture acknowledgement/signature where approved
3. Create structured report and submission identity
4. Create immutable submitted version and route to review

### Outputs
- Submitted Inspection Version
- Evidence manifest
- Report/submission ID
- Review task and notification

### State intent
`Ready for Validation -> Validated -> Submitted -> Locked`

### Engines
- ENG-03
- ENG-07
- ENG-09
- ENG-10
- ENG-11
- ENG-12

### Failure controls
- Incomplete package remains unsubmitted
- Network retry must be idempotent
- No partial finalization
- Submitted version cannot be edited

## P10 - Level 2 Review & Decision
**Owner:** Level 2 Reviewer  
**Channel:** Web Portal  
**Source modules:** M06  
**Purpose:** Review the exact submitted version and make an auditable MVP1 decision.

### Business events
1. Open review queue and immutable submission
2. Review report, checklist, evidence, violations and actions
3. Record mandatory decision note
4. Approve, return or reject under allowed workflow

### Outputs
- Review Decision
- Reviewer comments
- Return scope or final outcome
- Notification and audit

### State intent
`Submitted -> Under Review -> Approved / Returned / Rejected`

### Engines
- ENG-03
- ENG-07
- ENG-09
- ENG-11
- ENG-12

### Failure controls
- Unauthorized decision blocked
- Decision note mandatory
- Submitted content remains read-only
- No formal objection/appeal in MVP1

## P11 - Return, Correction & Resubmission
**Owner:** Inspector / Reviewer  
**Channel:** iPad + Web  
**Source modules:** M06  
**Purpose:** Correct only the requested scope while preserving the original submitted record.

### Business events
1. Reviewer identifies exact returned sections and reason
2. System unlocks only those sections
3. Inspector corrects responses/evidence/actions
4. Resubmission creates Version N+1 and reviewer compares changes

### Outputs
- Returned Task
- Selective Edit Scope
- New Immutable Version
- Before/after comparison

### State intent
`Returned -> Correction In Progress -> Resubmitted -> Under Review`

### Engines
- ENG-03
- ENG-07
- ENG-09
- ENG-10
- ENG-11
- ENG-12

### Failure controls
- Non-returned section edit blocked
- Reviewer comments immutable
- Old version preserved
- Sync conflict resolved explicitly

## P12 - Factory 360 & Operations Update
**Owner:** System / Operations / Leadership  
**Channel:** Web + Operations  
**Source modules:** M07/M08  
**Purpose:** Turn the completed lifecycle into trusted operational and historical visibility.

### Business events
1. Update factory history and inspection timeline
2. Link findings, violations, actions, reports and evidence
3. Update visit/inspector/SLA state in Operations Center
4. Expose role-appropriate KPIs, alerts, workload and exceptions

### Outputs
- Updated Factory 360
- Operations visibility
- Traceable KPI inputs
- Closed or continuing action timeline

### State intent
`Reviewed Outcome -> Historical/Operational Update`

### Engines
- ENG-04
- ENG-06
- ENG-07
- ENG-09
- ENG-11
- ENG-12

### Failure controls
- Partial widget failure isolated
- Stale data not shown as live
- KPI must trace to records
- Advanced national strategic dashboards remain MVP2
