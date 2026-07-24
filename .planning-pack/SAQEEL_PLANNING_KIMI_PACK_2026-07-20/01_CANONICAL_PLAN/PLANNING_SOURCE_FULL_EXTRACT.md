# Planning.docx — Complete Ordered Markdown Extract

This file is a machine-readable companion to the original Word document. It preserves every non-empty paragraph and every table row in document order. The original `Planning.docx` remains the visual source authority.

The Planning Module allows authorized users to create inspection visits for:

One specific factory through Single Planning.

Multiple factories through Bulk Planning.

The Planner defines the allowed Visit Window, while the Inspector defines the exact Execution Date during the preparation stage.

The Planner may optionally select one or more Report Packages. If no Report Package is selected during planning, the Inspector must select the required package before execution.

Planning Entry Points

Users may access Planning from the following entry points:


| Entry Point | Behavior |

| --- | --- |

| Main Navigation → Operations → Planning | Opens the Planning Visit List. |

| Planning List → Create Visit | Opens the Create Visit journey. |

| Factory 360 → Create Visit | Opens Single Planning with the selected factory prefilled. |

| Factory Map or Factory Quick Card → Create Visit | Opens Single Planning with available factory information prefilled. |

| Returned Visit Notification | Opens the returned visit details and return comments. |

| Draft Visit Notification or Shortcut | Opens the existing draft for continuation. |

| Visit Details → Duplicate Visit | Creates a new draft using eligible information from the selected visit. |



Access to create or update visits must be controlled through role-based permissions.

The Planning List is the main landing page for the Planning Module.

It allows authorized users to view and manage all planning records, including:

Draft

Published

Returned

Cancelled

Expired

The list must include visits created through both Single and Bulk Planning.

Planning List Tabs


| Tab | Description |

| --- | --- |

| All | Displays all visits the user is authorized to view. |

| Draft | Displays visits that have not yet been published. |

| Published | Displays visits successfully sent to inspectors. |

| Returned | Displays visits returned to the Planner for correction or reassignment. |

| Cancelled | Displays visits cancelled before inspection execution. |

| Expired | Displays visits whose Visit Window ended before execution was properly started or completed, according to the configured expiry rule. |



Planning List Columns

General Search

The Planning List must support search by:

Visit Reference

CR Number

CR Name

License Number

Plant Number

Factory Name

Assigned Inspector

Created By


| Filter | Type | Expected Values |

| --- | --- | --- |

| Planning Type | Multi-select | Single, Bulk |

| Visit Status | Multi-select | Draft, Published, Returned, Cancelled, Expired |

| Visit Type | Multi-select lookup | Active Visit Type values |

| Region | Multi-select lookup | Active Saudi regions |

| City | Multi-select dependent lookup | Cities related to selected regions |

| Assigned Inspector | Searchable multi-select | Active inspectors |

| Visit Window Start | Date | From date |

| Visit Window End | Date | To date |

| Created Date | Date range | Creation period |

| Created By | Searchable user list | Authorized users |

| Report Package | Multi-select lookup | Active report packages |

| Priority | Multi-select | Configured priority values |

| Return Status | Single select | Returned before / Never returned |

| Bulk Plan Reference | Text search | Originating Bulk Plan Reference |



Users must be able to reset all filters.

The system should preserve filters during the user’s current session when opening and returning from Visit Details.

Page-Level Actions


| Record-Level Actions |  |  |

| --- | --- | --- |

|  |  |  |

|  |  |  |

| Main Planning Statuses Draft ↓ Published ↓ Returned / Cancelled / Expired A Returned visit may be corrected and republished: Returned ↓ Draft or Returned – Under Update ↓ Published Status Definitions Journey Steps Create Visit ↓ Select Planning Type ├── Single └── Bulk ↓ Search or Identify Factory / Factories ↓ Review Retrieved Factory Information ↓ Confirm or Add Map Location ↓ Define Visit Details ↓ Assign Inspector ↓ Define Visit Window ↓ Select Optional Report Package ↓ Add Attachments and Notes ↓ Save Draft or Publish The system may present the journey as steps, sections, or one expandable form, provided that all validations and dependencies are maintained. Common Visit Fields The following fields apply to both Single and Bulk Planning unless specified otherwise. |  |  |



Single Planning Search Methods


| Search Method | Expected Input |

| --- | --- |

| CR Number | Valid CR number |

| License Number | Valid industrial license number |

| Plant Number | Valid plant identifier |



Registered Factory Result

