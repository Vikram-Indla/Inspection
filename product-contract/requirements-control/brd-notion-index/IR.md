# IR — السجل الصناعي (Industrial Registry / Unified Investor File)
Source: /Users/vikramindla/Desktop/BRD Notion/السجل الصناعي - قناة القادة- ملف المستثمر الموحد النسخة الاولى V.1.docx
Total: 1 use case, 40 business rules. Full file read (lines 1-4738).

| ID | Type | Title (English) | Statement (English) | Source section/heading | Arabic excerpt |
|---|---|---|---|---|---|
| IR-UC-001 | UseCase | View industrial registry data with search | Leadership-channel users search by ID/Iqama, CR, or Industrial License number/owner/delegate; system shows matching registry data. Users: Minister of Industry, Deputy Minister, Assistant for Planning, Deputy Ministers, executive offices. | 4.1 UC001 | "يقوم المستخدم بالبحث بالرقم أو اسم مالك السجل التجاري أو المفوض" |
| IR-BR-001 | BusinessRule | No-match message (solution scope level) | No results → "لم يتم العثور على نتائج مطابقة". | 3.1 BR001 | same |
| IR-BR-002 | BusinessRule | No-match message (UC001 error case) | Same message under UC001's ERR001 (duplicate scoped to use case). | UC001 ERR001 | same |
| IR-BR-003 | BusinessRule | Conditional field visibility | Fields shown/hidden automatically per visibility condition in fields table. | UC001 BR001 | same |
| IR-BR-004 | BusinessRule | In-record search after license selection | After selecting a license, user can search within the record. | UC001 BR002 | same |
| IR-BR-005 | BusinessRule | Export to Excel/PDF with selectable sections | Export registry data; user chooses which sections. | UC001 BR003 | same |
| IR-BR-006 | BusinessRule | Market evaluations shown as detailed table, one per rater | All market ratings shown independently (product/capability/spare-part raters). | UC001 BR004 | same |
| IR-BR-007 | BusinessRule | Licenses displayed as independent boxes | Each license = independent box with approved fields; all linked licenses shown. | UC001 BR005 | same |
| IR-BR-008 | BusinessRule | Registry data restricted to entities with a valid industrial license | Only shown for currently-active industrial license holders. | UC001 BR006 | same |
| IR-BR-009 | BusinessRule | Requests table excludes drafts | All requests shown except "Draft" status. | UC001 BR007 | same |
| IR-BR-010 | BusinessRule | Industrial scan status derivation | Awaiting scan → "Awaiting Industrial Scan"; else reflect linked request status. | UC001 BR008 | same |
| IR-BR-011 | BusinessRule | Industrial sector value derivation from activities (multi-valued) | Food&Drug/Military/Gold&PreciousMetals/Industrial per activity; multi-value possible. | UC001 BR009 | same |
| IR-BR-012 | BusinessRule | Deduplicate field values from multiple sources | Same field from multiple sources shown once. | UC001 BR010 | same |
| IR-BR-013 | BusinessRule | Financial fields show full historical record | All historical values shown, not just latest, with source+date. | UC001 BR011 | same |
| IR-BR-014 | BusinessRule | Field color-coding by data-retrieval source, with hover tooltip | Investor-entered=orange; integration-retrieved=green; not-retrieved=red, each with tooltip. | UC001 BR012 | same |
| IR-BR-015 | BusinessRule | Integration with central data warehouse | UI linked to center's data warehouse (terse, underspecified). | UC001 BR13 | same |
| IR-BR-016 | BusinessRule | Compliance-rate calculation logic | Derived from violation-payment compliance, loan-repayment compliance, scan status, Tarmeez product-data completion; exact weighting not specified. | UC001 BR14 | same |
| IR-BR-017 | BusinessRule | Ambiguous/blank alternative-flow slot | ALT001 listed but content blank in source — genuinely missing, not omitted by index. | UC001 ALT001 | (no body) |
| IR-BR-018 | BusinessRule | Licenses & Permits catalogue — standard field set, conditional display | ~30+ license/permit types share standard field set (Number/Issue/Expiry/Doc/Renewable/RenewalDate), shown only if data exists and retrievable. | 4.1.1 الرخص والتصاريح | same |
| IR-BR-019 | BusinessRule | License Data sub-section fields, system-retrieved, license-existence gated | Shown only if a license exists. | 4.1.1 بيانات الرخص | same |
| IR-BR-020 | BusinessRule | Violations sub-section fields | Retrieved via integration from Ministry of Commerce - Eifaa. | 4.1.1 المخالفات | same |
| IR-BR-021 | BusinessRule | Industrial License section fields | System-retrieved fields incl. lifecycle dates (Foundation→Establishment→Production), compliance rate. | 4.1.1 الترخيص الصناعي | same |
| IR-BR-022 | BusinessRule | Customs exemption fields, approved-quantity conditional | Approved Quantity field appears only once exemption approved. | 4.1.1 الإعفاءات الجمركية | same |
| IR-BR-023 | BusinessRule | Machines sub-section fields | Quantity/HS Code/Name/Description/Usage per machine. | 4.1.1 الآلات | same |
| IR-BR-024 | BusinessRule | Visits sub-section fields, per-authority and location-assignment gated | Tracked separately for صناعي system + Royal Commission Jubail&Yanbu + MODON (latter two location-assignment gated, marked not retrieved). | 4.1.1 الزيارات | same |
| IR-BR-025 | BusinessRule | Industrial Market Place listing fields, marketplace-addition gated | Capability/Product/Spare-part fields shown only if added to marketplace. | 4.1.1 السوق الصناعي | same |
| IR-BR-026 | BusinessRule | Industrial Market Place Ratings fields, rater-existence gated | Shown only if raters exist for product/capability/spare-parts. | 4.1.1 تقييمات السوق الصناعي | same |
| IR-BR-027 | BusinessRule | Exports section fields | Local Content % (not retrieved) and Export % (not retrieved) defined but unretrievable. | 4.1.1 الصادرات | same |
| IR-BR-028 | BusinessRule | Energy section fields | Mixed-source fields, several marked not retrieved. | 4.1.1 الطاقة | same |
| IR-BR-029 | BusinessRule | Labor section fields | Investor entry + MHRSD sourced, mostly system-retrieved. | 4.1.1 العمالة | same |
| IR-BR-030 | BusinessRule | Chemical Permits section fields, restriction-type conditional | Shown only if chemical permit exists; Restriction Type populated only after investor selects permit type. | 4.1.1 الفسح الكيميائي | same |
| IR-BR-031 | BusinessRule | Products section fields, multi-source name/description | Product name/description independently sourced 3x from SASO/SFDA/Saudi Exports. | 4.1.1 المنتجات | same |
| IR-BR-032 | BusinessRule | Spatial Location fields tracked independently per land-issuing authority | Area/coordinates/contract fields per authority (10 authorities listed), almost all not retrieved. | 4.1.1 الموقع المكاني | same |
| IR-BR-033 | BusinessRule | Water consumption fields tracked independently per land-issuing authority | Same authority list as IR-BR-032, mostly not retrieved. | 4.1.1 المياه | same |
| IR-BR-034 | BusinessRule | Financial data fields shown as full historical tooltip | Multi-source financial fields (SIMAH, Industrial Fund, ministries), shown as historical tooltip per IR-BR-013. | 4.1.1 بيانات مالية | same |
| IR-BR-035 | BusinessRule | Industrial Scan section fields shown per-year historically | Financial/operating-cost fields shown across all years. | 4.1.1 المسح الصناعي | same |
| IR-BR-036 | BusinessRule | Spare Parts sub-section fields | Unit Name/Price/Product Name/HS Code/Quantity/Description, investor-entered. | 4.1.1 قطع غيار | same |
| IR-BR-037 | BusinessRule | Raw Materials sub-section fields, feedstock-conditional | "Actual Feedstock Consumption" shown only if raw material is feedstock. | 4.1.1 المواد الأولية | same |
| IR-BR-038 | BusinessRule | Programs & Incentives — ~40 status fields, application-existence gated, uniform format | Each of ~40 incentive schemes rendered as single status field "status\date", populated only if an application exists. | 4.1.1 الحوافز والممكنات | same |
| IR-BR-039 | BusinessRule | Reports (البلاغات) sub-section fields, report-existence gated | CRM-sourced, shown only if a report exists. | 4.1.1 البلاغات | same |
| IR-BR-040 | BusinessRule | Requests sub-section fields, request-existence gated | صناعي-system sourced, shown only if request exists (ties to draft-exclusion IR-BR-009). | 4.1.1 الطلبات | same |
