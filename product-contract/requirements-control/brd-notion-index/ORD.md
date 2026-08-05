# ORD — BRD - إدارة الطلبات (Request/Order Management)
Source: /Users/vikramindla/Desktop/BRD Notion/BRD - إدارة الطلبات- MIM-V0.1.docx
Total: 2 use cases, 67 business rules. Full file read (lines 1-920).

| ID | Type | Title | Statement | Source section/heading | Arabic excerpt |
|---|---|---|---|---|---|
| ORD-BR-001 | BusinessRule | Multi-browser responsive design | System screens must be designed flexibly to work with common browsers (Edge, Firefox, Chrome, Safari) | 4.1.5 متطلبات النظام / NF001 | "تصميم النظام بشكل مرن ليتلاءم مع معظم المتصفحات الشائعة" |
| ORD-BR-002 | BusinessRule | Bilingual support | System must support both Arabic and English languages | 4.1.5 متطلبات النظام / NF002 | "يجب أن يدعم النظام اللغتين العربية والإنجليزية" |
| ORD-BR-003 | BusinessRule | High performance response time | System response time must not exceed the standard duration approved by the Ministry of Industry and Mineral Resources | 4.1.5 متطلبات النظام / NF003 | "يجب ألا تتجاوز استجابة النظام المدة الزمنية القياسية والمعتمدة لدى وزارة الصناعة والثروة المعدنية" |
| ORD-BR-004 | BusinessRule | Grids support Excel export | All matrices/grids available in the system support export to Excel | 5.1 الافتراضات / Item 1 | "جميع المصفوفات المتوفرة في النظام تدعم خاصية تصدير الى الاكسل" |
| ORD-BR-005 | BusinessRule | Mandatory field marking and error message | System must display (*) for any mandatory field; if a mandatory field is left empty, the system shows the error message "عفوا يرجى تعبئة الحقول الإجبارية" | 5.1 الافتراضات / Item 2 | "يجب أن يظهر النظام (*) لأي حقل إجباري وفي حال لم يتم تعبئة الحقل الإجباري تظهر رسالة خطأ" |
| ORD-BR-006 | BusinessRule | Permission matrix — Work Activity Monitoring | All five roles (Field Supervisor, Branch Manager, Sector Manager, Administrator, Committee) hold permission (P) for "Work Activity Monitoring" | 4.1.4 مصفوفة الصلاحيات | "متابعة نشاط العمل P P P P P" |
| ORD-BR-007 | BusinessRule | Permission matrix — Task Viewing | All five roles hold permission (P) for "Task Viewing" | 4.1.4 مصفوفة الصلاحيات | "استعراض المهام P P P P P" |
| ORD-BR-008 | BusinessRule | Field Supervisor RACI scope | Field Supervisor manages the tasks assigned to him | 3.2.3 تحليل أصحاب المصلحة | "المشرف الميداني — إدارة المهام المسندة إليه" |
| ORD-BR-009 | BusinessRule | Branch Manager RACI scope | Branch Manager manages requests and tasks belonging to his branch or department only | 3.2.3 تحليل أصحاب المصلحة | "مدير الفرع — إدارة الطلبات والمهام التابعين لفرعه أو قسمه فقط" |
| ORD-BR-010 | BusinessRule | Sector Manager RACI scope (ambiguous) | Stakeholder table lists "Sector Manager" with no role/responsibility text filled in — scope not specified in source | 3.2.3 تحليل أصحاب المصلحة | "مدير القطاع" (no description given) |
| ORD-BR-011 | BusinessRule | Administrator RACI scope | Administrator manages all requests and tasks in the system | 3.2.3 تحليل أصحاب المصلحة | "مسؤول — إدارة جميع الطلبات والمهام" |
| ORD-BR-012 | BusinessRule | Committee RACI scope | Committee manages the tasks assigned to it | 3.2.3 تحليل أصحاب المصلحة | "اللجنة — إدارة المهام المسندة إليه" |
| ORD-BR-013 | BusinessRule | Digital Transformation Agency role | Digital Transformation Agency acts as service developer, RACI Responsible-Accountable | 3.2.3 تحليل أصحاب المصلحة | "وكالة التحول الرقمي — مطور الخدمة" |
| ORD-BR-014 | BusinessRule | Request status: New | Request status "New" = on tasks page, not opened by any user | 4.1.3 الحالات / F020 | "الطلب في حال كونه في صفحة المهام ولم يتم فتح الطلب من اي مستخدم" |
| ORD-BR-015 | BusinessRule | Request status: In Progress | Status "In Progress" = user opened it, no decision made yet | 4.1.3 الحالات / F021 | "في حال ان المستخدم فتح الطلب ولم ينتهي من العمل عليه اي لم يتخذ قرار عليه" |
| ORD-UC-001 | UseCase | Work Activity Monitoring (متابعة نشاط العمل) | View work activities user is authorized to see, via login → select from menu → permission-scoped list → search/filter/details/attachments/export | 6.1 السيناريو الأول / UC001 | "تمكن هذه الخدمة المستخدم من الاطلاع على أنشطة العمل المختلفة" |
| ORD-BR-016 | BusinessRule | Start date before end date (Work Activity) | Start Date must be earlier than End Date (ERR001) | UC001 / ERR001 | "تاريخ البداية يجب أن يكون أصغر من تاريخ النهاية" |
| ORD-BR-017 | BusinessRule | Branch Manager scope — Work Activity | Branch Manager sees only activities of branches he supervises | UC001 / BC001 | "يتاح لمدير الفرع الاطلاع على أنشطة العمل التابعة للفروع التي يشرف عليها فقط" |
| ORD-BR-018 | BusinessRule | Administrator scope — Work Activity | Administrator sees all work activities | UC001 / BC002 | "يتاح للمسؤول الاطلاع على جميع أنشطة العمل في النظام" |
| ORD-BR-019 | BusinessRule | Read-only activity fields | All fields display-only, cannot be edited | UC001 / BC003 | "جميع الحقول... هي للعرض فقط ولا يمكن تعديلها" |
| ORD-BR-020 | BusinessRule | Activity list sort order | Descending by creation date, most recent first | UC001 / BC004 | "يتم ترتيب الأنشطة... بشكل تنازلي حسب تاريخ إنشاء النشاط" |
| ORD-BR-021 | BusinessRule | No-match filter alert — Work Activity | No matching activity → alert MSG001 | UC001 / BC005 | "عند إدخال المستخدم لخيارات تصفية لا تنطبق على أي نشاط عمل" |
| ORD-BR-022 | BusinessRule | Invalid date range not allowed — Work Activity | Start Date > End Date not allowed → ERR001 | UC001 / BC006 | "لا يسمح بإدخال نطاق تواريخ غير صحيح" |
| ORD-BR-023 | BusinessRule | Total Duration calculation rule | Calculated only within 7:30 AM-4:30 PM working hours; weekends/holidays excluded | UC001 / BC007 | "الوقت التجميعي يُحتسب فقط ضمن ساعات العمل الرسمية (7:30 ص – 4:30 م)" |
| ORD-BR-024 | BusinessRule | Empty End Date meaning | Empty End Date = step still in progress | UC001 / BC008 | "تاريخ الانتهاء إذا كان فارغ فإنه يدل على أن الخطوة مازالت جارية" |
| ORD-BR-025 | BusinessRule | No-match alert message text — Work Activity | "No activities match the selected search criteria" | UC001 / MSG001 | "تنبيه، لا توجد أنشطة مطابقة لمعايير البحث" |
| ORD-BR-026 | BusinessRule | Request Status filter (Work Activity) | Multi-select, optional: New/Under Processing/Approved/Rejected | UC001 forms | "حالة الطلب — قائمة منسدلة باختيار متعدد" |
| ORD-BR-027 | BusinessRule | Request Type filter (Work Activity) | Multi-select, optional, 13 request-type options | UC001 forms | "نوع الطلب — قائمة منسدلة باختيار متعدد" |
| ORD-BR-028 | BusinessRule | Date From validation (Work Activity) | Date From must be earlier than Date To | UC001 forms | "يجب ان يكون التاريخ أصغر من تاريخ الى" |
| ORD-BR-029 | BusinessRule | Date To validation (Work Activity) | Date To must be later than Date From | UC001 forms | "يجب ان يكون التاريخ أكبر من تاريخ من" |
| ORD-BR-030 | BusinessRule | Region filter visibility (Work Activity) | Region filter appears only for Administrator role | UC001 forms | "يظهر خيار التصفية إذا كان المستخدم (مسؤول) فقط" |
| ORD-BR-031 | BusinessRule | City filter dependency & visibility (Work Activity) | City options depend on Region; filter shown only for Administrator | UC001 forms | "الخيارات تظهر بناءا على اسم المنطقة" |
| ORD-BR-032 | BusinessRule | Search button behavior (Work Activity) | Executes search per applied filters | UC001 forms | "بحث — زر — تشغيل البحث حسب التصفية" |
| ORD-BR-033 | BusinessRule | Conditional Establishment Name column (Work Activity) | Shown only for Inspection Services/Correction/Objection/Self-Assessment request types | UC001 forms | "يظهر هذا العمود إذا كان نوع الطلب فقط كالآتي" |
| ORD-BR-034 | BusinessRule | Grid Total Duration definition (Work Activity) | Time between start/end computed within 7:30 AM-4:30 PM | UC001 forms | "الوقت بين البداية والنهاية بين 7:30 ص و 4:30 م" |
| ORD-BR-035 | BusinessRule | View Details button (Work Activity) | Appears per row, shows path/activity details | UC001 forms | "يظهر على مستوى كل سطر" |
| ORD-BR-036 | BusinessRule | Export to Excel enablement (Work Activity) | Available once data retrieved | UC001 forms | "يصبح متاح عند استرجاع البيانات" |
| ORD-BR-037 | BusinessRule | Per-step Total Duration in details (Work Activity) | Calculated separately per step in details panel | UC001 forms | "يتم الاحتساب لكل خطوة على حدا" |
| ORD-BR-038 | BusinessRule | Attachments visibility (Work Activity) | Shown only when attachments exist | UC001 forms | "يظهر فقط عند وجود مرفقات" |
| ORD-UC-002 | UseCase | Task Viewing (استعراض المهام) | View tasks per permission: personal or all-under-administration; My Tasks (all users) / All Tasks (Branch Manager/Administrator only) | 6.1.1 / UC002 | "تمكّن هذه الخدمة المستخدم من استعراض المهام في النظام حسب الصلاحية" |
| ORD-BR-039 | BusinessRule | Start date before end date (Task Viewing) | Start Date must be earlier than End Date (ERR001) | UC002 / ERR001 | "تاريخ البداية يجب أن يكون أصغر من تاريخ النهاية" |
| ORD-BR-040 | BusinessRule | Invalid date range not allowed — Task Viewing | Start Date > End Date not allowed → ERR001 | UC002 / BC001 | "لا يسمح بإدخال نطاق تواريخ غير صحيح" |
| ORD-BR-041 | BusinessRule | Sector/Branch Manager task scope | In All Tasks, Sector/Branch Manager see only branches/field supervisors they supervise | UC002 / BC002 | "يتاح لمدير القطاع و لمدير الفرع الاطلاع على المهام الخاصة بالفروع والمشرفين الميدانيين الذين يشرف عليهم فقط" |
| ORD-BR-042 | BusinessRule | Administrator task scope (discrepancy noted) | AR text: sees tasks of all region/sector/branch managers + field supervisors. EN mirror: only "all Branch Managers and Field Supervisors they oversee" — languages disagree, indexed as written | UC002 / BC003 | AR vs EN mismatch, see full doc |
| ORD-BR-043 | BusinessRule | Task list sort order | Descending by creation date, latest first | UC002 / BC004 | "يتم ترتيب المهام... تنازلي حسب تاريخ الإنشاء" |
| ORD-BR-044 | BusinessRule | Read-only tasks | All task data display-only; no modify/delete | UC002 / BC005 | "جميع البيانات للعرض فقط، ولا يمكن للمستخدم تعديل أو حذف أي مهمة" |
| ORD-BR-045 | BusinessRule | Ad hoc temporary assignment permission | System Manager may grant temp assignment enabling Field Supervisor to execute tasks not originally assigned, for exceptional cases | UC002 / BC006 | "يُتيح النظام لمدير النظام صلاحية إنشاء إسناد مؤقت" |
| ORD-BR-046 | BusinessRule | Ad hoc permission duration | Granted for a defined period set by System Manager | UC002 / BC006 | "تُمنح هذه الصلاحية لفترة محددة يُحددها مدير النظام" |
| ORD-BR-047 | BusinessRule | Ad hoc execution does not transfer ownership | Executing via Ad hoc does not transfer original ownership or modify base assignment | UC002 / BC006 | "دون نقل الملكية الأصلية للمهمة أو تعديل بيانات الإسناد الأساسية" |
| ORD-BR-048 | BusinessRule | Ad hoc Log auto-documentation | System auto-logs: original assignee, actual executor, assignment type, date/time | UC002 / BC006 | "يقوم النظام تلقائيًا بتوثيق العملية في سجل التعديلات (Ad hoc Log)" |
| ORD-BR-049 | BusinessRule | No-match filter alert — Task Viewing | No matching task → alert MSG001 | UC002 / BC007 | "عند إدخال المستخدم لخيارات تصفية لا تنطبق على أي نشاط عمل" |
| ORD-BR-050 | BusinessRule | Inspector daily establishment selection & Branch Manager visibility | Inspector selects establishments to visit daily; Branch Manager can view/monitor these | UC002 / BC008 | "يتيح النظام للمفتش تحديد المنشآت المراد زيارتها على أساس يومي" |
| ORD-BR-051 | BusinessRule | No-match alert message text — Task Viewing | "No activities match the selected search criteria" | UC002 / MSG001 | "تنبيه، لا توجد أنشطة مطابقة لمعايير البحث" |
| ORD-BR-052 | BusinessRule | View Type field — mandatory | Single-select, MANDATORY: My Tasks / All Tasks | UC002 forms | "نوع العرض — إجباري — مهامي / جميع المهام" |
| ORD-BR-053 | BusinessRule | "My Tasks" option visibility | Shows own tasks; visible to all service users | UC002 main flow | "مهامي: عرض المهام الخاصة بالمستخدم نفسه (تظهر لجميع مستخدميّ الخدمة)" |
| ORD-BR-054 | BusinessRule | "All Tasks" option visibility restriction | Shows subordinate tasks; visible only to Branch Manager and Administrator | UC002 main flow | "جميع المهام... تظهر فقط لمدير الفرع والمسؤول" |
| ORD-BR-055 | BusinessRule | Request Status filter (Task Viewing) | Single-select, optional: New/Under Study | UC002 forms | "حالة الطلب — قائمة منسدلة باختيار واحد — اختياري" |
| ORD-BR-056 | BusinessRule | Request Type filter (Task Viewing) — discrepancy | Single-select, optional, 11 types; omits "User Modification" and "Task Modification" present in UC001's list — unresolved discrepancy, indexed as written | UC002 forms | "نوع الطلب — قائمة منسدلة باختيار واحد" |
| ORD-BR-057 | BusinessRule | Region Name filter scoping (Task Viewing) | Single-select, optional; Administrator sees all regions, others see only their defined regions | UC002 forms | "في حال ان المستخدم (مسؤول) يظهر كل المناطق" |
| ORD-BR-058 | BusinessRule | City Name filter scoping (Task Viewing) | Multi-select, optional, depends on Region; Sector/Branch Manager/Field Supervisor see only their own region's cities | UC002 forms | "إذا كان المستخدم (مدير قطاع/ مدير فرع /مشرف ميداني) يتم إظهار المدن الخاصة بمنطقته فقط" |
| ORD-BR-059 | BusinessRule | Date From validation (Task Viewing) | Date From must be earlier than Date To | UC002 forms | "يجب أن يكون التاريخ أصغر من تاريخ الى" |
| ORD-BR-060 | BusinessRule | Date To validation (Task Viewing) | Date To must be later than Date From | UC002 forms | "يجب أن يكون التاريخ أكبر من تاريخ من" |
| ORD-BR-061 | BusinessRule | Conditional Establishment Name column (Task Viewing) | Shown only for Inspection Services/Correction/Objection/Self-Assessment request types | UC002 forms | "يظهر هذا العمود إذا كان نوع الطلب فقط كالآتي" |
| ORD-BR-062 | BusinessRule | Visit Expected checkbox visibility | Column appears only for Inspector or Branch Manager | UC002 forms | "يظهر هذا العمود في حال ان المستخدم مفتش او مدير فرع" |
| ORD-BR-063 | BusinessRule | Request Created Date meaning | Reflects date task was created in system | UC002 forms | "تاريخ إنشاء المهمة في النظام" |
| ORD-BR-064 | BusinessRule | View Details button (Task Viewing) | Appears per row | UC002 forms | "يظهر على مستوى كل سطر" |
| ORD-BR-065 | BusinessRule | Export to Excel enablement (Task Viewing) | Available once data retrieved | UC002 forms | "يصبح متاح عند استرجاع البيانات" |
| ORD-BR-066 | BusinessRule | Attachments visibility (Task Viewing) | Shown per row only if they exist | UC002 forms | "إن وجدت — يظهر على مستوى كل سطر" |
| ORD-BR-067 | BusinessRule | Dynamic task details by request type | Detail fields shown vary by Request Type | UC002 / تفاصيل المهمة | "يتم عرض بيانات الطلب حسب نوع الطلب" |