When a match is found, the system must retrieve and display available information.


| Field | Source | Editable | Expected Value / Explanation |

| --- | --- | --- | --- |

| CR Number | Senaei | No | Registered Commercial Registration number. |

| CR Name | Senaei | No | Registered commercial name. |

| License Number | Senaei | No | Industrial License number associated with the selected factory. |

| Plant Number | Senaei | No | Plant identifier. |

| License Stage | Senaei | No | Foundation, Establish, Production, or configured stage. |

| License Status | Senaei | No | Current license status. |

| Factory Name | Senaei | No, except observation | Registered factory or establishment name. |

| Contact Name | Senaei | According to rule / edited | Available factory contact. |

| Contact Mobile | Senaei | According to rule / edited | Available factory contact number. |

| Contact Email | Senaei | According to rule / edited | Available factory email address. |

| Region | Senaei / location record | Controlled edit | Registered region. |

| City | Senaei / location record | Controlled edit | Registered city. |

| Coordinates | Senaei / license | Controlled edit | Latitude and longitude, when available. |

| Location Source | System | No | License, Planner, Inspector, or other configured source. |

| Land Provider | Senaei | No | Land provider, when available. |

| Sector | Senaei | No | Factory sector. |

| Activities | Senaei | No | Registered industrial activities. |

| Products | Senaei | No | Registered products. |

| Employee Count | Senaei | No | Current available employee count. |



Multiple Licenses Under One CR

When searching by CR Number and multiple licenses are found:

Display the CR information.

Display all related licenses and plants.

Require the Planner to select the target license or plant.

Display the selected factory details.

Create the visit at the license or plant level.

A visit must not be created only at the CR level when a factory-level license or plant is required.

Unregistered Factory or Factory Not Found

Manual Creation Eligibility

If the searched factory is not found in Senaei, the system must allow manual information entry only when:

The user has the required permission.

The applicable Visit Type permits inspections of unregistered factories.

The user confirms that the factory was not found.

The system records that the factory information was manually entered.

Manual Factory Fields


| Field | Type | Required | Expected Value | Explanation |

| --- | --- | --- | --- | --- |

| CR Number | Text | Conditional | Valid CR number if available | May be unavailable for certain inspection scenarios. |

| CR Name / Establishment Name | Text | Yes | Legal or known establishment name | Used as the primary display name. |

| License Number | Text | No | License number if known | Manually entered and marked as unverified. |

| Plant Number | Text | No | Plant identifier if known | Manually entered and marked as unverified. |

| Contact Name | Text | No | Contact person | Factory contact information. |

| Contact Mobile | Text | Conditional | Valid Saudi or configured mobile format | Required when factory notification is enabled. |

| Contact Email | Email | No | Valid email address | Optional factory contact. |

| Region | Dropdown | Yes | Active region | Required location classification. |

| City | Dependent dropdown | Yes | City under selected region | Required location classification. |

| Address Description | Text area | No | Free text | Additional directions or address information. |

| Map Location | Map pin | Yes | Latitude and longitude | Added manually by Planner. |

| Location Source | System generated | System | Planner | Records that coordinates were provided by the Planner. |

| Manual Entry Reason | Dropdown / text | Yes | Not registered, external complaint, field discovery, or configured reason | Explains why a non-master factory was used. |

| Supporting Attachment | File | Configurable | Evidence of factory identity or request | May be required based on Visit Type. |



Bulk Planning

Bulk Planning allows the Planner to identify and select multiple factories using configurable search conditions.

Bulk Planning must retrieve factories from Senaei or the approved factory master source.

Manual unregistered factory entry is not supported within Bulk Planning.

Bulk Search Criteria


| Search Criterion | Type | Expected Value | Explanation |

| --- | --- | --- | --- |

| Region | Multi-select | One or more regions | Returns factories registered in selected regions. |

| City | Multi-select | One or more cities | Dependent on selected regions where applicable. |

| Sector | Multi-select | Active sectors | Filters factories by industrial sector. |

| License Stage | Multi-select | Foundation / Establish / Production | Filters by current license stage. |

| Activity | Multi-select | Active industrial activities | Filters factories with selected activities. |

| Product | Searchable multi-select | Registered products or HS-related product master | Filters factories producing selected products. |

| Land Provider | Multi-select | MODON, RCJY, private, or configured values | Filters by available land provider information. |

| Employee Count | Range | Minimum and maximum | Filters factories based on available employee count. |

