# KPI — BRD - الموشرات والتقارير (Indicators & Reports)
Source: /Users/vikramindla/Desktop/BRD Notion/BRD - الموشرات والتقارير- MIM-V0.1.docx
Total: 19 use cases, 70 business rules. Full file read (lines 1-2808).

| ID | Type | Title (English) | Statement (English, plain business language) | Source section/heading | Arabic excerpt |
|---|---|---|---|---|---|
| KPI-UC-001 | UseCase | View Industrial Sector Leadership Performance Dashboard | Authorized users (General Directorate of Industrial Compliance, Deputy Agency, Planning & Follow-up Dept) can log in and view Leading & Outcome compliance indicators for the industrial sector to support ministry-level decisions on risk and compliance. | 5.1 / UC001 | "تمكن هذه الحالة المستخدمين من عرض المؤشرات القيادية" |
| KPI-UC-002 | UseCase | View Leadership Performance Dashboard (indicator screen) | Users select the Leadership Performance Dashboard from the main indicator menu to view KPI cards, charts and gauges. | 5.1.2 لوحة الاداء القيادي | "لوحة الاداء القيادي" |
| KPI-UC-003 | UseCase | View Operational Indicators Dashboard | Users select the Operational Indicators Dashboard to view day-to-day operational KPIs (visits, closures, appeals, samples, etc.). | 5.1.3 لوحة الموشرات التشغيلية | "لوحة الموشرات التشغيلية" |
| KPI-UC-004 | UseCase | View Data Quality & Analytical Support Dashboard | Users select this dashboard to view data-quality, inspector-performance and descriptive analytical indicators. | 5.1.4 | "لوحة مؤشرات جودة البيانات والدعم التحليلي" |
| KPI-UC-005 | UseCase | View External Entities Indicators Dashboard | Users select this dashboard to view compliance counts/percentages per external government entity with jurisdiction over factories. | 5.1.5 | "لوحة مؤشرات الجهات الخارجية" |
| KPI-UC-006 | UseCase | View and Manage Regulatory & Operational Reports | Authorized users browse a report catalogue, apply per-report dynamic filters, view results in a grid, export to Excel/PDF. | 5.2 / UC002 | "تمكّن هذه الحالة المستخدمين من عرض التقارير الرقابية والتشغيلية" |
| KPI-UC-007 | UseCase | View Detailed Inspection Report | All detailed data of approved inspection visits, multi-field filters, grid, export. | 5.2.1 تقرير التفتيش التفصيلي | "عرض جميع البيانات التفصيلية المتعلقة بالزيارات التفتيشية المعتمدة" |
| KPI-UC-008 | UseCase | View Violations Report | View/analyze all recorded industrial violations in chosen period, advanced filtering, grid, export. | 5.2.2 تقرير المخالفات | "عرض وتحليل جميع المخالفات الصناعية المسجّلة" |
| KPI-UC-009 | UseCase | View Inspector Performance Report | Inspector performance indicators for a selected period. | 5.2.3 تقرير أداء المفتشين | "مؤشرات أداء المفتشين خلال الفترة المحددة" |
| KPI-UC-010 | UseCase | View Complaints Report | Incoming complaints about industrial facilities, filterable by status/type/period. | 5.2.4 تقرير البلاغات | "البلاغات الواردة المتعلقة بالمنشآت الصناعية" |
| KPI-UC-011 | UseCase | View Targeting Report | Facilities/products/activities targeted for regulatory/operational purposes in a period. | 5.2.5 تقرير المستهدفات | "بيانات المنشآت أو المنتجات أو الأنشطة التي تم استهدافها" |
| KPI-UC-012 | UseCase | View Self-Assessment Report | Self-assessment results (accepted/rejected/not performed), by activity/region. | 5.2.6 تقرير التقييم الذاتي | "نتائج التقييمات الذاتية المقدمة من المنشآت" |
| KPI-UC-013 | UseCase | View Data Sharing Report | Data-sharing/exchange operations with related government systems/entities. | 5.2.7 تقرير مشاركة البيانات | "العمليات المتعلقة بمشاركة أو تبادل البيانات" |
| KPI-UC-014 | UseCase | View Facilities Report | Registered industrial facility data — sector status, geographic/operational distribution. | 5.2.8 تقرير المنشات | "بيانات المنشآت الصناعية المسجلة" |
| KPI-UC-015 | UseCase | View Survey Report — Overall | Aggregated external-user satisfaction survey results per question. | 5.2.9 (كلي) | "نتائج تقييمات المستخدم الخارجي للمشرفين الميدانين" |
| KPI-UC-016 | UseCase | View Survey Report — Detailed | Per-facility detailed survey responses per question with satisfaction breakdown. | 5.2.9 (تفصيلي) | "تقرير الاستبيان (تفصيلي)" |
| KPI-UC-017 | UseCase | Drill-down from indicator to facility list | Click any indicator/card/chart column → Drill-down grid of facility-level detail. | 5.1.x الإجراءات | "الضغط على اي موشر متاح لعرض Drill-down" |
| KPI-UC-018 | UseCase | Export dashboard/report list to Excel/PDF | Export displayed indicator/report list to Excel or PDF. | 5.1.2-5.1.5 / 5.2 | "تصدير القائمة (Excel/PDF)" |
| KPI-UC-019 | UseCase | Search and filter dashboard indicators | Apply filter criteria (date range, aggregation level, region, activity, department) then Search. | 5.1.1 خيارات التصفية | "تشغيل البحث حسب التصفية" |
| KPI-BR-001 | BusinessRule | Browser compatibility | Must work across Edge, Firefox, Chrome, Safari. | 4.1.5 / NF001 | "تصميم النظام بشكل مرن ليتلاءم مع معظم المتصفحات الشائعة" |
| KPI-BR-002 | BusinessRule | Bilingual support mandatory | Must support Arabic and English. | 4.1.5 / NF002 | "يجب أن يدعم النظام اللغتين العربية والإنجليزية" |
| KPI-BR-003 | BusinessRule | Performance/response-time standard | Response time must not exceed the ministry-approved standard. | 4.1.5 / NF003 | "يجب ألا تتجاوز استجابة النظام المدة الزمنية القياسية" |
| KPI-BR-004 | BusinessRule | All matrices exportable to Excel | All matrices/tables support export to Excel. | 4.2 #1 | "جميع المصفوفات المتوفرة في النظام تدعم خاصية تصدير الى الاكسل" |
| KPI-BR-005 | BusinessRule | Mandatory field marking and validation message | Mandatory fields marked (*); empty → error "عفوا يرجى تعبئة الحقول الإجبارية". | 4.2 #2 | "يجب أن يظهر النظام (*) لأي حقل إجباري" |
| KPI-BR-006 | BusinessRule | Visit data counted only after final approval | Visit data only enters indicator calc after final approval. | 5.1 BC001 | "بيانات الزيارة لا تدخل في الحساب إلا بعد الاعتماد النهائي" |
| KPI-BR-007 | BusinessRule | Daily indicator update with period filter | Indicators updated daily; filterable by date range. | 5.1 BC002 | "يتم تحديث المؤشرات يوميا، مع إمكانية التصفية بالفترة" |
| KPI-BR-008 | BusinessRule | Auto-fill date range from aggregation level | Selecting an aggregation level auto-fills From-To dates. | 5.1 BC003 | "يقوم النظام تلقائيًا بحساب الفترة الزمنية المناسبة" |
| KPI-BR-009 | BusinessRule | Manual date edit clears aggregation level | Manually editing dates clears the chosen aggregation level. | 5.1 BC004 | "في حال تعديل التاريخ يدويًا، يقوم النظام بإلغاء اختيار مستوى التجميع الزمني" |
| KPI-BR-010 | BusinessRule | Indicators calculated only on applicable items | Calculated only over applicable items per business logic. | 5.1 BC005 | "يتم احتساب الموشرات في البنود على البنود المنطبقة فقط" |
| KPI-BR-011 | BusinessRule | No-match alert message (dashboard) | No matches → MSG001 "لا توجد أنشطة مطابقة لمعايير البحث". | 5.1 MSG001 | same |
| KPI-BR-012 | BusinessRule | Date range validation error (dashboard) | Start date must precede end date, else MSG002. | 5.1 MSG002 | "خطأ، تاريخ البداية يجب أن يكون أصغر من تاريخ النهاية" |
| KPI-BR-013 | BusinessRule | Total Registered Facilities calculation | = count of facilities registered in Sanayi platform. | 5.1.2 | "عدد المنشات المسجلة في صناعي" |
| KPI-BR-014 | BusinessRule | Average Daily Inspections calculation | = visits in period ÷ actual working days. | 5.1.2 | "عدد الزيارات خلال الفترة ÷ عدد أيام العمل الفعلية" |
| KPI-BR-015 | BusinessRule | Inspections by Region drill behavior | Per-region count; clicking a region filters to that region. | 5.1.2 | "عند الضغط على اي منطقة يتم ارجاع بيانات المنطقة المختارة فقط" |
| KPI-BR-016 | BusinessRule | Heat Map indicator — no calculation defined | Map visualization, no formula specified (ambiguous). | 5.1.2 | "map / صورة" (no formula) |
| KPI-BR-017 | BusinessRule | Overall Compliance Rate calculation | = (facilities with no violations ÷ facilities visited) × 100. | 5.1.2 | "(عدد المنشآت بلا مخالفات ÷ عدد المنشآت المزارة) × 100" |
| KPI-BR-018 | BusinessRule | Compliance Trend calculation | = current period rate − previous period rate. | 5.1.2 | "المعدل الحالي – المعدل السابق" |
| KPI-BR-019 | BusinessRule | Sector Risk Average calculation | = Σ(risk scores) ÷ number of facilities. | 5.1.2 | "Σ درجات الخطورة لجميع المنشآت ÷ عدد المنشآت" |
| KPI-BR-020 | BusinessRule | SHE Compliance Index calculation and breakdown | = (compliant with all SHE ÷ total) × 100; breakdown by Env/OccHealth/Safety. | 5.1.2 | "(عدد المنشآت الملتزمة بكل اشتراطات SHE ÷ الإجمالي) × 100" |
| KPI-BR-021 | BusinessRule | Product Safety Compliance calculation | = (matching items in product-quality report ÷ total product-quality items) × 100. | 5.1.2 | same |
| KPI-BR-022 | BusinessRule | Incentives Usage Compliance calculation and breakdown | = (compliant beneficiaries ÷ total) × 100; breakdown Chemical Clearance/Customs Exemption. | 5.1.2 | same |
| KPI-BR-023 | BusinessRule | Licenses Compliance Rate calculation | = (valid/active licenses ÷ total licenses) × 100. | 5.1.2 | same |
| KPI-BR-024 | BusinessRule | Inspection Coverage Rate calculation | = (facilities visited ÷ existing facilities) × 100. | 5.1.2 | same |
| KPI-BR-025 | BusinessRule | Management Notes Compliance calculation | = (compliant with all admin-notes requirements ÷ total) × 100. | 5.1.2 | same |
| KPI-BR-026 | BusinessRule | ESG Compliance calculation | = (compliant with all ESG requirements ÷ total) × 100. | 5.1.2 | same |
| KPI-BR-027 | BusinessRule | Supervising Authorities indicator source | Derived from facility's spatial supervision assignment. | 5.1.2 | "يتم قراته من الاشراف المكاني للمصنع" |
| KPI-BR-028 | BusinessRule | Visited Facilities calculation and breakdown | Count since start of year; %; breakdown field/remote/self-assessment. | 5.1.3 | same |
| KPI-BR-029 | BusinessRule | Unvisited Facilities calculation | Count/% not visited since start of year. | 5.1.3 | same |
| KPI-BR-030 | BusinessRule | Self-Assessment status breakdown | Accepted / rejected / not-performed counts. | 5.1.3 | same |
| KPI-BR-031 | BusinessRule | Monthly Inspections calculation | Visits ÷ working days (duplicate formula of BR-014, possible doc ambiguity). | 5.1.3 | same |
| KPI-BR-032 | BusinessRule | Average Inspection Duration calculation | = visit end − visit start time. | 5.1.3 | same |
| KPI-BR-033 | BusinessRule | Average Violation Closure Time calculation | = avg(closure date − penalty issuance date). | 5.1.3 | same |
| KPI-BR-034 | BusinessRule | Violations Closed Within Deadline % calculation | = (closed before deadline ÷ total closed) × 100. | 5.1.3 | same |
| KPI-BR-035 | BusinessRule | Violation Correction calculation and breakdown | = (corrected ÷ total registered) × 100; breakdown requests/accepted/rejected. | 5.1.3 | same |
| KPI-BR-036 | BusinessRule | Increased Risk Facilities Count logic | Compares current vs previous period risk score. | 5.1.3 | same |
| KPI-BR-037 | BusinessRule | Accepted Appeals calculation and breakdown | = (accepted ÷ total submitted) × 100; breakdown requests/accepted/rejected. | 5.1.3 | same |
| KPI-BR-038 | BusinessRule | Violations per Visit calculation | = total violations ÷ total visits. | 5.1.3 | same |
| KPI-BR-039 | BusinessRule | Visit Types distribution | Count/% per visit type. | 5.1.3 | same |
| KPI-BR-040 | BusinessRule | Samples indicator breakdown | Total / compliant / non-compliant / incomplete. | 5.1.3 | same |
| KPI-BR-041 | BusinessRule | Specialized Inspections Count calculation and breakdown | Sum classified specialized; breakdown Chemical/Customs/Safety. | 5.1.3 | same |
| KPI-BR-042 | BusinessRule | Technical Challenges Count definition | Count of technical challenges observed during visit. | 5.1.3 | same |
| KPI-BR-043 | BusinessRule | Visit Reports Data Quality calculation | = returned reports ÷ approved reports. | 5.1.4 | same |
| KPI-BR-044 | BusinessRule | Inspector Perf Index — returned-reports component (40%) | Weighted 40% of composite index. | 5.1.4 | same |
| KPI-BR-045 | BusinessRule | Inspector Perf Index — time component (20%), tiered standard times | <5 workers=30min, 5-49=60min, 50-249=90min, 250+=120min; score=(standard÷actual)×100 capped 100%. | 5.1.4 | same |
| KPI-BR-046 | BusinessRule | Inspector Perf Index — SLA schedule adherence (20%) | = (compliant visits ÷ total visits) × 100. | 5.1.4 | same |
| KPI-BR-047 | BusinessRule | Inspector Perf Index — investor satisfaction (20%), conditional | Only for service visits; redistribution rule for other types unspecified (ambiguous). | 5.1.4 | same |
| KPI-BR-048 | BusinessRule | Inspector Perf Index — final composite formula | Sum of 4 weighted components. | 5.1.4 | same |
| KPI-BR-049 | BusinessRule | Facility Data Accuracy calculation | = (approved reports matching Sanayi data ÷ total compared) × 100. | 5.1.4 | same |
| KPI-BR-050 | BusinessRule | Investor Satisfaction indicator — no formula defined | Gauge, no formula given (ambiguous). | 5.1.4 | same |
| KPI-BR-051 | BusinessRule | Top 10 Industrial Activities definition | Most-registered activities, top 10 bar chart. | 5.1.4 | same |
| KPI-BR-052 | BusinessRule | Most Frequent Violations definition | Top 10 recurring violations in period. | 5.1.4 | same |
| KPI-BR-053 | BusinessRule | Most Frequent Penalties definition | Top 10 recurring penalties in period. | 5.1.4 | same |
| KPI-BR-054 | BusinessRule | Violation Classification distribution | By severity: high/medium/low. | 5.1.4 | same |
| KPI-BR-055 | BusinessRule | Compliance Processed Requests definition | Workload volume card for Compliance dept. | 5.1.4 | same |
| KPI-BR-056 | BusinessRule | Average Visits per Facility definition | Descriptive average. | 5.1.4 | same |
| KPI-BR-057 | BusinessRule | Facility License Status distribution | Pie chart: active/suspended/cancelled/expired. | 5.1.4 | same |
| KPI-BR-058 | BusinessRule | Facility Status distribution | Current status distribution chart. | 5.1.4 | same |
| KPI-BR-059 | BusinessRule | % Facilities with >3 open violations — no formula defined | Gauge, no formula (ambiguous). | 5.1.4 | same |
| KPI-BR-060 | BusinessRule | External entity compliance indicators — uniform pattern | 14 external entities, each: count/% compliant facilities in that entity's jurisdiction. | 5.1.5 | same |
| KPI-BR-061 | BusinessRule | Report access requires explicit permission | Only users with explicit permission on report/category. | 5.2 BC001 | same |
| KPI-BR-062 | BusinessRule | Export volume threshold handling | >50,000 records → narrow filter or batch export. | 5.2 BC002 | same |
| KPI-BR-063 | BusinessRule | Report formatting standards | Unified date format; SAR currency; % to 2 decimals. | 5.2 BC003 | same |
| KPI-BR-064 | BusinessRule | Only approved/verified data included in regulatory reports | Status must be Approved/Verified. | 5.2 BC004 | same |
| KPI-BR-065 | BusinessRule | No-match alert message (reports) | MSG001, same as dashboard. | 5.2 MSG001 | same |
| KPI-BR-066 | BusinessRule | Date range validation error (reports) | MSG002, same as dashboard. | 5.2 MSG002 | same |
| KPI-BR-067 | BusinessRule | No-data alternative flow message for reports | MSG_REPORT_001, stays on same screen to adjust filters. | 5.2 ALT001 | same |
| KPI-BR-068 | BusinessRule | Reports are read-only | Never modify operational data. | 5.2 | same |
| KPI-BR-069 | BusinessRule | Justification field conditional on execution failure | Linked to "Unable to execute visit" flag. | 5.2.1 | same |
| KPI-BR-070 | BusinessRule | Main vs sub visit type display logic | Highest-priority type shown as Main; rest as Sub. | 5.2.1 | same |
