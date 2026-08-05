# USR — BRD - إدارة المستخدمين (User Management)
Source: /Users/vikramindla/Desktop/BRD Notion/BRD - إدارة المستخدمين -MIM-V0.1.docx
Total: 3 use cases, 95 business rules. Full file read (lines 1-1451).

| ID | Type | Title (English) | Statement (English) | Source section/heading | Arabic excerpt |
|---|---|---|---|---|---|
| USR-BR-001 | BusinessRule | Excel export for all matrices | Every matrix/grid available in the system must support export to Excel. | 4.2 Assumptions #1 | "جميع المصفوفات المتوفرة في النظام تدعم خاصية تصدير الى الاكسل" |
| USR-BR-002 | BusinessRule | Mandatory field marker and error | Mandatory fields marked (*); empty → error "عفوا يرجى تعبئة الحقول الإجبارية". | 4.2 Assumptions #2 | same |
| USR-BR-003 | BusinessRule | Browser compatibility | Must work across Edge, Firefox, Chrome, Safari. | 4.1.5 NF001 | same |
| USR-BR-004 | BusinessRule | Bilingual support | Must support Arabic and English. | 4.1.5 NF002 | same |
| USR-BR-005 | BusinessRule | Response time standard | Must not exceed ministry-approved standard. | 4.1.5 NF003 | same |
| USR-BR-006 | BusinessRule | Max attachment size | 5MB max per Alam standards; error if exceeded. | 4.1.5 NF004 | same |
| USR-BR-007 | BusinessRule | Permission matrix — create new request | Sys Admin(Technical) Permitted; Branch Manager Not permitted; "Approved" column unfilled (ambiguous). | 4.1.4 | "P / N" |
| USR-BR-008 | BusinessRule | Permission matrix — edit returned request | Sys Admin(Technical) Permitted; Branch Manager Not permitted. | 4.1.4 | "P / N" |
| USR-BR-009 | BusinessRule | RACI — System Administrator (Technical) | Responsible for managing all internal users, roles, permissions. | 3.2.4 | same |
| USR-BR-010 | BusinessRule | RACI — Branch Manager | Accountable for inspectors in own branch/department only. | 3.2.4 | same |
| USR-BR-011 | BusinessRule | RACI — System Administrator (Business) | Accountable for business-related admin pages. | 3.2.4 | same |
| USR-BR-012 | BusinessRule | RACI — Digital Transformation Agency | Service developer, Responsible-Accountable. | 3.2.4 | same |
| USR-UC-001 | UseCase | User Account Management | Admin creates/edits/views user accounts, links to roles/permissions. Login→User Mgmt→list→view/add/edit→validate→create/update. | 5.1 UC001 | same |
| USR-BR-013 | BusinessRule | AD verification / duplicate prevention for internal users | Internal user → verify against AD; prevent duplicate creation if exists in Sanayi, auto-retrieve instead. | UC001 BC001 | same |
| USR-BR-014 | BusinessRule | National ID length (UC001) | Exactly 10 digits. | UC001 BC002 | same |
| USR-BR-015 | BusinessRule | Mobile number format (UC001) | +966 prefix, starts with 5, 9 digits. | UC001 BC003 | same |
| USR-BR-016 | BusinessRule | Email notification toggle (UC001) | Yes → email sent; No → not sent. | UC001 BC004 | same |
| USR-BR-017 | BusinessRule | Email format (UC001) | Standard user@example.com format. | UC001 BC005 | same |
| USR-BR-018 | BusinessRule | Substitute/Manager dropdown population (UC001) | Lists must show all employee names. | UC001 BC006 | same |
| USR-BR-019 | BusinessRule | Auto-disable inactive accounts (UC001) | Auto-disable if no activity within 90 days of activation. | UC001 BC007 | same |
| USR-BR-020 | BusinessRule | Auto-update permissions on role change (UC001) | Editing user's role auto-updates permissions to match new role. | UC001 BC008 | same |
| USR-BR-021 | BusinessRule | Conflicting roles restriction (UC001) | No two conflicting roles per user, except Inspector+Branch Manager combo. | UC001 BC009 | same |
| USR-BR-022 | BusinessRule | Confirmation on create (UC001) | "Create User" click → confirmation MSG001. | UC001 BC010 | same |
| USR-BR-023 | BusinessRule | Success message on confirm (UC001) | Confirm → success MSG002 (text not defined in Messages table — ambiguous/missing). | UC001 BC011 | same |
| USR-BR-024 | BusinessRule | Mandatory field validation (UC001) | Empty mandatory fields → ERR001. | UC001 BC012/ERR001 | same |
| USR-BR-025 | BusinessRule | Login field mandatory & unique (UC001 forms) | Mandatory, unique system-wide. | 5.1.1 form | same |
| USR-BR-026 | BusinessRule | User ID Number conditional visibility (UC001 forms) | Mandatory, appears only if user type=External. | 5.1.1 form | same |
| USR-BR-027 | BusinessRule | First Name mandatory (UC001 forms) | Mandatory. | 5.1.1 form | same |
| USR-BR-028 | BusinessRule | Last Name mandatory (UC001 forms) | Mandatory. | 5.1.1 form | same |
| USR-BR-029 | BusinessRule | Mobile No mandatory (UC001 forms) | Mandatory. | 5.1.1 form | same |
| USR-BR-030 | BusinessRule | Email Notification mandatory Yes/No (UC001 forms) | Mandatory Yes/No. | 5.1.1 form | same |
| USR-BR-031 | BusinessRule | Email conditional mandatory (UC001 forms) | Mandatory only if Email Notification=Yes. | 5.1.1 form | same |
| USR-BR-032 | BusinessRule | Manager field optional single-select (UC001 forms) | Optional single-select dropdown. | 5.1.1 form | same |
| USR-BR-033 | BusinessRule | Substitute conditional visibility & mandatory (UC001 forms) | Mandatory, shown only if user type=Internal; Present/Absent. | 5.1.1 form | same |
| USR-BR-034 | BusinessRule | Substitute Name conditional visibility (UC001 forms) | Mandatory, shown only if Substitute=Absent. | 5.1.1 form | same |
| USR-BR-035 | BusinessRule | Enable/Disable mandatory values (UC001 forms) | Mandatory, Active/Inactive. | 5.1.1 form | same |
| USR-BR-036 | BusinessRule | User Role dropdown depends on user type (UC001 forms) | Mandatory single-select; options depend on user type (11 roles listed). | 5.1.1 form | same |
| USR-BR-037 | BusinessRule | Region mandatory & conditional (UC001 forms) | Mandatory multi-select; shown only for Sector Manager/Branch Manager/Field Inspector roles. | 5.1.1 form | same |
| USR-BR-038 | BusinessRule | City mandatory & conditional (UC001 forms) | Same conditions as Region. | 5.1.1 form | same |
| USR-BR-039 | BusinessRule | User Permissions derived from role (UC001 forms) | Read-only, shows permissions of selected role. | 5.1.1 form | same |
| USR-UC-002 | UseCase | Branch User Management | Branch Manager manages accounts of own branch. Login→User Mgmt→branch-scoped list→view/add(Field Inspector only)/edit→validate→create/update. | 5.2 UC002 | same |
| USR-BR-040 | BusinessRule | AD verification (UC002) | Verify against AD. | UC002 BC001 | same |
| USR-BR-041 | BusinessRule | Branch Manager restricted to Field Inspector creation | Cannot create any type other than Field Inspector. | UC002 BC002 | same |
| USR-BR-042 | BusinessRule | Branch-scoped view/edit for Branch Manager | Only own branch users. | UC002 BC003 | same |
| USR-BR-043 | BusinessRule | Mandatory branch link for new inspector | Every add-inspector op must link to their branch. | UC002 BC004 | same |
| USR-BR-044 | BusinessRule | National ID length (UC002) | Exactly 10 digits. | UC002 BC005 | same |
| USR-BR-045 | BusinessRule | Mobile number format (UC002) | +966, starts 5, 9 digits. | UC002 BC006 | same |
| USR-BR-046 | BusinessRule | Email notification toggle (UC002) | Yes→sent, No→not sent. | UC002 BC007 | same |
| USR-BR-047 | BusinessRule | Email format (UC002) | Standard format. | UC002 BC008 | same |
| USR-BR-048 | BusinessRule | Contract-employee email format (UC002) | Contract-based inspector → Con_user@example.com format. | UC002 BC009 | same |
| USR-BR-049 | BusinessRule | Auto-disable inactive accounts (UC002) | 90-day inactivity → auto-disable. | UC002 BC010 | same |
| USR-BR-050 | BusinessRule | Confirmation on create (UC002) | MSG001 on Create User click. | UC002 BC011 | same |
| USR-BR-051 | BusinessRule | Success message on confirm (UC002) | MSG002 "Success – user added successfully". | UC002 BC012 | same |
| USR-BR-052 | BusinessRule | Mandatory field validation (UC002) | ERR001 on empty mandatory fields. | UC002 BC013 | same |
| USR-BR-053 | BusinessRule | Login mandatory & unique / read-only in edit (UC002 forms) | Add: mandatory unique; Edit: read-only. | 5.2.1 forms | same |
| USR-BR-054 | BusinessRule | First Name mandatory (UC002 forms) | Mandatory. | 5.2.1 forms | same |
| USR-BR-055 | BusinessRule | Last Name mandatory (UC002 forms) | Mandatory. | 5.2.1 forms | same |
| USR-BR-056 | BusinessRule | Mobile No mandatory (UC002 forms) | Mandatory. | 5.2.1 forms | same |
| USR-BR-057 | BusinessRule | Email Notification mandatory (UC002 forms) | Mandatory Yes/No. | 5.2.1 forms | same |
| USR-BR-058 | BusinessRule | Email conditional mandatory (UC002 forms) | Mandatory if notification=Yes. | 5.2.1 forms | same |
| USR-BR-059 | BusinessRule | Manager field mandatory free text (UC002 forms) — ambiguity flagged | Mandatory free-text, UNLIKE UC001's optional dropdown — inconsistency indexed as-is. | 5.2.1 forms | same |
| USR-BR-060 | BusinessRule | Substitute mandatory dropdown (UC002 forms) | Mandatory, Present/Absent. | 5.2.1 forms | same |
| USR-BR-061 | BusinessRule | Substitute Name conditional (UC002 forms) | Mandatory if Substitute=Absent. | 5.2.1 forms | same |
| USR-BR-062 | BusinessRule | Enable/Disable mandatory (UC002 forms) | Mandatory Active/Inactive. | 5.2.1 forms | same |
| USR-BR-063 | BusinessRule | User Role fixed to Field Inspector (UC002 forms) | System-retrieved, fixed, not selectable. | 5.2.1 forms | same |
| USR-BR-064 | BusinessRule | Region auto-scoped to Branch Manager's region (UC002 forms) | System-retrieved, auto-set. | 5.2.1 forms | same |
| USR-BR-065 | BusinessRule | City retrieved based on Region (UC002 forms) | System-retrieved, filtered by region. | 5.2.1 forms | same |
| USR-BR-066 | BusinessRule | User Permissions derived from role (UC002 forms) | System-retrieved multi-select display. | 5.2.1 forms | same |
| USR-UC-003 | UseCase | Role–Permission Mapping | Admin views roles, updates permissions (add/remove) via transfer buttons, saves; applies to all linked users. | 5.3 UC003 | same |
| USR-BR-067 | BusinessRule | Role must have at least one permission | Minimum 1 permission per role. | UC003 BC001 | same |
| USR-BR-068 | BusinessRule | Multiple permissions per role allowed | Many permissions per role OK. | UC003 BC002 | same |
| USR-BR-069 | BusinessRule | Permission modifiability — CONTRADICTION | AR: permissions CAN be modified. EN: CANNOT be modified except by vendor. Direct contradiction, indexed as-is. | UC003 BC003 | AR vs EN mismatch |
| USR-BR-070 | BusinessRule | Confirmation on save changes | MSG01.01 (inconsistent ID format vs MSGxxx elsewhere). | UC003 BC004 | same |
| USR-BR-071 | BusinessRule | Mandatory field validation (UC003) | ERR001. | UC003 BC005 | same |
| USR-BR-072 | BusinessRule | Permission Management action per row | Mandatory button, per grid row. | 5.3.1 grid | same |
| USR-BR-073 | BusinessRule | System Permissions mandatory multi-select | Values from Appendix 1. | 5.3.1 detail | same |
| USR-BR-074 | BusinessRule | Related Permissions auto-populated | Read-only, shows role's linked permissions. | 5.3.1 detail | same |
| USR-BR-075 | BusinessRule | Move-permission transfer buttons mandatory | >>, >, <, << to move between lists. | 5.3.1 detail | same |
| USR-BR-076 | BusinessRule | Save Changes button mandatory | Persists edits. | 5.3.1 detail | same |
| USR-BR-077 | BusinessRule | Cancel button optional | Exit without saving. | 5.3.1 detail | same |
| USR-BR-078 | BusinessRule | Permission ownership — Manage Regulations and Laws | Owner: Sys Admin (Business). | 2.1.1 Appendix1 | same |
| USR-BR-079 | BusinessRule | Permission ownership — Manage Users/Roles (Sys Admin Technical) | Owner: Sys Admin (Technical). | 2.1.1 | same |
| USR-BR-080 | BusinessRule | Permission ownership — Manage Users/Roles (Branch Manager, own branch) | Also Branch Manager, own branch scope. | 2.1.1 | same |
| USR-BR-081 | BusinessRule | Permission ownership — Manage Dropdown Lists | Owner: Sys Admin (Technical). | 2.1.1 | same |
| USR-BR-082 | BusinessRule | Permission ownership — Manage Tasks | Sys Admin (Business) + Branch Manager (own branch). | 2.1.1 | same |
| USR-BR-083 | BusinessRule | Permission ownership — Manage Survey | Owner: Sys Admin (Business). | 2.1.1 | same |
| USR-BR-084 | BusinessRule | Permission ownership — Manage Risk Engine | Owner: Sys Admin (Business). | 2.1.1 | same |
| USR-BR-085 | BusinessRule | Permission ownership — Manage Notifications | Owner: Sys Admin (Technical). | 2.1.1 | same |
| USR-BR-086 | BusinessRule | Permission ownership — Manage SLA | Owner: Sys Admin (Technical). | 2.1.1 | same |
| USR-BR-087 | BusinessRule | Permission ownership — Manage Targets | Owner: Approver. | 2.1.1 | same |
| USR-BR-088 | BusinessRule | Permission ownership — Manage Visits | Sector Manager + Branch Manager. | 2.1.1 | same |
| USR-BR-089 | BusinessRule | Permission ownership — Inspection | Inspector + "المحاضر" role (ambiguous meaning). | 2.1.1 | same |
| USR-BR-090 | BusinessRule | Permission ownership — Execute/Create Visit | Inspector, Branch, Sector Manager, Approver. | 2.1.1 | same |
| USR-BR-091 | BusinessRule | Permission ownership — Establishment/Factory File | All roles. | 2.1.1 | same |
| USR-BR-092 | BusinessRule | Permission ownership — Reports (independent per report) | Reports/Indicators role; each report an independent permission (9 report types listed). | 2.1.1 | same |
| USR-BR-093 | BusinessRule | Permission ownership — Dashboards (independent per dashboard) | Reports/Indicators role; each dashboard independent permission. | 2.1.1 | same |
| USR-BR-094 | BusinessRule | Permission ownership — Work Activity Monitoring (scoped) | Branch Manager/Field Supervisor: own branch; Sector Manager: all their branches; Approver: all branches. | 2.1.1 | same |
| USR-BR-095 | BusinessRule | Permission ownership — All Requests | Owner: Approver. | 2.1.1 | same |