| License Status | Multi-select | Active, Expired, Suspended, etc. | Filters using configured eligible statuses. |

| Risk Level | Multi-select | Low, Medium, High, Critical | Available when Risk Engine data exists. |

| Previous Violation Count | Range | Minimum and maximum | Optional risk-based filter. |

| Previous Inspection Outcome | Multi-select | Compliant, Non-Compliant, etc. | Optional historical inspection filter. |

| Last Inspection Date | Date range | From and to | Optional historical inspection filter. |

| Issuing Authority | Multi-select | Configured authority values | Optional regulatory or operational filter. |



Bulk search must not require all filters.

The Planner must provide at least one valid criterion unless the user has a specific permission allowing unrestricted factory retrieval.

AND / OR Logic

The Planner must be able to define how search conditions are combined.

AND Example

Region = Riyadh

AND

Sector = Food

AND

Employee Count > 100

The result includes factories satisfying all conditions.

OR Example

Region = Riyadh

OR

Region = Eastern Province

OR

Risk Level = Critical

The result includes factories satisfying at least one condition.

Condition Builder

The interface should support condition rows containing:


| Component | Description |

| --- | --- |

| Field | Selected search criterion |

| Operator | Equals, contains, greater than, less than, between, in, depending on field type |

| Value | Selected or entered value |

| Connector | AND / OR |

| Remove | Removes the condition |

| Add Condition | Adds another search condition |

| Add Group | Optional grouping for advanced conditions |



Where grouped conditions are supported, the system must process parentheses correctly.

Example:

Region = Riyadh

AND

(

Sector = Food

OR

Sector = Chemical

)

Bulk Selection Actions

The Planner must be able to:

Select one factory.

Select multiple factories.

Select all displayed results.

Select all matching results, subject to a configurable maximum.

Unselect selected factories.

View factory details.

Open Factory 360.

Remove an ineligible factory from the selection.

Review the final selected factory count.

Bulk Visit Creation

After confirming the selected factories:

The Planner defines common visit information.

The system validates each selected factory separately.

The system displays eligible and ineligible factories.

The Planner may proceed with eligible factories.

A separate visit record is created for each eligible factory.

All created visits retain the same Bulk Plan Reference.

Each visit receives its own Visit Reference.

Inspector assignment may be shared or distributed based on assignment logic.

One factory failing validation must not automatically block all other valid factories.

Before final creation, the system must show a summary of:

Total selected.

Eligible.

Ineligible.

Visits to be created.

Visits with missing location.

Visits with active conflicts.

Visits requiring manual Inspector override.

Factory Location and Map

The map must display the selected factory or selected factories.

The map must display the selected factory or selected factories.

For Single Planning:

Display the selected factory pin.

Allow location review.

Allow location addition when no coordinates exist.

Allow controlled location correction.

For Bulk Planning:

Display selected factory pins when coordinates exist.

Indicate factories with missing coordinates.

Allow the Planner to exclude factories with missing locations or provide a location through an approved process.

Location Source

Every factory location used in the inspection platform must include a source.


| Location Source | Meaning |

| --- | --- |

| License | Coordinates retrieved from the industrial license or Senaei master data. |

| Planner | Coordinates added or corrected by the Planner during planning. |

| Inspector | Coordinates captured or corrected by the Inspector during arrival or execution. |

| Integration | Coordinates retrieved from another approved integration. |

| Historical Inspection | Coordinates obtained from a previously approved inspection, if configured. |



The system must also store:

Original coordinates.

Current visit coordinates.

Source.

Added or modified by.

Added or modified date.

Location Editing Rules

If coordinates come from the License:

The Planner may correct them only with the required permission.

The original coordinates must remain unchanged in the audit history.

The planning visit uses the corrected visit coordinates.

Senaei master coordinates must not be automatically updated.

If coordinates were entered by the Planner:

The source must be Planner.

The Inspector may later confirm or correct the location.

Any Inspector correction must not overwrite the planning history.

If the Inspector updates coordinates:

The source for the new coordinates becomes Inspector.

The system must preserve the previous Planner or License coordinates.

The approved inspection may submit the updated location for a later data-quality process.

Inspector Assignment

An Inspector must be assigned before publishing.

The system must provide a recommended Inspector, but the Planner may manually override the recommendation.

The recommendation must prioritize configured criteria, including:

Inspector is active.

Inspector is assigned to or operates within the same Region.

Inspector has fewer currently assigned visits.

Inspector has availability within the Visit Window.

Inspector Recommendation Display


| Information | Explanation |

| --- | --- |

| Inspector Name | User display name |

| Region | Assigned or operational region |

| Assigned Visits | Current number of active assigned visits |

| Visits Within Selected Window | Workload overlapping the Visit Window |

| Availability | Available, Partially Available, Unavailable |

| Recommendation Reason | Example: Same region and lowest active workload |

| Warning | Schedule conflict, overload, missing skill, leave, etc. |



Manual Override

The Planner may assign another eligible Inspector.

If the selected Inspector has a warning but is not blocked:

Display the warning.

Require an override reason when configured.

Store the override in the audit log.

Bulk Assignment

For Bulk Planning, the Planner may:

Allow the system to distribute visits among recommended Inspectors.

Manually assign Inspectors per factory.

Reassign individual factories before publishing.

The system distribution should primarily consider:

Same Region.

Active workload.

Visit Window availability.

Visit Window

The Visit Window is the allowed date range in which the Inspector must define and execute the visit

The Planner does not define the exact Execution Date.

The Inspector selects the Execution Date during preparation.


| Field | Required | Expected Value |

| --- | --- | --- |

| Visit Window Start | Yes | Valid permitted start date |

| Visit Window End | Yes | Date equal to or later than start date |

| Window Notes | No | Additional scheduling constraints |



 The Inspector’s Execution Date must fall inside the Visit Window.

 The Inspector may change the Execution Date before execution, provided the new date remains inside the Visit Window.

 Changes outside the Visit Window require the visit to be returned to the Planner or formally extended by an authorized Planner.

 The Planner may update the Visit Window while the visit is Draft or Returned.

Visit Window End must not be earlier than Visit Window Start.

Draft Behavior

The Planner may save a partially completed visit.

Minimum information required to create a Draft:

Planning Type.

At least one factory search or selection attempt, when applicable.

The system may allow a completely initial Draft if auto-save is introduced, but such records must be clearly distinguished from completed Drafts.

Draft Rules

Draft does not notify the Inspector.

Draft does not reserve the Inspector’s workload unless configured.

Draft does not appear in the Inspector’s pool.

Draft may contain incomplete fields.

Draft may be edited or Canceled by authorized users.

Draft must retain all entered values.

Draft must show missing mandatory fields required for publishing.

Saving a Draft must generate a Visit Reference or Draft Reference.

Draft Rules

Draft does not notify the Inspector.

Draft does not reserve the Inspector’s workload unless configured.

Draft does not appear in the Inspector’s pool.

Draft may contain incomplete fields.

Draft may be edited or deleted by authorized users.

Draft must retain all entered values.

Draft must show missing mandatory fields required for publishing.

Saving a Draft must generate a Visit Reference or Draft Reference.

19. Publish Visit

19.1 Publish Preconditions

Before publishing, the system must validate:

Planning Type is selected.

At least one eligible factory is selected.

Required factory identity information exists.

Required location information exists according to Visit Type.

Visit Type is selected.

Visit Mode is selected.

Visit Window is valid.

Inspector is assigned.

Required attachments exist when configured.

No blocking duplicate visit exists.

No blocking active visit conflict exists.

Selected Report Packages are active and eligible, when provided.

User has publish permission.

Any required override reasons are entered.

Report Package is not mandatory for publishing.

Publish Result

Upon successful publishing:

Status becomes Published.

Operational state becomes New.

Visit becomes visible to the assigned Inspector.

Visit appears in the Inspector’s visit pool.

Inspector receives the configured notification.

Factory notification is sent only according to the configured process.

A package snapshot is stored when a Planner-selected Report Package exists.

Publish date and publisher are recorded.

Audit log entry is created.

Duplicate and Active Visit Validation

Before publishing, the system must check for possible duplicate visits using configurable criteria, such as:

Same License or Plant.

Same Visit Type.

Overlapping Visit Window.

Existing Draft or Published Visit.

Same regulatory campaign or reference.

Return Journey

A visit may be returned to Planning by an inspector , supervisor .

Return Reasons

Return Reason must be selected from an active lookup.

Examples:

Incorrect factory.

Incorrect Inspector assignment.

Inspector unavailable.

Visit Window not suitable.

Incorrect Visit Type.

Incorrect Visit Mode.

Missing information.

Missing or incorrect location.

Report Package requires Planner review.

Duplicate visit.

Factory closed or unavailable.

Other.

Return Behavior

When a visit is returned:

Planning status becomes Returned.

The visit is removed from the Inspector’s active schedule where applicable.

The visit appears in the Planner’s Returned tab.

The Planner receives a notification.

Return reason and comments are displayed prominently.

The Planner may edit the permitted fields.

The Planner may reassign the Inspector.

The Planner may update the Visit Window.

The Planner may update or add Report Packages.

The Planner may cancel the visit.

The Planner may republish after validation.

Return and resubmission history must be retained.

Cancellation Eligibility

An authorized user may cancel a visit before the configured cancellation cut-off.

Generally, cancellation is allowed while the visit is:

Draft

Published and New.

when execution has not started and permission allows.

Cancellation must be blocked after:

Start Journey

Arrival.

Inspection execution start.

Submission.

Cancellation Fields


| Field | Required | Expected Value |

| --- | --- | --- |

| Cancellation Reason | Yes | Active lookup value |

| Cancellation Comments | Conditional | Mandatory for Other or configured reasons |

| Cancelled By | System | User |

| Cancelled Date | System | Timestamp |

| Previous Inspector | System | Assigned Inspector at cancellation |

| Previous Visit Window | System | Window at cancellation |



Cancellation Behavior

Status becomes Cancelled.

Visit is removed from the Inspector’s active pool or schedule.

Inspector is notified.

Factory is notified only if factory notification had already been sent and cancellation communication is configured.

Cancelled visits remain visible in history.

Cancelled visits cannot be edited or republished.

A new visit may be created using Duplicate.

Expiry

Expiry Definition

A visit becomes Expired when the Visit Window End date passes and the visit has not progressed

Possible expiry criteria may include:

Inspector did not acknowledge.

Inspector did not define an Execution Date.

Execution did not start.

Visit was not completed.

Expiry Behavior

Status becomes Expired through a scheduled system process.

Inspector and Planner are notified.

Expiry reason is stored.

Expired visit is read-only.

Expired visit may be duplicated into a new Draft.

Expiry does not extend the Visit Window automatically.

An authorized user may extend the Visit Window before expiry.

Visit Details View

The Visit Details page must provide a complete read-only representation of the visit.

Display:

Visit Reference.

Status.

Operational State.

Planning Type.

Visit Type.

Priority.

Assigned Inspector.

Visit Window.

Execution Date, once selected by the Inspector.

Bulk Plan Reference, when applicable.

Details Sections


| Section | Content |

| --- | --- |

| Factory Information | CR, license, plant, factory name, stage, status, contact information |

| Location | Region, city, coordinates, map, source, change history |

| Visit Information | Visit Type, Visit Mode, priority, window, notes |

| Inspector Assignment | Assigned Inspector, recommendation details, override reason |

| Report Packages | Selected packages, selection source, selected by |

| Attachments | Files and metadata |

| Return Information | Return reasons, comments, return history |

| Cancellation Information | Reason and comments |

| Execution Information | Acknowledgment, Execution Date, journey and inspection timestamps |

| Audit Log | Full history |

| Related Visits | Duplicates, previous visits, active visits |

| Bulk Information | Bulk Plan Reference and related visit count |



Main Business Rules

 Only authorized users may create Planning visits.

 Planning Type must be either Single or Bulk.

 Single Planning supports search by CR Number, License Number, or Plant Number.

 A CR with multiple licenses requires selection of the target License or Plant.

 Manual factory entry is allowed only when the factory is not found and the user has permission.

 Bulk Planning only uses registered factory records.

 Bulk filters must support AND and OR logic.

 Bulk results must create separate visits per selected factory.

 One invalid Bulk factory must not block valid factories.

 Location source must always be captured.

 License coordinates must not be overwritten in Senaei by Planning.

 The Planner defines the Visit Window.

 The Inspector defines the Execution Date.

 Execution Date must fall within the Visit Window.

 An Inspector must be assigned before publishing.

 Inspector recommendation must prioritize same Region and lower assigned workload.

 Draft visits do not appear to Inspectors.

 Published visits appear in the Inspector’s visit pool.

 Returned visits must display return reason and comments.

 Returned visits may be corrected and republished.

 Cancellation is blocked after the configured execution cut-off.

 Expired visits are read-only and may be duplicated.

 Published, Cancelled, and Expired visits must not be physically deleted.

 All updates must be audited.

Acceptance Criteria

31.1 Planning List

The user can view Draft, Published, Returned, Cancelled, and Expired visits.

The user only sees records within their authorized scope.

Search and filters return correct records.

Available actions change based on status and permission.

Each Bulk-created visit appears as an individual record.

31.2 Single Planning

The user can search by CR, License, or Plant Number.

The system retrieves factory data from Senaei.

Multiple licenses under one CR require selection.

The user can manually enter an unregistered factory when authorized.

Manual information is clearly marked as manually entered.

The system records the location source.

31.3 Bulk Planning

The user can filter by Region, City, Sector, Stage, Activity, Product, Land Provider, and Employee Count.

The user can combine filters using AND or OR.

The system returns matching factories.

The user can select and unselect factories.

The system validates factories separately.

Valid visits can proceed when some factories fail.

Each created visit receives a unique Visit Reference.

31.4 Map and Location

Registered coordinates are displayed on the map.

Missing coordinates can be added by an authorized Planner.

Corrected coordinates preserve the original value.

Location Source is stored as License, Planner, Inspector, Integration, or configured source.

Planning changes do not directly update Senaei master data.

31.5 Assignment

The system recommends eligible Inspectors.

Recommendation considers same Region and lower workload.

The Planner can override the recommendation when permitted.

An Inspector is mandatory before publishing.

31.6 Visit Window

The Planner can define Visit Window Start and End.

The system validates the date range.

The Inspector later defines the Execution Date.

Execution Date outside the Visit Window is blocked.

Updating a published window is audited and notifies the Inspector.

31.8 Status and Workflow

Draft may be edited and deleted.

Published appears in the Inspector’s pool.

Returned appears in the Planner’s Returned list.

Returned visits can be corrected and republished.

Cancelled visits are read-only.

Expired visits are read-only.

All lifecycle changes are audited.

31.9 Notifications and Audit

The Inspector is notified when a visit is published.

The Planner is notified when a visit is returned.

Reassignment, cancellation, expiry, and window changes generate notifications.

Audit Log shows who changed what and when.

Historical values remain available after updates.

Dependencies


| Dependency | Usage |

| --- | --- |

| Senaei Integration | Retrieves CR, License, Plant, factory, contact, product, activity, stage, and location data. |

| Factory 360 | Displays complete factory context and provides a Create Visit entry point. |

| User and Role Management | Validates Planner and Inspector permissions. |

| Inspector Profile | Retrieves region, workload, and availability. |

| Maps | Displays and captures factory coordinates. |

| Lookup Management | Provides Visit Type, Visit Mode, priority, return reason, cancellation reason, region, city, and other values. |

| Compliance Configuration | Provides eligible Report Packages and inspection content. |

| Notification Engine | Sends Planning notifications. |

| Audit Service | Stores immutable action history. |

| Risk Engine | Provides factory risk data for Bulk Planning and recommendation context. |

| Visit Management | Stores visit records and lifecycle status. |

| Execution Module | Receives published visits and manages acknowledgment, preparation, and inspection. |

| Scheduler | Processes expiry and reminder notifications. |

| Document Management | Stores planning attachments. |




| Visit Status | Operational State | Meaning |

| --- | --- | --- |

| Published | New | Visit is available in the Inspector’s pool and no action has been completed yet. |

| Published | Ready for Execution | Inspector accepted the visit, selected the Execution Date, selected the required Inspection Report if needed, and completed all preparation requirements. |

| Published | On the Way | Inspector started the journey to the factory. |

| Published | Arrived | Inspector confirmed arrival at the factory. |

| Published | Executing Inspection | Inspector started the inspection. |

| Published | Submitted | Inspector submitted the inspection. |



Draft

│

├── Save Changes → Draft

│

├── Delete Draft

│

└── Publish

↓

Published

│

├── Inspector accepts and prepares the visit

│ Status remains Published

│

├── Return to Planner

│ ↓

│ Returned

│ │

│ ├── Correct and Republish → Published

│ └── Cancel → Cancelled

│

├── Cancel before execution → Cancelled

│

└── Visit Window expires → Expired


| Field | Required | Expected Value | Description |

| --- | --- | --- | --- |

| Inspection Package / report package | Optional during Planning | One or more active Inspection Packages | The Planner may assign one or more packages. If none are assigned, the Inspector must select the required package(s) during Preparation. |



Each package consists of:


| Component | Multiplicity |

| --- | --- |

| Inspection Form | One or many |

| Action Form | Zero, one, or many |



Food Manufacturing Package

Contains:

Inspection Forms

General Factory Inspection

Food Safety Inspection

Storage Inspection

Action Forms

Product Hold Form

Factory Closure Form

When the Inspector opens the visit, they automatically receive everything included in that package.
