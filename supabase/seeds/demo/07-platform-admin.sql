-- =====================================================================
-- 07-platform-admin.sql
--
-- SYNTHETIC, NON-PRODUCTION DEMO DATA.
--
-- Every row below is invented for demonstration and UI-state coverage on
-- the staging project (iiozvqntawxfwbgffzqu). None of it describes a real
-- device, a real inspector's equipment, a real integration endpoint, a
-- real upstream SENAI call, or a real signature refusal. Do not load this
-- file into a production environment and do not cite any value in it as
-- evidence.
--
-- Scope: MVP3 device / security / integration administration surfaces.
--   /admin/devices            mvp3_devices, mvp3_device_commands
--   /admin/operations         mvp3_error_queue, mvp3_feature_flags
--   /admin/integrations       mvp3_integration_endpoints, mvp3_api_events,
--                             mvp3_export_jobs
--   /admin/security-access    mvp3_access_reviews, mvp3_evidence_access_grants
--   /admin/integrations/senai-data
--                             external_source_connections, senaei_sync_runs,
--                             senaei_sync_calls, senaei_raw_snapshots,
--                             senaei_reconciliation_records
--   package / signature evidence
--                             mvp3_inspection_package_manifests,
--                             mvp3_package_access_events,
--                             signature_acts, mvp3_signature_refusals
--   assistive + capture       ai_events, ocr_extractions, virtual_sessions
--
-- Idempotency: every id is derived deterministically with md5('saqeel-demo:...')
-- and every INSERT ends in ON CONFLICT DO NOTHING. Re-running the file is a
-- no-op. No row is ever updated, truncated or deleted here.
--
-- "Today" for this dataset is 2026-07-27 09:00 +03.
--
-- Applied to staging on 2026-07-27.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. mvp3_devices — inspector iPad trust register (24 rows)
--    CHECK: trust_status='trusted' requires a non-empty mdm_reference AND
--    app_version_compliant = true.
-- ---------------------------------------------------------------------
with d(ident, disp, platform, email, trust, mdm, appver, compliant, seen_min, enrolled_day, enroller) as (values
 ('MIM-IPAD-RUH-0101','آيباد التفتيش الميداني — الرياض 01','ipad_os','inspector@mim.gov.sa','trusted','JAMF-MIM-RUH-0101','3.4.2',true,35,214,'security-admin-01@mim-inspection.test'),
 ('MIM-IPAD-RUH-0102','آيباد التفتيش الميداني — الرياض 02','ipad_os','inspector1@mim.gov.sa','trusted','JAMF-MIM-RUH-0102','3.4.2',true,88,209,'security-admin-01@mim-inspection.test'),
 ('MIM-IPAD-RUH-0103','آيباد التفتيش الميداني — الرياض 03','ipad_os','inspector2@mim.gov.sa','trusted','JAMF-MIM-RUH-0103','3.4.2',true,140,205,'security-admin-01@mim-inspection.test'),
 ('MIM-IPAD-JED-0201','آيباد التفتيش الميداني — جدة 01','ipad_os','inspector3@mim.gov.sa','trusted','JAMF-MIM-JED-0201','3.4.2',true,52,198,'security-admin-02@mim-inspection.test'),
 ('MIM-IPAD-JED-0202','آيباد التفتيش الميداني — جدة 02','ipad_os','inspector4@mim.gov.sa','trusted','JAMF-MIM-JED-0202','3.4.1',true,26,193,'security-admin-02@mim-inspection.test'),
 ('MIM-IPAD-DMM-0301','آيباد التفتيش الميداني — الدمام 01','ipad_os','inspector5@mim.gov.sa','trusted','JAMF-MIM-DMM-0301','3.4.2',true,310,187,'security-admin-02@mim-inspection.test'),
 ('MIM-IPAD-DMM-0302','آيباد التفتيش الميداني — الدمام 02','ipad_os','inspector-01@mim-inspection.test','trusted','JAMF-MIM-DMM-0302','3.4.2',true,19,176,'security-admin-01@mim-inspection.test'),
 ('MIM-IPAD-MAK-0401','آيباد التفتيش الميداني — مكة المكرمة 01','ipad_os','inspector-02@mim-inspection.test','trusted','JAMF-MIM-MAK-0401','3.4.1',true,410,168,'security-admin-03@mim-inspection.test'),
 ('MIM-IPAD-MED-0501','آيباد التفتيش الميداني — المدينة المنورة 01','ipad_os','inspector-03@mim-inspection.test','trusted','JAMF-MIM-MED-0501','3.4.2',true,63,161,'security-admin-03@mim-inspection.test'),
 ('MIM-IPAD-RUH-0104','آيباد التفتيش الميداني — الرياض 04','ipad_os','inspector.test@mim.gov.sa','suspended','JAMF-MIM-RUH-0104','3.3.8',false,2880,152,'security-admin-01@mim-inspection.test'),
 ('MIM-IPAD-ABH-0601','آيباد التفتيش الميداني — أبها 01','ipad_os','inspector@mim.gov.sa','pending',null,'3.4.2',false,null,9,'security-admin-02@mim-inspection.test'),
 ('MIM-IPAD-TAB-0701','آيباد التفتيش الميداني — تبوك 01','ipad_os','inspector1@mim.gov.sa','pending','JAMF-MIM-TAB-0701','3.3.8',false,1440,12,'security-admin-02@mim-inspection.test'),
 ('MIM-IPAD-HAI-0801','آيباد التفتيش الميداني — حائل 01','ipad_os','inspector2@mim.gov.sa','suspended','JAMF-MIM-HAI-0801','3.4.1',true,5760,140,'security-admin-01@mim-inspection.test'),
 ('MIM-IPAD-QSM-0901','آيباد التفتيش الميداني — القصيم 01','ipad_os','inspector3@mim.gov.sa','revoked','JAMF-MIM-QSM-0901','3.3.8',false,10080,133,'security-admin-03@mim-inspection.test'),
 ('MIM-IPAD-JZN-1001','آيباد التفتيش الميداني — جازان 01','ipad_os','inspector4@mim.gov.sa','wipe_pending','JAMF-MIM-JZN-1001','3.4.1',true,4320,127,'security-admin-01@mim-inspection.test'),
 ('MIM-IPAD-RUH-0105','آيباد التفتيش الميداني — الرياض 05','ipad_os','inspector5@mim.gov.sa','wiped','JAMF-MIM-RUH-0105','3.3.8',false,20160,119,'security-admin-01@mim-inspection.test'),
 ('MIM-IPAD-JED-0203','آيباد التفتيش الميداني — جدة 03','ipad_os','inspector-01@mim-inspection.test','trusted','JAMF-MIM-JED-0203','3.4.2',true,44,112,'security-admin-02@mim-inspection.test'),
 ('MIM-IPAD-DMM-0303','آيباد التفتيش الميداني — الدمام 03','ipad_os','inspector-02@mim-inspection.test','trusted','JAMF-MIM-DMM-0303','3.4.2',true,97,104,'security-admin-02@mim-inspection.test'),
 ('MIM-IPAD-MAK-0402','آيباد التفتيش الميداني — مكة المكرمة 02','ipad_os','inspector-03@mim-inspection.test','pending','JAMF-MIM-MAK-0402','3.4.0',false,720,21,'security-admin-03@mim-inspection.test'),
 ('MIM-IPAD-MED-0502','آيباد احتياطي — مستودع المدينة المنورة','ipad_os',null,'pending',null,null,false,null,16,'security-admin-03@mim-inspection.test'),
 ('MIM-IPAD-RUH-0106','آيباد التفتيش الميداني — الرياض 06','ipad_os','inspector@mim.gov.sa','trusted','JAMF-MIM-RUH-0106','3.4.2',true,11,97,'security-admin-01@mim-inspection.test'),
 ('MIM-IPAD-JED-0204','آيباد التفتيش الميداني — جدة 04','ipad_os','inspector1@mim.gov.sa','suspended','JAMF-MIM-JED-0204','3.4.1',true,2160,89,'security-admin-02@mim-inspection.test'),
 ('MIM-WEB-RUH-9001','محطة عمل مُدارة — غرفة عمليات الرياض','web_managed','ops@mim.gov.sa','trusted','INTUNE-MIM-9001','3.4.2',true,6,240,'security-admin-01@mim-inspection.test'),
 ('MIM-WEB-RUH-9002','محطة عمل مُدارة — إدارة الأمن السيبراني','web_managed','admin@mim.gov.sa','trusted','INTUNE-MIM-9002','3.4.2',true,3,240,'security-admin-01@mim-inspection.test')
)
insert into mvp3_devices (id, device_identifier, display_name, platform, assigned_user_id, trust_status, mdm_reference, app_version, app_version_compliant, last_seen_at, enrolled_by, enrolled_at, updated_at)
select md5('saqeel-demo:mvp3_devices:'||d.ident)::uuid,
       d.ident, d.disp, d.platform,
       (select u.id from auth.users u where u.email = d.email),
       d.trust, d.mdm, d.appver, d.compliant,
       case when d.seen_min is null then null else timestamptz '2026-07-27 09:00:00+03' - (d.seen_min || ' minutes')::interval end,
       (select u.id from auth.users u where u.email = d.enroller),
       timestamptz '2026-07-27 09:00:00+03' - (d.enrolled_day || ' days')::interval,
       timestamptz '2026-07-27 09:00:00+03' - (d.enrolled_day || ' days')::interval
from d
on conflict do nothing;


-- ---------------------------------------------------------------------
-- 2. mvp3_device_commands — governed commands against the register (34 rows)
--    CHECK: length(btrim(reason)) >= 8.
-- ---------------------------------------------------------------------
with c(seq, ident, command, status, reason, requester, req_min, done_min) as (values
 (1,'MIM-IPAD-RUH-0104','suspend','completed','بلاغ فقدان الجهاز أثناء جولة تفتيش في المدينة الصناعية الثانية','security-admin-01@mim-inspection.test',4320,4290),
 (2,'MIM-IPAD-RUH-0104','expire_packages','completed','إنهاء صلاحية حزم التفتيش المحملة على الجهاز الموقوف','security-admin-01@mim-inspection.test',4300,4275),
 (3,'MIM-IPAD-HAI-0801','suspend','completed','عدم توافق إصدار التطبيق مع سياسة الأمن المعتمدة','security-admin-01@mim-inspection.test',7200,7150),
 (4,'MIM-IPAD-QSM-0901','remote_wipe','completed','إنهاء خدمة المفتش وسحب العهدة من فرع القصيم','security-admin-03@mim-inspection.test',11520,11400),
 (5,'MIM-IPAD-RUH-0105','remote_wipe','completed','الجهاز مشطوب من سجل العهد ويجب مسحه بالكامل','security-admin-01@mim-inspection.test',21600,21500),
 (6,'MIM-IPAD-JZN-1001','remote_wipe','queued','بلاغ سرقة مسجل لدى الأمن الصناعي بمنطقة جازان','security-admin-01@mim-inspection.test',4200,null),
 (7,'MIM-IPAD-JZN-1001','suspend','acknowledged','إيقاف مؤقت لحين اكتمال إجراء المسح عن بُعد','security-admin-01@mim-inspection.test',4260,null),
 (8,'MIM-IPAD-JED-0204','suspend','completed','مغادرة المفتش في إجازة طويلة وتسليم الجهاز للمستودع','security-admin-02@mim-inspection.test',3000,2960),
 (9,'MIM-IPAD-JED-0204','expire_packages','acknowledged','إنهاء صلاحية الحزم المحفوظة قبل إعادة الإسناد','security-admin-02@mim-inspection.test',2900,null),
 (10,'MIM-IPAD-TAB-0701','expire_packages','queued','الجهاز قيد التسجيل ولم تُعتمد ثقته بعد','security-admin-02@mim-inspection.test',1500,null),
 (11,'MIM-IPAD-MAK-0402','suspend','dependency_blocked','خدمة إدارة الأجهزة غير متاحة، الأمر بانتظار الاعتماد','security-admin-03@mim-inspection.test',900,null),
 (12,'MIM-IPAD-ABH-0601','expire_packages','dependency_blocked','تعذّر الوصول إلى منصة إدارة الأجهزة الحكومية','security-admin-02@mim-inspection.test',600,null),
 (13,'MIM-IPAD-RUH-0101','expire_packages','completed','إنهاء صلاحية حزم زيارة ملغاة بقرار من غرفة العمليات','ops@mim.gov.sa',2880,2870),
 (14,'MIM-IPAD-RUH-0102','expire_packages','completed','إغلاق دورة التفتيش الشهرية وسحب الحزم المنتهية','ops@mim.gov.sa',2870,2860),
 (15,'MIM-IPAD-RUH-0103','expire_packages','completed','إغلاق دورة التفتيش الشهرية وسحب الحزم المنتهية','ops@mim.gov.sa',2860,2850),
 (16,'MIM-IPAD-JED-0201','expire_packages','completed','تغيير نطاق التكليف الجغرافي للمفتش','ops@mim.gov.sa',2400,2380),
 (17,'MIM-IPAD-JED-0202','expire_packages','failed','تعذّر تسليم الأمر، الجهاز خارج التغطية منذ أكثر من يوم','ops@mim.gov.sa',2300,2200),
 (18,'MIM-IPAD-JED-0202','expire_packages','completed','إعادة إرسال أمر إنهاء الصلاحية بعد عودة الاتصال','ops@mim.gov.sa',2100,2080),
 (19,'MIM-IPAD-DMM-0301','suspend','completed','اشتباه في وصول غير مصرح به من شبكة خارجية','security-admin-02@mim-inspection.test',6000,5950),
 (20,'MIM-IPAD-DMM-0301','resume','completed','انتهاء التحقيق الأمني دون ملاحظات على الجهاز','security-admin-02@mim-inspection.test',5400,5380),
 (21,'MIM-IPAD-DMM-0302','expire_packages','completed','سحب حزم مصنع أُغلق ملفه إداريًا','ops@mim.gov.sa',1800,1790),
 (22,'MIM-IPAD-MAK-0401','suspend','completed','تحديث إجباري لإصدار التطبيق قبل استئناف العمل','security-admin-03@mim-inspection.test',1440,1400),
 (23,'MIM-IPAD-MAK-0401','resume','completed','تم تثبيت الإصدار المعتمد واستيفاء متطلبات الثقة','security-admin-03@mim-inspection.test',1380,1370),
 (24,'MIM-IPAD-MED-0501','expire_packages','acknowledged','إنهاء صلاحية حزم زيارة مؤجلة بطلب من المخطط','ops@mim.gov.sa',720,null),
 (25,'MIM-IPAD-JED-0203','expire_packages','queued','إعادة ضبط الحزم بعد تحديث نسخة نموذج التفتيش','ops@mim.gov.sa',300,null),
 (26,'MIM-IPAD-DMM-0303','expire_packages','queued','إعادة ضبط الحزم بعد تحديث نسخة نموذج التفتيش','ops@mim.gov.sa',290,null),
 (27,'MIM-IPAD-RUH-0106','expire_packages','acknowledged','سحب حزمة زيارة أُعيد إسنادها إلى مفتش آخر','ops@mim.gov.sa',240,null),
 (28,'MIM-IPAD-RUH-0106','suspend','failed','تعذّر تنفيذ الإيقاف، الجهاز لم يستجب خلال المهلة','security-admin-01@mim-inspection.test',180,120),
 (29,'MIM-WEB-RUH-9001','expire_packages','completed','تنظيف الجلسات المفتوحة في غرفة العمليات نهاية الوردية','security-admin-01@mim-inspection.test',600,590),
 (30,'MIM-WEB-RUH-9002','expire_packages','completed','تنظيف الجلسات الإدارية بعد مراجعة الصلاحيات','security-admin-01@mim-inspection.test',480,470),
 (31,'MIM-IPAD-RUH-0101','suspend','queued','مراجعة أمنية دورية للأجهزة عالية الاستخدام','security-admin-01@mim-inspection.test',90,null),
 (32,'MIM-IPAD-HAI-0801','resume','dependency_blocked','طلب استئناف الخدمة موقوف لحين اعتماد إدارة الأمن','security-admin-01@mim-inspection.test',1200,null),
 (33,'MIM-IPAD-RUH-0104','resume','queued','إعادة تفعيل الجهاز بعد العثور عليه وتسليمه للمستودع','security-admin-01@mim-inspection.test',60,null),
 (34,'MIM-IPAD-MED-0502','expire_packages','dependency_blocked','الجهاز غير مسند لأي مفتش ولا يمكن تأكيد التنفيذ','security-admin-03@mim-inspection.test',45,null)
)
insert into mvp3_device_commands (id, device_id, requested_device_identifier, command, status, reason, requested_by, requested_at, completed_at)
select md5('saqeel-demo:mvp3_device_commands:'||c.seq::text||':'||c.ident)::uuid,
       (select dv.id from mvp3_devices dv where dv.device_identifier = c.ident),
       c.ident, c.command, c.status, c.reason,
       (select u.id from auth.users u where u.email = c.requester),
       timestamptz '2026-07-27 09:00:00+03' - (c.req_min || ' minutes')::interval,
       case when c.done_min is null then null else timestamptz '2026-07-27 09:00:00+03' - (c.done_min || ' minutes')::interval end
from c
on conflict do nothing;


-- ---------------------------------------------------------------------
-- 3. mvp3_error_queue — platform error records with retry state (26 rows)
-- ---------------------------------------------------------------------
with e(seq, source, operation, status, attempts, err_code, detail, created_min, next_min, resolved_min) as (values
 (1,'senaei_adapter','GET /api/inspection/tasks','failed',3,'UPSTREAM_TIMEOUT','{"safe_message":"Senaei task list did not respond within the configured window","endpoint_key":"GET /api/inspection/tasks"}',95,15,null),
 (2,'senaei_adapter','GET /api/inspection/tasks/{task}','retry_requested',2,'HTTP_502','{"safe_message":"Upstream gateway returned a bad gateway response","endpoint_key":"GET /api/inspection/tasks/{task}"}',260,40,null),
 (3,'senaei_adapter','GET /api/v3/inspection/plants','failed',5,'CONTRACT_MISMATCH','{"safe_message":"Plant payload omitted a documented identifier field","entity_type":"plant"}',420,90,null),
 (4,'evidence_upload','POST storage/evidence-object','failed',4,'CHECKSUM_MISMATCH','{"safe_message":"Uploaded object digest did not match the device-declared digest"}',180,30,null),
 (5,'evidence_upload','POST storage/evidence-object','resolved',2,'NETWORK_RESET','{"safe_message":"Device connection reset during upload; retry succeeded"}',1500,null,1440),
 (6,'offline_sync','POST sync/inspection-drafts','failed',6,'CONFLICT_VERSION','{"safe_message":"Draft submitted against a superseded package version"}',330,60,null),
 (7,'offline_sync','POST sync/inspection-drafts','dependency_blocked',1,'DEVICE_UNTRUSTED','{"safe_message":"Originating device is not in a trusted state"}',290,null,null),
 (8,'offline_sync','POST sync/evidence-manifest','retry_requested',3,'PARTIAL_BATCH','{"safe_message":"Batch accepted partially; remaining items queued"}',210,25,null),
 (9,'pdf_report','POST render/inspection-report','failed',2,'RENDER_TIMEOUT','{"safe_message":"Report renderer exceeded the allowed execution window"}',150,20,null),
 (10,'pdf_report','POST render/enforcement-notice','resolved',3,'FONT_ASSET_MISSING','{"safe_message":"Arabic typeface asset was unavailable at render time"}',2600,null,2500),
 (11,'push_dispatch','POST notifications/device-push','failed',7,'TOKEN_EXPIRED','{"safe_message":"Device push token rejected by the notification provider"}',75,10,null),
 (12,'push_dispatch','POST notifications/device-push','dead_letter',10,'TOKEN_EXPIRED','{"safe_message":"Maximum retry budget exhausted; manual re-enrolment required"}',5200,null,null),
 (13,'identity_broker','POST auth/session-exchange','dependency_blocked',1,'PROVIDER_NOT_CONFIGURED','{"safe_message":"External identity provider is not configured in this environment"}',600,null,null),
 (14,'identity_broker','GET auth/role-assertions','failed',2,'HTTP_403','{"safe_message":"Role assertion request was refused by the identity provider"}',540,45,null),
 (15,'mapbox_tiles','GET tiles/region-posture','dependency_blocked',1,'CREDENTIAL_ABSENT','{"safe_message":"Map runtime credential is not present in this environment"}',480,null,null),
 (16,'export_pipeline','POST export/evidence-bundle','failed',3,'ARTIFACT_TOO_LARGE','{"safe_message":"Requested bundle exceeded the governed artefact size"}',360,55,null),
 (17,'export_pipeline','POST export/audit-trail','resolved',1,'STORAGE_UNAVAILABLE','{"safe_message":"Object store was briefly unavailable; delivery completed on retry"}',3000,null,2900),
 (18,'workflow_engine','POST workflow/sla-evaluation','failed',2,'RULE_NOT_CONFIGURED','{"safe_message":"SLA rule referenced by the workflow has no approved value"}',720,80,null),
 (19,'workflow_engine','POST workflow/task-escalation','retry_requested',4,'LOCK_CONTENTION','{"safe_message":"Escalation could not acquire the task lock"}',660,35,null),
 (20,'ocr_service','POST ocr/extract-document','failed',2,'PROVIDER_QUOTA','{"safe_message":"Document extraction provider quota was exhausted"}',240,50,null),
 (21,'ocr_service','POST ocr/extract-document','dependency_blocked',1,'PROVIDER_UNAVAILABLE','{"safe_message":"Document extraction provider is not enabled in this environment"}',200,null,null),
 (22,'signature_service','POST signature/verify-report','failed',3,'TRUST_CHAIN_INCOMPLETE','{"safe_message":"Signing certificate chain could not be completed"}',130,22,null),
 (23,'signature_service','POST signature/verify-report','dead_letter',9,'TRUST_CHAIN_INCOMPLETE','{"safe_message":"Verification abandoned after the governed retry budget"}',4800,null,null),
 (24,'scheduler','POST scheduler/visit-window-expiry','resolved',1,'CLOCK_SKEW','{"safe_message":"Scheduler node clock skew corrected; expiry re-evaluated"}',1900,null,1850),
 (25,'senaei_adapter','POST /api/inspection/{session}','failed',4,'HTTP_401','{"safe_message":"Provider session credentials were refused","endpoint_key":"POST /api/inspection/{session}"}',110,18,null),
 (26,'senaei_adapter','GET /api/v3/inspection/plants/{plant}/chemical-permits','retry_requested',2,'HTTP_429','{"safe_message":"Provider rate limit reached on chemical permit lookup"}',85,12,null)
)
insert into mvp3_error_queue (id, source, operation, idempotency_key, correlation_id, status, attempt_count, last_error_code, safe_detail, next_attempt_at, created_at, updated_at, resolved_at)
select md5('saqeel-demo:mvp3_error_queue:'||e.seq::text)::uuid,
       e.source, e.operation,
       'demo-'||lpad(e.seq::text,3,'0')||'-'||substr(md5('saqeel-demo:idem:'||e.seq::text),1,16),
       md5('saqeel-demo:mvp3_error_queue:corr:'||e.seq::text)::uuid,
       e.status, e.attempts, e.err_code, e.detail::jsonb,
       case when e.next_min is null then null else timestamptz '2026-07-27 09:00:00+03' + (e.next_min || ' minutes')::interval end,
       timestamptz '2026-07-27 09:00:00+03' - (e.created_min || ' minutes')::interval,
       timestamptz '2026-07-27 09:00:00+03' - (greatest(e.created_min - 5, 0) || ' minutes')::interval,
       case when e.resolved_min is null then null else timestamptz '2026-07-27 09:00:00+03' - (e.resolved_min || ' minutes')::interval end
from e
on conflict do nothing;


-- ---------------------------------------------------------------------
-- 4. mvp3_feature_flags — versioned flags under maker-checker (24 rows)
--    CHECK: status='published' requires approved_by IS NOT NULL,
--    approved_by <> created_by, and published_at IS NOT NULL.
-- ---------------------------------------------------------------------
with f(flag_key, ver, descr, enabled, status, creator, approver, created_day, published_day) as (values
 ('offline_package_download',1,'تنزيل حزم التفتيش للعمل دون اتصال على أجهزة الآيباد الموثوقة',false,'retired','workflow-admin-01@mim-inspection.test','security-admin-01@mim-inspection.test',210,205),
 ('offline_package_download',2,'تنزيل حزم التفتيش للعمل دون اتصال على أجهزة الآيباد الموثوقة',true,'published','workflow-admin-01@mim-inspection.test','security-admin-01@mim-inspection.test',204,200),
 ('device_trust_gate',1,'منع فتح حزم التفتيش على الأجهزة غير الموثوقة',true,'published','security-admin-01@mim-inspection.test','admin@mim.gov.sa',198,195),
 ('remote_wipe_console',1,'إتاحة أمر المسح عن بُعد من وحدة تحكم الأجهزة',true,'published','security-admin-02@mim-inspection.test','admin@mim.gov.sa',190,186),
 ('senaei_live_sync',1,'مزامنة بيانات صناعي الحية بدل الاستيراد اليدوي',false,'draft','workflow-admin-02@mim-inspection.test',null,42,null),
 ('senaei_csv_import',1,'استيراد ملفات صناعي بصيغة CSV مع سجل تسوية',true,'published','workflow-admin-02@mim-inspection.test','compliance-admin-01@mim-inspection.test',170,166),
 ('ai_daily_briefing',1,'الإحاطة اليومية المقترحة للمفتش قبل بدء الجولة',true,'published','form-admin-01@mim-inspection.test','compliance-admin-02@mim-inspection.test',150,147),
 ('ai_risk_explanation',1,'شرح مؤشر خطورة المصنع بلغة مفهومة للمستخدم',false,'draft','form-admin-01@mim-inspection.test',null,28,null),
 ('ocr_document_capture',1,'استخراج النص من صور المستندات الملتقطة ميدانيًا',false,'draft','form-admin-02@mim-inspection.test',null,21,null),
 ('virtual_inspection_room',1,'غرفة التفتيش الافتراضية مع تحقق هوية الممثل',true,'published','workflow-admin-01@mim-inspection.test','compliance-admin-01@mim-inspection.test',140,136),
 ('virtual_identity_check',1,'التحقق من هوية ممثل المنشأة قبل بدء الجلسة الافتراضية',true,'published','security-admin-03@mim-inspection.test','admin@mim.gov.sa',132,128),
 ('evidence_geo_binding',1,'ربط الأدلة بإحداثيات الالتقاط ومصدرها',true,'published','gis-admin-01@mim-inspection.test','compliance-admin-01@mim-inspection.test',124,120),
 ('map_region_posture',1,'عرض وضع المناطق على خريطة غرفة العمليات',false,'draft','gis-admin-02@mim-inspection.test',null,35,null),
 ('enforcement_recommendation',1,'توصية إجراء إنفاذ مبنية على سجل المخالفات',true,'published','compliance-admin-01@mim-inspection.test','admin@mim.gov.sa',118,114),
 ('bulk_violation_entry',1,'إدخال المخالفات بالجملة لدورات التفتيش الموسمية',false,'retired','compliance-admin-02@mim-inspection.test','admin@mim.gov.sa',112,108),
 ('bulk_violation_entry',2,'إدخال المخالفات بالجملة مع تحقق مزدوج قبل الاعتماد',true,'published','compliance-admin-02@mim-inspection.test','admin@mim.gov.sa',96,92),
 ('signature_refusal_flow',1,'تسجيل رفض التوقيع مع إفادة المفتش والشاهد',true,'published','workflow-admin-03@mim-inspection.test','security-admin-01@mim-inspection.test',88,84),
 ('export_receipt_hash',1,'إصدار بصمة تحقق مع كل ملف تصدير',true,'published','security-admin-01@mim-inspection.test','compliance-admin-03@mim-inspection.test',80,76),
 ('audit_trail_export',1,'تصدير مسار التدقيق للمراجعين الخارجيين',false,'draft','security-admin-02@mim-inspection.test',null,14,null),
 ('push_notifications',1,'إشعارات فورية لأجهزة المفتشين عند إسناد زيارة',true,'published','ops-01@mim-inspection.test','security-admin-02@mim-inspection.test',72,68),
 ('sla_escalation_engine',1,'تصعيد المهام المتأخرة وفق قواعد اتفاقية مستوى الخدمة',false,'draft','workflow-admin-02@mim-inspection.test',null,10,null),
 ('factory360_dossier',1,'ملف المصنع الشامل بعرض موحد للويب والآيباد',true,'published','workflow-admin-01@mim-inspection.test','compliance-admin-02@mim-inspection.test',64,60),
 ('inspector_travel_log',1,'سجل تنقل المفتش بين المواقع خلال اليوم',false,'draft','ops-02@mim-inspection.test',null,7,null),
 ('arabic_report_typography',1,'اعتماد الخط العربي الرسمي في تقارير التفتيش',true,'published','form-admin-03@mim-inspection.test','compliance-admin-01@mim-inspection.test',56,52)
)
insert into mvp3_feature_flags (id, flag_key, version, description, enabled, status, created_by, approved_by, created_at, published_at)
select md5('saqeel-demo:mvp3_feature_flags:'||f.flag_key||':'||f.ver::text)::uuid,
       f.flag_key, f.ver, f.descr, f.enabled, f.status,
       (select u.id from auth.users u where u.email = f.creator),
       (select u.id from auth.users u where u.email = f.approver),
       timestamptz '2026-07-27 09:00:00+03' - (f.created_day || ' days')::interval,
       case when f.published_day is null then null else timestamptz '2026-07-27 09:00:00+03' - (f.published_day || ' days')::interval end
from f
on conflict do nothing;


-- ---------------------------------------------------------------------
-- 5. mvp3_integration_endpoints — grow the governed registry (+10 rows)
--    CHECK: status='configured' requires a non-empty base_url.
--    Endpoints whose contract is not approved stay dependency_blocked with
--    no base_url — configuration is never implied.
-- ---------------------------------------------------------------------
with p(endpoint_key, disp, kind, contract, status, base_url, cfg, created_day) as (values
 ('senaei_master_data','SENAI industrial master data','master_data','v2.4','configured','https://senaei-staging.mim.gov.sa/api/inspection','{"auth_mode":"bearer","read_only":true,"write_back":false}',240),
 ('senaei_public_v3','SENAI public plant register (v3)','data_exchange','v3.0','configured','https://senaei-staging.mim.gov.sa/api/v3/inspection','{"auth_mode":"none","read_only":true}',236),
 ('industrial_licensing','Industrial licensing register','license','UNAPPROVED','dependency_blocked',null,'{"blocking_reason":"contract not approved"}',228),
 ('national_address','National address directory','other','UNAPPROVED','dependency_blocked',null,'{"blocking_reason":"contract not approved"}',221),
 ('nafath_identity','Nafath national single sign-on','identity','UNAPPROVED','dependency_blocked',null,'{"blocking_reason":"onboarding request pending"}',214),
 ('document_archive','Official document archive','document','v1.2','degraded','https://archive-staging.mim.gov.sa/documents','{"auth_mode":"api_key","observed":"elevated latency on retrieval"}',205),
 ('analytics_warehouse','Ministry analytics warehouse','analytics','v1.0','configured','https://analytics-staging.mim.gov.sa/ingest','{"auth_mode":"api_key","direction":"outbound"}',196),
 ('notification_sms','Government SMS gateway','other','v1.1','degraded','https://sms-gateway-staging.mim.gov.sa/v1','{"auth_mode":"api_key","observed":"partial delivery receipts"}',188),
 ('notification_push','Inspector device push service','other','v2.0','configured','https://push-staging.mim.gov.sa/v2','{"auth_mode":"bearer","platform":"ipad_os"}',176),
 ('enforcement_case_registry','Enforcement case registry','other','UNAPPROVED','disabled',null,'{"blocking_reason":"awaiting legal affairs sign-off"}',164)
)
insert into mvp3_integration_endpoints (id, endpoint_key, display_name, endpoint_kind, contract_version, status, base_url, configuration, created_by, created_at, updated_at)
select md5('saqeel-demo:mvp3_integration_endpoints:'||p.endpoint_key)::uuid,
       p.endpoint_key, p.disp, p.kind, p.contract, p.status, p.base_url, p.cfg::jsonb,
       (select u.id from auth.users u where u.email='admin@mim.gov.sa'),
       timestamptz '2026-07-27 09:00:00+03' - (p.created_day || ' days')::interval,
       timestamptz '2026-07-27 09:00:00+03' - ((p.created_day/4) || ' days')::interval
from p
on conflict do nothing;


-- ---------------------------------------------------------------------
-- 6. mvp3_api_events — 24 templates x 2 occurrences (48 rows)
--    Governance-blocked calls are recorded as outcome='blocked' rather
--    than as failures — refusal before dispatch is a distinct fact.
-- ---------------------------------------------------------------------
with tpl(n, ep_key, kind, direction, outcome, obj_type, detail, actor_email) as (values
 (1,'senaei_master_data','task_pull','outbound','accepted','inspection_task','{"safe_message":"Inspection task list retrieved","endpoint_key":"GET /api/inspection/tasks"}',null),
 (2,'senaei_master_data','task_detail_fetch','outbound','accepted','inspection_task','{"safe_message":"Task detail retrieved with plant, licence and CR identity","endpoint_key":"GET /api/inspection/tasks/{task}"}',null),
 (3,'senaei_master_data','session_login','outbound','accepted','provider_session','{"safe_message":"Provider session established","endpoint_key":"POST /api/inspection/{session}"}','ops@mim.gov.sa'),
 (4,'senaei_master_data','session_login','outbound','rejected','provider_session','{"safe_message":"Provider refused the session credentials","safe_error_code":"HTTP_401"}','ops@mim.gov.sa'),
 (5,'senaei_public_v3','plant_lookup','outbound','accepted','plant','{"safe_message":"Industrial plant register page retrieved","endpoint_key":"GET /api/v3/inspection/plants"}',null),
 (6,'senaei_public_v3','chemical_permit_lookup','outbound','accepted','chemical_permit','{"safe_message":"Chemical permits retrieved for the requested plant"}',null),
 (7,'senaei_public_v3','customs_exemption_lookup','outbound','failed','customs_exemption','{"safe_message":"Customs exemption lookup did not complete","safe_error_code":"UPSTREAM_TIMEOUT"}',null),
 (8,'senaei_master_data','submission_forward','outbound','blocked','inspection_submission','{"safe_message":"Inspection result forward is governed off at the adapter","governance_block":"BLOCKED_TRIGGER_DECISION"}','admin@mim.gov.sa'),
 (9,'analytics_warehouse','metrics_push','outbound','delivered','analytics_batch','{"safe_message":"Daily inspection metrics batch delivered"}',null),
 (10,'analytics_warehouse','metrics_push','outbound','failed','analytics_batch','{"safe_message":"Metrics batch rejected by the warehouse ingest endpoint","safe_error_code":"SCHEMA_MISMATCH"}',null),
 (11,'notification_push','device_push','outbound','delivered','notification','{"safe_message":"Visit assignment notification delivered to inspector device"}',null),
 (12,'notification_push','device_push','outbound','failed','notification','{"safe_message":"Device push token was rejected","safe_error_code":"TOKEN_EXPIRED"}',null),
 (13,'notification_sms','sms_dispatch','outbound','delivered','notification','{"safe_message":"Appointment notice delivered to establishment representative"}',null),
 (14,'notification_sms','sms_dispatch','outbound','failed','notification','{"safe_message":"SMS gateway returned no delivery receipt","safe_error_code":"NO_RECEIPT"}',null),
 (15,'document_archive','document_fetch','outbound','accepted','archived_document','{"safe_message":"Archived licence document retrieved"}','admin@mim.gov.sa'),
 (16,'document_archive','document_fetch','outbound','failed','archived_document','{"safe_message":"Archive retrieval exceeded the allowed window","safe_error_code":"RENDER_TIMEOUT"}','admin@mim.gov.sa'),
 (17,'nafath_identity','session_exchange','outbound','blocked','identity_session','{"safe_message":"External identity provider is not configured in this environment"}',null),
 (18,'industrial_licensing','license_lookup','outbound','blocked','industrial_license','{"safe_message":"Licensing contract is not approved; call refused before dispatch"}',null),
 (19,'national_address','address_lookup','outbound','blocked','national_address','{"safe_message":"Address directory contract is not approved; call refused before dispatch"}',null),
 (20,null,'inbound_webhook_receipt','inbound','rejected','webhook','{"safe_message":"Inbound webhook signature could not be validated"}',null),
 (21,null,'export_delivery','internal','delivered','export_job','{"safe_message":"Export artefact delivered with receipt hash"}','security-admin-01@mim-inspection.test'),
 (22,null,'package_manifest_compile','internal','accepted','package_manifest','{"safe_message":"Inspection package manifest compiled for an assigned device"}','ops@mim.gov.sa'),
 (23,null,'device_command_dispatch','internal','accepted','device_command','{"safe_message":"Governed device command dispatched to the trust register"}','security-admin-01@mim-inspection.test'),
 (24,'enforcement_case_registry','case_forward','outbound','blocked','enforcement_case','{"safe_message":"Enforcement case registry is disabled pending legal sign-off"}','admin@mim.gov.sa')
), rep(r) as (values (0),(1))
insert into mvp3_api_events (id, endpoint_id, event_kind, direction, outcome, correlation_id, actor_id, object_type, object_id, payload_digest, detail, occurred_at)
select md5('saqeel-demo:mvp3_api_events:'||tpl.n::text||':'||rep.r::text)::uuid,
       (select ep.id from mvp3_integration_endpoints ep where ep.endpoint_key = tpl.ep_key),
       tpl.kind, tpl.direction, tpl.outcome,
       md5('saqeel-demo:mvp3_api_events:corr:'||tpl.n::text||':'||rep.r::text)::uuid,
       (select u.id from auth.users u where u.email = tpl.actor_email),
       tpl.obj_type,
       'MIM-'||upper(substr(md5('saqeel-demo:obj:'||tpl.n::text||':'||rep.r::text),1,10)),
       md5('saqeel-demo:digest-a:'||tpl.n::text||':'||rep.r::text)||md5('saqeel-demo:digest-b:'||tpl.n::text||':'||rep.r::text),
       tpl.detail::jsonb,
       timestamptz '2026-07-27 09:00:00+03' - ((tpl.n * 137 + rep.r * 4297) || ' minutes')::interval
from tpl cross join rep
on conflict do nothing;


-- ---------------------------------------------------------------------
-- 7. mvp3_export_jobs — governed exports with receipts (24 rows)
--    CHECK: status='delivered' requires artifact_hash AND completed_at.
--    CHECK: length(btrim(purpose)) >= 8.
-- ---------------------------------------------------------------------
with j(seq, kind, purpose, status, ep_key, scope, requester, req_min, done_min) as (values
 (1,'inspection_report_pdf','تسليم تقرير تفتيش موقّع إلى إدارة الالتزام','delivered','document_archive','{"inspection_scope":"single","region":"الرياض"}','compliance-admin-01@mim-inspection.test',7200,7150),
 (2,'inspection_report_pdf','تسليم تقرير تفتيش موقّع إلى إدارة الالتزام','delivered','document_archive','{"inspection_scope":"single","region":"جدة"}','compliance-admin-01@mim-inspection.test',6800,6760),
 (3,'evidence_bundle','تزويد لجنة التحقيق بحزمة الأدلة المرتبطة بالمخالفة','delivered','document_archive','{"evidence_scope":"violation_linked","region":"الدمام"}','security-admin-01@mim-inspection.test',6400,6300),
 (4,'evidence_bundle','تزويد النيابة الإدارية بحزمة أدلة مصنع مخالف','queued',null,'{"evidence_scope":"factory_linked","region":"القصيم"}','security-admin-01@mim-inspection.test',180,null),
 (5,'violation_register_csv','مطابقة سجل المخالفات مع تقرير الإدارة الشهري','delivered','analytics_warehouse','{"period":"2026-06","region":"all"}','compliance-admin-02@mim-inspection.test',5900,5850),
 (6,'violation_register_csv','مطابقة سجل المخالفات مع تقرير الإدارة الشهري','prepared',null,'{"period":"2026-07","region":"all"}','compliance-admin-02@mim-inspection.test',300,null),
 (7,'enforcement_docket','رفع ملف الإنفاذ إلى الشؤون القانونية للمراجعة','delivered','document_archive','{"case_scope":"escalated","region":"الرياض"}','compliance-admin-03@mim-inspection.test',5200,5120),
 (8,'enforcement_docket','رفع ملف الإنفاذ إلى الشؤون القانونية للمراجعة','failed',null,'{"case_scope":"escalated","region":"مكة المكرمة"}','compliance-admin-03@mim-inspection.test',4800,null),
 (9,'audit_trail_extract','تزويد المراجع الداخلي بمسار التدقيق للربع الثاني','delivered',null,'{"period":"2026-Q2","object_types":["inspections","violations"]}','admin@mim.gov.sa',4600,4500),
 (10,'audit_trail_extract','تزويد ديوان المراقبة العامة بمسار التدقيق','dependency_blocked',null,'{"period":"2026-Q2","object_types":["all"]}','admin@mim.gov.sa',4400,null),
 (11,'factory_360_snapshot','حفظ لقطة ملف المصنع قبل قرار الإنفاذ','delivered','document_archive','{"factory_scope":"single","region":"الدمام"}','ops@mim.gov.sa',4000,3960),
 (12,'factory_360_snapshot','حفظ لقطة ملف المصنع قبل قرار الإنفاذ','delivered','document_archive','{"factory_scope":"single","region":"جازان"}','ops@mim.gov.sa',3600,3560),
 (13,'inspection_report_pdf','تزويد ممثل المنشأة بنسخة التقرير النهائي','delivered','document_archive','{"inspection_scope":"single","region":"المدينة المنورة"}','ops-01@mim-inspection.test',3200,3170),
 (14,'inspection_report_pdf','تزويد ممثل المنشأة بنسخة التقرير النهائي','cancelled',null,'{"inspection_scope":"single","region":"تبوك"}','ops-01@mim-inspection.test',2900,null),
 (15,'analytics_extract','تغذية مستودع التحليلات بمؤشرات الأداء اليومية','delivered','analytics_warehouse','{"period":"2026-07-25","metrics":"daily"}','ops-02@mim-inspection.test',2600,2580),
 (16,'analytics_extract','تغذية مستودع التحليلات بمؤشرات الأداء اليومية','failed','analytics_warehouse','{"period":"2026-07-26","metrics":"daily"}','ops-02@mim-inspection.test',1600,null),
 (17,'analytics_extract','تغذية مستودع التحليلات بمؤشرات الأداء اليومية','queued','analytics_warehouse','{"period":"2026-07-27","metrics":"daily"}','ops-02@mim-inspection.test',120,null),
 (18,'evidence_bundle','مشاركة الأدلة مع فريق المراجعة الفنية','prepared',null,'{"evidence_scope":"inspection_linked","region":"أبها"}','reviewer-01@mim-inspection.test',240,null),
 (19,'device_trust_register','تزويد إدارة الأمن بسجل الأجهزة الموثوقة','delivered',null,'{"device_scope":"all","platform":"ipad_os"}','security-admin-02@mim-inspection.test',1400,1380),
 (20,'device_trust_register','تزويد إدارة الأمن بسجل الأجهزة الموثوقة','prepared',null,'{"device_scope":"suspended_only","platform":"ipad_os"}','security-admin-02@mim-inspection.test',90,null),
 (21,'access_review_pack','توثيق دورة مراجعة الصلاحيات للربع الثالث','delivered',null,'{"period":"2026-Q3","scope":"privileged_roles"}','security-admin-03@mim-inspection.test',1100,1060),
 (22,'access_review_pack','توثيق دورة مراجعة الصلاحيات للربع الثالث','queued',null,'{"period":"2026-Q3","scope":"all_roles"}','security-admin-03@mim-inspection.test',60,null),
 (23,'senaei_reconciliation_report','مطابقة سجل صناعي مع بيانات المنصة','delivered','senaei_master_data','{"period":"2026-07","entity_types":["plant","license","cr"]}','workflow-admin-01@mim-inspection.test',900,860),
 (24,'senaei_reconciliation_report','مطابقة سجل صناعي مع بيانات المنصة','dependency_blocked','senaei_master_data','{"period":"2026-07","entity_types":["address"]}','workflow-admin-01@mim-inspection.test',400,null)
)
insert into mvp3_export_jobs (id, export_kind, requested_by, purpose, status, endpoint_id, object_scope, artifact_hash, receipt, requested_at, completed_at)
select md5('saqeel-demo:mvp3_export_jobs:'||j.seq::text)::uuid,
       j.kind,
       (select u.id from auth.users u where u.email = j.requester),
       j.purpose, j.status,
       (select ep.id from mvp3_integration_endpoints ep where ep.endpoint_key = j.ep_key),
       j.scope::jsonb,
       case when j.status='delivered' then md5('saqeel-demo:artifact-a:'||j.seq::text)||md5('saqeel-demo:artifact-b:'||j.seq::text) else null end,
       case when j.status='delivered'
            then jsonb_build_object('receipt_reference','MIM-EXP-'||lpad(j.seq::text,4,'0'),'digest_algorithm','sha256','delivered',true)
            else jsonb_build_object('receipt_reference','MIM-EXP-'||lpad(j.seq::text,4,'0'),'delivered',false) end,
       timestamptz '2026-07-27 09:00:00+03' - (j.req_min || ' minutes')::interval,
       case when j.done_min is null then null else timestamptz '2026-07-27 09:00:00+03' - (j.done_min || ' minutes')::interval end
from j
on conflict do nothing;


-- ---------------------------------------------------------------------
-- 8. mvp3_access_reviews — periodic access recertification (24 rows)
--    CHECK: status='open' OR (reviewed_by IS NOT NULL
--           AND reviewed_by <> subject_user_id
--           AND length(btrim(review_reason)) >= 8).
-- ---------------------------------------------------------------------
with r(seq, subject, scope, purpose, status, opener, reviewer, reason, opened_day, due_day, reviewed_day) as (values
 (1,'security-admin-02@mim-inspection.test','role:security_admin','مراجعة دورية للصلاحيات المميزة للربع الثالث','retain','admin@mim.gov.sa','security-admin-01@mim-inspection.test','الصلاحية ما زالت مطلوبة لإدارة سجل الأجهزة الموثوقة',48,34,36),
 (2,'security-admin-03@mim-inspection.test','role:security_admin','مراجعة دورية للصلاحيات المميزة للربع الثالث','retain','admin@mim.gov.sa','security-admin-01@mim-inspection.test','الصلاحية مبررة بمهام مراجعة الوصول إلى الأدلة',48,34,35),
 (3,'compliance-admin-01@mim-inspection.test','role:compliance_admin','التحقق من ارتباط الصلاحية بالمهام الفعلية','retain','security-admin-01@mim-inspection.test','admin@mim.gov.sa','المستخدم يعتمد قرارات الالتزام بشكل مستمر',45,31,33),
 (4,'compliance-admin-02@mim-inspection.test','role:compliance_admin','التحقق من ارتباط الصلاحية بالمهام الفعلية','revoke','security-admin-01@mim-inspection.test','admin@mim.gov.sa','انتقال المستخدم إلى إدارة أخرى وانتفاء الحاجة للصلاحية',45,31,32),
 (5,'workflow-admin-01@mim-inspection.test','role:workflow_admin','مراجعة صلاحيات تعديل مسارات العمل','retain','admin@mim.gov.sa','security-admin-02@mim-inspection.test','المستخدم مسؤول عن إصدارات مسارات العمل المعتمدة',42,28,30),
 (6,'workflow-admin-02@mim-inspection.test','role:workflow_admin','مراجعة صلاحيات تعديل مسارات العمل','open','admin@mim.gov.sa',null,null,12,8,null),
 (7,'workflow-admin-03@mim-inspection.test','role:workflow_admin','مراجعة صلاحيات تعديل مسارات العمل','open','admin@mim.gov.sa',null,null,12,8,null),
 (8,'form-admin-01@mim-inspection.test','role:form_admin','مراجعة صلاحيات تحرير نماذج التفتيش','retain','security-admin-02@mim-inspection.test','admin@mim.gov.sa','المستخدم يحرّر حزم النماذج المعتمدة بشكل دوري',38,24,26),
 (9,'form-admin-02@mim-inspection.test','role:form_admin','مراجعة صلاحيات تحرير نماذج التفتيش','open','security-admin-02@mim-inspection.test',null,null,10,6,null),
 (10,'gis-admin-01@mim-inspection.test','role:gis_admin','مراجعة صلاحيات البيانات الجغرافية','retain','admin@mim.gov.sa','security-admin-03@mim-inspection.test','المستخدم يدير طبقات المناطق الصناعية المعتمدة',35,21,23),
 (11,'gis-admin-02@mim-inspection.test','role:gis_admin','مراجعة صلاحيات البيانات الجغرافية','expired','admin@mim.gov.sa','security-admin-03@mim-inspection.test','انقضت مهلة المراجعة دون رد من مالك الصلاحية',60,46,44),
 (12,'auditor-01@mim-inspection.test','role:auditor','مراجعة وصول المدققين إلى مسار التدقيق','retain','security-admin-01@mim-inspection.test','admin@mim.gov.sa','المدقق مكلّف بمراجعة الربع الثالث رسميًا',30,16,18),
 (13,'auditor-02@mim-inspection.test','role:auditor','مراجعة وصول المدققين إلى مسار التدقيق','open','security-admin-01@mim-inspection.test',null,null,9,5,null),
 (14,'auditor-03@mim-inspection.test','role:auditor','مراجعة وصول المدققين إلى مسار التدقيق','open','security-admin-01@mim-inspection.test',null,null,9,5,null),
 (15,'inspector@mim.gov.sa','scope:evidence/region/الرياض','مراجعة وصول المفتش إلى أدلة خارج نطاقه','retain','security-admin-02@mim-inspection.test','admin@mim.gov.sa','النطاق مطابق لمنطقة التكليف الحالية للمفتش',28,14,16),
 (16,'inspector1@mim.gov.sa','scope:evidence/region/الرياض','مراجعة وصول المفتش إلى أدلة خارج نطاقه','revoke','security-admin-02@mim-inspection.test','admin@mim.gov.sa','تم نقل المفتش إلى منطقة أخرى ويجب تضييق النطاق',28,14,15),
 (17,'inspector2@mim.gov.sa','scope:evidence/region/جدة','مراجعة وصول المفتش إلى أدلة خارج نطاقه','open','security-admin-02@mim-inspection.test',null,null,8,4,null),
 (18,'inspector3@mim.gov.sa','scope:evidence/region/الدمام','مراجعة وصول المفتش إلى أدلة خارج نطاقه','open','security-admin-02@mim-inspection.test',null,null,8,4,null),
 (19,'inspector4@mim.gov.sa','scope:evidence/region/مكة المكرمة','مراجعة وصول المفتش إلى أدلة خارج نطاقه','open','security-admin-03@mim-inspection.test',null,null,7,3,null),
 (20,'inspector5@mim.gov.sa','scope:evidence/region/المدينة المنورة','مراجعة وصول المفتش إلى أدلة خارج نطاقه','open','security-admin-03@mim-inspection.test',null,null,7,3,null),
 (21,'ops-01@mim-inspection.test','role:ops','مراجعة صلاحيات غرفة العمليات','retain','admin@mim.gov.sa','security-admin-01@mim-inspection.test','المستخدم ضمن جدول ورديات غرفة العمليات المعتمد',25,11,13),
 (22,'ops-02@mim-inspection.test','role:ops','مراجعة صلاحيات غرفة العمليات','open','admin@mim.gov.sa',null,null,6,2,null),
 (23,'leadership-01@mim-inspection.test','role:leadership','مراجعة وصول القيادة إلى لوحات المؤشرات','retain','security-admin-01@mim-inspection.test','admin@mim.gov.sa','الوصول مقصور على المؤشرات المجمّعة دون بيانات شخصية',22,8,10),
 (24,'risk-owner-01@mim-inspection.test','role:risk_owner','مراجعة صلاحيات مالك المخاطر','open','security-admin-01@mim-inspection.test',null,null,5,1,null)
)
insert into mvp3_access_reviews (id, subject_user_id, scope, purpose, status, opened_by, reviewed_by, review_reason, due_at, opened_at, reviewed_at)
select md5('saqeel-demo:mvp3_access_reviews:'||r.seq::text)::uuid,
       (select u.id from auth.users u where u.email = r.subject),
       r.scope, r.purpose, r.status,
       (select u.id from auth.users u where u.email = r.opener),
       (select u.id from auth.users u where u.email = r.reviewer),
       r.reason,
       timestamptz '2026-07-27 09:00:00+03' - (r.due_day || ' days')::interval,
       timestamptz '2026-07-27 09:00:00+03' - (r.opened_day || ' days')::interval,
       case when r.reviewed_day is null then null else timestamptz '2026-07-27 09:00:00+03' - (r.reviewed_day || ' days')::interval end
from r
on conflict do nothing;


-- ---------------------------------------------------------------------
-- 9. mvp3_evidence_access_grants — purpose-bound, time-boxed (24 rows)
--    CHECK: expires_at > granted_at, length(btrim(purpose)) >= 8.
-- ---------------------------------------------------------------------
with g(seq, grantee, scope, purpose, granter, granted_day, ttl_day, revoked_day) as (values
 (1,'auditor-01@mim-inspection.test','{"scope":"inspection","region":"الرياض","period":"2026-Q2"}','مراجعة أدلة دورة التفتيش للربع الثاني','security-admin-01@mim-inspection.test',26,30,null),
 (2,'auditor-02@mim-inspection.test','{"scope":"inspection","region":"جدة","period":"2026-Q2"}','مراجعة أدلة دورة التفتيش للربع الثاني','security-admin-01@mim-inspection.test',26,30,null),
 (3,'auditor-03@mim-inspection.test','{"scope":"violation","region":"الدمام","period":"2026-Q2"}','تدقيق الأدلة المرتبطة بالمخالفات الجسيمة','security-admin-01@mim-inspection.test',24,30,null),
 (4,'reviewer-01@mim-inspection.test','{"scope":"inspection","region":"الرياض","period":"2026-07"}','مراجعة فنية لتقارير التفتيش قبل الاعتماد','security-admin-02@mim-inspection.test',20,21,null),
 (5,'reviewer-02@mim-inspection.test','{"scope":"inspection","region":"مكة المكرمة","period":"2026-07"}','مراجعة فنية لتقارير التفتيش قبل الاعتماد','security-admin-02@mim-inspection.test',20,21,null),
 (6,'reviewer-03@mim-inspection.test','{"scope":"inspection","region":"المدينة المنورة","period":"2026-07"}','مراجعة فنية لتقارير التفتيش قبل الاعتماد','security-admin-02@mim-inspection.test',18,21,null),
 (7,'compliance-admin-01@mim-inspection.test','{"scope":"enforcement","region":"all","period":"2026-Q3"}','إعداد ملف الإنفاذ ورفعه للشؤون القانونية','admin@mim.gov.sa',16,45,null),
 (8,'compliance-admin-02@mim-inspection.test','{"scope":"enforcement","region":"الرياض","period":"2026-Q3"}','إعداد ملف الإنفاذ ورفعه للشؤون القانونية','admin@mim.gov.sa',16,45,null),
 (9,'compliance-admin-03@mim-inspection.test','{"scope":"enforcement","region":"جازان","period":"2026-Q3"}','إعداد ملف الإنفاذ ورفعه للشؤون القانونية','admin@mim.gov.sa',15,45,9),
 (10,'risk-owner-01@mim-inspection.test','{"scope":"factory_dossier","region":"الدمام","period":"2026-Q3"}','تحليل مخاطر المصانع عالية الأثر','security-admin-03@mim-inspection.test',14,60,null),
 (11,'risk-owner-02@mim-inspection.test','{"scope":"factory_dossier","region":"القصيم","period":"2026-Q3"}','تحليل مخاطر المصانع عالية الأثر','security-admin-03@mim-inspection.test',14,60,null),
 (12,'risk-owner-03@mim-inspection.test','{"scope":"factory_dossier","region":"تبوك","period":"2026-Q3"}','تحليل مخاطر المصانع عالية الأثر','security-admin-03@mim-inspection.test',13,60,7),
 (13,'leadership-01@mim-inspection.test','{"scope":"aggregate_only","region":"all","period":"2026-Q3"}','عرض المؤشرات المجمّعة دون بيانات شخصية','admin@mim.gov.sa',12,90,null),
 (14,'leadership-02@mim-inspection.test','{"scope":"aggregate_only","region":"all","period":"2026-Q3"}','عرض المؤشرات المجمّعة دون بيانات شخصية','admin@mim.gov.sa',12,90,null),
 (15,'ops-01@mim-inspection.test','{"scope":"live_operations","region":"all","period":"2026-07"}','متابعة الزيارات الجارية من غرفة العمليات','security-admin-01@mim-inspection.test',10,14,null),
 (16,'ops-02@mim-inspection.test','{"scope":"live_operations","region":"all","period":"2026-07"}','متابعة الزيارات الجارية من غرفة العمليات','security-admin-01@mim-inspection.test',10,14,null),
 (17,'ops-03@mim-inspection.test','{"scope":"live_operations","region":"all","period":"2026-07"}','متابعة الزيارات الجارية من غرفة العمليات','security-admin-01@mim-inspection.test',9,14,4),
 (18,'planner-01@mim-inspection.test','{"scope":"planning_context","region":"الرياض","period":"2026-08"}','إعداد خطة الزيارات للشهر القادم','security-admin-02@mim-inspection.test',8,30,null),
 (19,'planner-02@mim-inspection.test','{"scope":"planning_context","region":"جدة","period":"2026-08"}','إعداد خطة الزيارات للشهر القادم','security-admin-02@mim-inspection.test',8,30,null),
 (20,'planner-03@mim-inspection.test','{"scope":"planning_context","region":"الدمام","period":"2026-08"}','إعداد خطة الزيارات للشهر القادم','security-admin-02@mim-inspection.test',7,30,null),
 (21,'inspector@mim.gov.sa','{"scope":"assigned_visits","region":"الرياض","period":"2026-07"}','الاطلاع على أدلة الزيارات المسندة للمفتش','ops@mim.gov.sa',6,7,null),
 (22,'inspector-01@mim-inspection.test','{"scope":"assigned_visits","region":"الدمام","period":"2026-07"}','الاطلاع على أدلة الزيارات المسندة للمفتش','ops@mim.gov.sa',6,7,null),
 (23,'inspector-02@mim-inspection.test','{"scope":"assigned_visits","region":"مكة المكرمة","period":"2026-07"}','الاطلاع على أدلة الزيارات المسندة للمفتش','ops@mim.gov.sa',5,7,2),
 (24,'auditor.test@mim.gov.sa','{"scope":"audit_trail","region":"all","period":"2026-Q2"}','تدقيق مسار الأحداث للأنظمة الإدارية','admin@mim.gov.sa',4,30,null)
)
insert into mvp3_evidence_access_grants (id, grantee_user_id, evidence_scope, purpose, granted_by, granted_at, expires_at, revoked_at)
select md5('saqeel-demo:mvp3_evidence_access_grants:'||g.seq::text)::uuid,
       (select u.id from auth.users u where u.email = g.grantee),
       g.scope::jsonb, g.purpose,
       (select u.id from auth.users u where u.email = g.granter),
       timestamptz '2026-07-27 09:00:00+03' - (g.granted_day || ' days')::interval,
       timestamptz '2026-07-27 09:00:00+03' - (g.granted_day || ' days')::interval + (g.ttl_day || ' days')::interval,
       case when g.revoked_day is null then null else timestamptz '2026-07-27 09:00:00+03' - (g.revoked_day || ' days')::interval end
from g
on conflict do nothing;


-- ---------------------------------------------------------------------
-- 10. external_source_connections — upstream source registry (3 rows)
--     Configuration is not connectivity: the production row stays
--     not_configured with no origin, and is disabled.
--     CHECK: base_url_origin ~ '^https://[^/?#]+$'.
-- ---------------------------------------------------------------------
with c(provider_key, environment, contract, origin, auth_mode, cfg_status, enabled, validated_day, created_day) as (values
 ('senaei','staging','v2.4','https://senaei-staging.mim.gov.sa','bearer','validated',true,2,240),
 ('senaei','production','v2.4',null,null,'not_configured',false,null,240),
 ('senaei_public_v3','staging','v3.0','https://senaei-staging.mim.gov.sa','none','configured',true,11,236)
)
insert into external_source_connections (id, provider_key, environment, contract_version, base_url_origin, auth_mode, configuration_status, enabled, last_validated_at, created_at, updated_at)
select md5('saqeel-demo:external_source_connections:'||c.provider_key||':'||c.environment)::uuid,
       c.provider_key, c.environment, c.contract, c.origin, c.auth_mode, c.cfg_status, c.enabled,
       case when c.validated_day is null then null else timestamptz '2026-07-27 09:00:00+03' - (c.validated_day || ' days')::interval end,
       timestamptz '2026-07-27 09:00:00+03' - (c.created_day || ' days')::interval,
       timestamptz '2026-07-27 09:00:00+03' - (coalesce(c.validated_day, c.created_day) || ' days')::interval
from c
on conflict do nothing;


-- ---------------------------------------------------------------------
-- 11. senaei_sync_runs — recorded sync runs (23 rows)
--     CHECK: rows_accepted + rows_rejected <= rows_received
--     CHECK: completed_at >= started_at when both are present.
-- ---------------------------------------------------------------------
with r(seq, prov, env, mode, status, contract, requester, fname, recv, acc, rej, start_min, done_min) as (values
 (1,'senaei','staging','api','completed','v2.4','workflow-admin-01@mim-inspection.test',null,412,412,0,41760,41700),
 (2,'senaei','staging','api','completed','v2.4','workflow-admin-01@mim-inspection.test',null,398,395,3,40320,40265),
 (3,'senaei','staging','api','partial','v2.4','workflow-admin-01@mim-inspection.test',null,405,381,24,38880,38810),
 (4,'senaei','staging','api','completed','v2.4','workflow-admin-02@mim-inspection.test',null,417,417,0,37440,37380),
 (5,'senaei','staging','api','failed','v2.4','workflow-admin-02@mim-inspection.test',null,0,0,0,36000,35985),
 (6,'senaei','staging','api','completed','v2.4','workflow-admin-02@mim-inspection.test',null,420,414,6,34560,34495),
 (7,'senaei','staging','api','partial','v2.4','compliance-admin-01@mim-inspection.test',null,433,402,31,31680,31600),
 (8,'senaei','staging','api','completed','v2.4','compliance-admin-01@mim-inspection.test',null,428,428,0,28800,28740),
 (9,'senaei','staging','api','completed','v2.4','compliance-admin-01@mim-inspection.test',null,431,427,4,25920,25860),
 (10,'senaei','staging','api','dependency_blocked','v2.4','workflow-admin-01@mim-inspection.test',null,0,0,0,23040,23035),
 (11,'senaei','staging','api','completed','v2.4','workflow-admin-01@mim-inspection.test',null,436,432,4,20160,20095),
 (12,'senaei','staging','api','partial','v2.4','workflow-admin-03@mim-inspection.test',null,440,409,31,17280,17200),
 (13,'senaei','staging','api','completed','v2.4','workflow-admin-03@mim-inspection.test',null,442,442,0,14400,14340),
 (14,'senaei','staging','api','running','v2.4','workflow-admin-03@mim-inspection.test',null,188,171,9,45,null),
 (15,'senaei','staging','csv_import','completed','v2.4','compliance-admin-02@mim-inspection.test','senaei-plants-2026-06-29.csv',1240,1236,4,39600,39480),
 (16,'senaei','staging','csv_import','partial','v2.4','compliance-admin-02@mim-inspection.test','senaei-licences-2026-07-04.csv',1071,1013,58,33120,32960),
 (17,'senaei','staging','csv_import','completed','v2.4','compliance-admin-02@mim-inspection.test','senaei-commercial-registrations-2026-07-09.csv',1340,1329,11,26640,26480),
 (18,'senaei','staging','csv_import','failed','v2.4','compliance-admin-03@mim-inspection.test','senaei-plants-2026-07-14.csv',0,0,0,19440,19430),
 (19,'senaei','staging','csv_import','completed','v2.4','compliance-admin-03@mim-inspection.test','senaei-plants-2026-07-15.csv',1252,1244,8,18000,17860),
 (20,'senaei','staging','csv_import','cancelled','v2.4','compliance-admin-03@mim-inspection.test','senaei-licences-2026-07-21.csv',0,0,0,8640,8630),
 (21,'senaei_public_v3','staging','api','completed','v3.0','workflow-admin-02@mim-inspection.test',null,264,264,0,11520,11470),
 (22,'senaei_public_v3','staging','api','partial','v3.0','workflow-admin-02@mim-inspection.test',null,271,248,23,5760,5700),
 (23,'senaei_public_v3','staging','api','queued','v3.0','workflow-admin-02@mim-inspection.test',null,0,0,0,null,null)
)
insert into senaei_sync_runs (id, connection_id, mode, status, correlation_id, contract_version, requested_by, source_file_name, source_file_sha256, rows_received, rows_accepted, rows_rejected, started_at, completed_at, created_at)
select md5('saqeel-demo:senaei_sync_runs:'||r.seq::text)::uuid,
       (select ec.id from external_source_connections ec where ec.provider_key=r.prov and ec.environment=r.env),
       r.mode, r.status,
       md5('saqeel-demo:senaei_sync_runs:corr:'||r.seq::text)::uuid,
       r.contract,
       (select u.id from auth.users u where u.email=r.requester),
       r.fname,
       case when r.fname is null then null else md5('saqeel-demo:file-a:'||r.seq::text)||md5('saqeel-demo:file-b:'||r.seq::text) end,
       r.recv, r.acc, r.rej,
       case when r.start_min is null then null else timestamptz '2026-07-27 09:00:00+03' - (r.start_min || ' minutes')::interval end,
       case when r.done_min is null then null else timestamptz '2026-07-27 09:00:00+03' - (r.done_min || ' minutes')::interval end,
       timestamptz '2026-07-27 09:00:00+03' - (coalesce(r.start_min, 5) + 3 || ' minutes')::interval
from r
on conflict do nothing;


-- ---------------------------------------------------------------------
-- 12. senaei_sync_calls — live-call verification records (66 rows)
--     endpoint_key values are taken verbatim from the governed contract in
--     apps/web/src/lib/integrations/senaei/contract.ts so the SENAI console
--     can resolve every documented endpoint to a recorded call.
--     The queued run records no call — absence stays absence.
--     The outbound submission endpoint is always dependency_blocked
--     (BLOCKED_TRIGGER_DECISION) — it is governed off at the adapter.
-- ---------------------------------------------------------------------
with keys(idx, k) as (values
 (1,'POST /api/inspection/{session}'),
 (2,'GET /api/inspection/profile'),
 (3,'GET /api/inspection/regulations'),
 (4,'GET /api/inspection/tasks'),
 (5,'GET /api/inspection/tasks/production-line'),
 (6,'GET /api/inspection/tasks/{task}'),
 (7,'GET /api/v3/inspection/plants'),
 (8,'GET /api/v3/inspection/plants/{plant}/chemical-permits'),
 (9,'GET /api/v3/inspection/plants/{plant}/customs-exemptions'),
 (10,'POST /api/inspection/tasks/submit-inspection/{task}')
), src as (
  select r.id as run_id, r.status as run_status,
         coalesce(r.started_at, r.created_at) as anchor,
         (row_number() over (order by r.created_at))::int as rn,
         s.k as step
  from senaei_sync_runs r
  cross join generate_series(1,3) as s(k)
  where r.status <> 'queued'
), joined as (
  select src.*, keys.k as endpoint_key
  from src join keys on keys.idx = ((src.rn * 3 + src.step) % 10) + 1
)
insert into senaei_sync_calls (id, sync_run_id, endpoint_key, http_method, request_id, outcome, http_status, safe_error_code, response_sha256, occurred_at)
select md5('saqeel-demo:senaei_sync_calls:'||j.run_id::text||':'||j.step::text)::uuid,
       j.run_id, j.endpoint_key,
       case when j.endpoint_key like 'POST %' then 'POST' else 'GET' end,
       'REQ-'||upper(substr(md5('saqeel-demo:req:'||j.run_id::text||':'||j.step::text),1,12)),
       case
         when j.endpoint_key = 'POST /api/inspection/tasks/submit-inspection/{task}' then 'dependency_blocked'
         when j.run_status = 'failed' then 'failed'
         when j.run_status = 'dependency_blocked' then 'dependency_blocked'
         when j.run_status = 'partial' and j.step = 3 then 'rejected'
         when j.run_status = 'cancelled' and j.step > 1 then 'rejected'
         else 'accepted' end,
       case
         when j.endpoint_key = 'POST /api/inspection/tasks/submit-inspection/{task}' then null
         when j.run_status = 'failed' then 504
         when j.run_status = 'dependency_blocked' then null
         when j.run_status = 'partial' and j.step = 3 then 422
         when j.run_status = 'cancelled' and j.step > 1 then 409
         else 200 end,
       case
         when j.endpoint_key = 'POST /api/inspection/tasks/submit-inspection/{task}' then 'BLOCKED_TRIGGER_DECISION'
         when j.run_status = 'failed' then 'UPSTREAM_TIMEOUT'
         when j.run_status = 'dependency_blocked' then 'PROVIDER_NOT_CONFIGURED'
         when j.run_status = 'partial' and j.step = 3 then 'CONTRACT_MISMATCH'
         when j.run_status = 'cancelled' and j.step > 1 then 'RUN_CANCELLED_BY_OPERATOR'
         else null end,
       case
         when j.endpoint_key = 'POST /api/inspection/tasks/submit-inspection/{task}' then null
         when j.run_status in ('failed','dependency_blocked') then null
         else md5('saqeel-demo:resp-a:'||j.run_id::text||':'||j.step::text)||md5('saqeel-demo:resp-b:'||j.run_id::text||':'||j.step::text) end,
       j.anchor + (j.step * 4 || ' minutes')::interval
from joined j
on conflict do nothing;


-- ---------------------------------------------------------------------
-- 13. senaei_raw_snapshots — immutable upstream payload captures (32 rows)
--     Payloads are projected from real staging factories / licences / CRs so
--     that reconciliation records point at coherent local rows.
--     UNIQUE (sync_run_id, entity_type, payload_sha256).
-- ---------------------------------------------------------------------
with runs_pool as (
  select id, created_at, (row_number() over (order by created_at))::int as rn
  from senaei_sync_runs where status in ('completed','partial')
), run_count as (select count(*)::int c from runs_pool),
fac as (
  select id, factory_code, name, region, city, license_number, cr_number,
         (row_number() over (order by factory_code))::int as rn
  from factories where factory_code is not null order by factory_code limit 12
),
lic as (
  select id, license_number, plant_number, license_type, status, holder_name,
         (row_number() over (order by license_number))::int as rn
  from industrial_licenses where license_number is not null order by license_number limit 10
),
cr as (
  select id, cr_number, unified_number, legal_name_ar, status,
         (row_number() over (order by cr_number))::int as rn
  from commercial_registrations where cr_number is not null order by cr_number limit 10
),
items(entity_type, ord, external_id, payload) as (
  select 'plant', fac.rn, 'SENAEI-PLT-'||fac.factory_code,
         jsonb_build_object('external_id','SENAEI-PLT-'||fac.factory_code,'plant_name',fac.name,'region',fac.region,'city',fac.city,'licence_number',fac.license_number,'cr_number',fac.cr_number,'source','senaei')
  from fac
  union all
  select 'industrial_license', 100 + lic.rn, 'SENAEI-LIC-'||lic.license_number,
         jsonb_build_object('external_id','SENAEI-LIC-'||lic.license_number,'plant_number',lic.plant_number,'licence_type',lic.license_type,'status',lic.status,'holder_name',lic.holder_name,'source','senaei')
  from lic
  union all
  select 'commercial_registration', 200 + cr.rn, 'SENAEI-CR-'||cr.cr_number,
         jsonb_build_object('external_id','SENAEI-CR-'||cr.cr_number,'unified_number',cr.unified_number,'legal_name_ar',cr.legal_name_ar,'status',cr.status,'source','senaei')
  from cr
),
placed as (
  select i.*, rp.id as run_id, rp.created_at as run_created,
         (row_number() over (order by i.ord))::int as gseq
  from items i
  join run_count rc on true
  join runs_pool rp on rp.rn = ((i.ord % rc.c) + 1)
)
insert into senaei_raw_snapshots (id, sync_run_id, sync_call_id, entity_type, external_id, payload, payload_sha256, captured_at)
select md5('saqeel-demo:senaei_raw_snapshots:'||p.entity_type||':'||p.external_id)::uuid,
       p.run_id,
       (select sc.id from senaei_sync_calls sc where sc.sync_run_id = p.run_id order by sc.occurred_at limit 1),
       p.entity_type, p.external_id, p.payload,
       md5('saqeel-demo:snap-a:'||p.external_id)||md5('saqeel-demo:snap-b:'||p.external_id),
       p.run_created + interval '6 minutes'
from placed p
on conflict do nothing;


-- ---------------------------------------------------------------------
-- 14. senaei_reconciliation_records — 26 rows, 14 unresolved divergences
--     (8 conflict, 4 rejected, 2 dependency_blocked) which is what the
--     "Sync & reconcile" tab surfaces.
--     CHECK: outcome not in (rejected, conflict, dependency_blocked)
--            requires raw_snapshot_id IS NOT NULL.
-- ---------------------------------------------------------------------
with s as (
  select rs.id as snap_id, rs.sync_run_id, rs.entity_type, rs.external_id, rs.captured_at,
         (row_number() over (order by rs.entity_type, rs.external_id))::int as rn
  from senaei_raw_snapshots rs
  order by rs.entity_type, rs.external_id
  limit 26
), m as (
  select s.*,
    case (s.rn % 13)
      when 0 then 'conflict' when 1 then 'matched' when 2 then 'updated' when 3 then 'conflict'
      when 4 then 'unchanged' when 5 then 'rejected' when 6 then 'matched' when 7 then 'conflict'
      when 8 then 'updated' when 9 then 'rejected' when 10 then 'dependency_blocked'
      when 11 then 'created' else 'conflict' end as outcome
  from s
)
insert into senaei_reconciliation_records (id, sync_run_id, raw_snapshot_id, entity_type, external_id, outcome, commercial_registration_id, industrial_license_id, factory_id, safe_reason_codes, reconciled_by, reconciled_at)
select md5('saqeel-demo:senaei_reconciliation_records:'||m.external_id)::uuid,
       m.sync_run_id, m.snap_id, m.entity_type, m.external_id, m.outcome,
       case when m.entity_type='commercial_registration'
            then (select cr.id from commercial_registrations cr where 'SENAEI-CR-'||cr.cr_number = m.external_id) end,
       case when m.entity_type='industrial_license'
            then (select il.id from industrial_licenses il where 'SENAEI-LIC-'||il.license_number = m.external_id limit 1) end,
       case when m.entity_type='plant'
            then (select f.id from factories f where 'SENAEI-PLT-'||f.factory_code = m.external_id limit 1) end,
       case m.outcome
         when 'conflict' then array['FIELD_DIVERGENCE','LOCAL_EDIT_NEWER']
         when 'rejected' then array['SCHEMA_MISMATCH']
         when 'dependency_blocked' then array['PROVIDER_NOT_CONFIGURED']
         when 'updated' then array['FIELD_UPDATED']
         when 'created' then array['NEW_ENTITY']
         else array[]::text[] end,
       case when m.outcome in ('conflict','rejected','dependency_blocked')
            then (select u.id from auth.users u where u.email = case when m.rn % 2 = 0 then 'compliance-admin-01@mim-inspection.test' else 'workflow-admin-01@mim-inspection.test' end)
            else null end,
       m.captured_at + interval '9 minutes'
from m
on conflict do nothing;


-- ---------------------------------------------------------------------
-- 15. mvp3_inspection_package_manifests — compiled offline packages (18 rows)
--     UNIQUE (inspection_id), UNIQUE (manifest_hash),
--     CHECK: manifest_hash ~ '^[0-9a-f]{64}$', expires_at > compiled_at.
-- ---------------------------------------------------------------------
with pv as (select id, version_label, (row_number() over (order by version_label))::int rn from package_versions),
     pvc as (select count(*)::int c from pv),
     cv as (select id from config_versions order by id limit 1),
     ins as (
       select i.id, i.inspection_no, i.package_version_id, v.factory_id, f.name as factory_name, f.region,
              (row_number() over (order by i.inspection_no))::int as rn
       from inspections i
       left join visits v on v.id = i.visit_id
       left join factories f on f.id = v.factory_id
       -- The guard ignores rows this seed owns, so the candidate set is the
       -- same on every run (a plain NOT EXISTS would select the *next* 18
       -- inspections each time and grow the table without bound).
       where not exists (
         select 1 from mvp3_inspection_package_manifests m
         where m.inspection_id = i.id
           and m.id <> md5('saqeel-demo:mvp3_inspection_package_manifests:'||i.id::text)::uuid)
         -- Hard cap: once this seed owns its 18 rows the statement is a no-op,
         -- even if `inspections` has grown since the first run.
         and (select count(*) from mvp3_inspection_package_manifests m2
              where m2.id = md5('saqeel-demo:mvp3_inspection_package_manifests:'||m2.inspection_id::text)::uuid) < 18
       order by i.inspection_no
       limit 18
     )
insert into mvp3_inspection_package_manifests (id, inspection_id, package_version_id, workflow_version_id, manifest, manifest_hash, expires_at, compiled_by, compiled_at)
select md5('saqeel-demo:mvp3_inspection_package_manifests:'||ins.id::text)::uuid,
       ins.id,
       coalesce(ins.package_version_id, (select pv.id from pv join pvc on true where pv.rn = ((ins.rn % pvc.c) + 1))),
       (select id from cv),
       jsonb_build_object(
         'inspection_no', ins.inspection_no,
         'factory_name', ins.factory_name,
         'region', ins.region,
         'items', jsonb_build_array(
            jsonb_build_object('kind','checklist','ref','package_version'),
            jsonb_build_object('kind','regulation_set','ref','published'),
            jsonb_build_object('kind','factory_dossier','ref','factory_360')),
         'offline_ttl_hours', 72,
         'compiled_for','ipad_os'),
       md5('saqeel-demo:manifest-a:'||ins.id::text)||md5('saqeel-demo:manifest-b:'||ins.id::text),
       timestamptz '2026-07-27 09:00:00+03' - ((ins.rn * 90) || ' minutes')::interval + interval '72 hours',
       (select u.id from auth.users u where u.email = 'ops@mim.gov.sa'),
       timestamptz '2026-07-27 09:00:00+03' - ((ins.rn * 90) || ' minutes')::interval
from ins
on conflict do nothing;


-- ---------------------------------------------------------------------
-- 16. mvp3_package_access_events — device-gate outcomes (20 rows)
--     Every denial reason is expressed as a distinct outcome value; the
--     denied_missing rows carry no device_id because the requesting device
--     is not in the trust register at all.
-- ---------------------------------------------------------------------
with man as (
  select m.id, m.compiled_at, (row_number() over (order by m.compiled_at))::int rn
  from mvp3_inspection_package_manifests m
), ev as (
  select man.id as manifest_id, man.compiled_at, man.rn, s.step,
         case ((man.rn + s.step) % 8)
           when 0 then 'opened' when 1 then 'opened' when 2 then 'denied_untrusted'
           when 3 then 'opened' when 4 then 'denied_expired' when 5 then 'denied_unassigned'
           when 6 then 'denied_app_version' else 'denied_missing' end as outcome
  from man cross join generate_series(1,2) as s(step)
  where s.step = 1 or man.rn <= 2
), trusted as (
  select id, device_identifier, assigned_user_id, (row_number() over (order by device_identifier))::int rn
  from mvp3_devices where trust_status='trusted' and platform='ipad_os'
), tc as (select count(*)::int c from trusted),
dev as (
  select ev.*,
    case ev.outcome
      when 'denied_untrusted' then (select d.id from mvp3_devices d where d.trust_status='suspended' order by d.device_identifier limit 1)
      when 'denied_app_version' then (select d.id from mvp3_devices d where d.app_version_compliant=false and d.trust_status='pending' and d.mdm_reference is not null order by d.device_identifier limit 1)
      when 'denied_unassigned' then (select d.id from mvp3_devices d where d.assigned_user_id is null order by d.device_identifier limit 1)
      when 'denied_missing' then null
      else (select t.id from trusted t join tc on true where t.rn = ((ev.rn % tc.c) + 1))
    end as device_id
  from ev
)
insert into mvp3_package_access_events (id, manifest_id, device_id, requested_device_identifier, actor_id, outcome, reason, occurred_at)
select md5('saqeel-demo:mvp3_package_access_events:'||dev.manifest_id::text||':'||dev.step::text)::uuid,
       dev.manifest_id, dev.device_id,
       coalesce((select d.device_identifier from mvp3_devices d where d.id = dev.device_id), 'MIM-IPAD-UNREGISTERED-0000'),
       coalesce((select d.assigned_user_id from mvp3_devices d where d.id = dev.device_id),
                (select u.id from auth.users u where u.email='ops@mim.gov.sa')),
       dev.outcome,
       case dev.outcome
         when 'opened' then 'فتح حزمة التفتيش على جهاز موثوق ومسند للمفتش'
         when 'denied_untrusted' then 'الجهاز في حالة إيقاف ولا يجوز فتح الحزم الرسمية عليه'
         when 'denied_unassigned' then 'الجهاز غير مسند لأي مفتش وقت الطلب'
         when 'denied_expired' then 'انتهت صلاحية الحزمة قبل محاولة الفتح'
         when 'denied_app_version' then 'إصدار التطبيق على الجهاز غير مطابق للسياسة المعتمدة'
         else 'الجهاز غير مسجل في سجل الأجهزة الموثوقة' end,
       dev.compiled_at + ((dev.step * 37) || ' minutes')::interval
from dev
on conflict do nothing;


-- ---------------------------------------------------------------------
-- 17. signature_acts — 24 new acts (14 refusals, 10 signatures)
--     Table is append-only (block_signature_mutation on UPDATE/DELETE).
-- ---------------------------------------------------------------------
with sv as (select id, (row_number() over (order by id))::int rn from submission_versions order by id limit 24),
     reps as (select id, (row_number() over (order by id))::int rn from factory_representatives),
     repc as (select count(*)::int c from reps),
     insp(rn, email) as (values (1,'inspector@mim.gov.sa'),(2,'inspector1@mim.gov.sa'),(3,'inspector2@mim.gov.sa'),(4,'inspector3@mim.gov.sa'),(5,'inspector4@mim.gov.sa'),(6,'inspector5@mim.gov.sa'),(7,'inspector-01@mim-inspection.test'),(8,'inspector-02@mim-inspection.test'),(9,'inspector-03@mim-inspection.test')),
     n as (select generate_series(1,24)::int as seq)
insert into signature_acts (id, submission_version_id, kind, method, outcome, verification_status, report_hash, actor_rep, actor_user, created_at)
select md5('saqeel-demo:signature_acts:'||n.seq::text)::uuid,
       (select sv.id from sv where sv.rn = n.seq),
       case when n.seq <= 14 then 'refusal' else 'signature' end,
       case when n.seq <= 14 then null
            when n.seq % 3 = 0 then 'pki'
            when n.seq % 3 = 1 then 'on_device'
            else 'acknowledgement' end,
       case when n.seq <= 14 then 'refused'
            when n.seq = 23 then 'failed'
            when n.seq = 24 then 'queued'
            else 'captured' end,
       case when n.seq <= 14 then 'unavailable'
            when n.seq = 23 then 'failed'
            when n.seq = 24 then 'pending'
            when n.seq % 3 = 0 then 'verified'
            when n.seq % 3 = 1 then 'unverified'
            else 'unavailable' end,
       case when n.seq > 14 and n.seq % 3 = 0 then md5('saqeel-demo:sig-a:'||n.seq::text)||md5('saqeel-demo:sig-b:'||n.seq::text) else null end,
       case when n.seq % 2 = 0 then (select reps.id from reps join repc on true where reps.rn = ((n.seq % repc.c) + 1)) else null end,
       (select u.id from auth.users u where u.email = (select insp.email from insp where insp.rn = ((n.seq % 9) + 1))),
       timestamptz '2026-07-27 09:00:00+03' - ((n.seq * 1237) || ' minutes')::interval
from n
on conflict do nothing;


-- ---------------------------------------------------------------------
-- 18. mvp3_signature_refusals — refusal record per refusal act (14 rows)
--     CHECK: refusal_reason and inspector_statement each >= 8 chars.
--     UNIQUE (signature_act_id). Append-only.
-- ---------------------------------------------------------------------
with acts as (
  select sa.id, sa.created_at, sa.actor_user, (row_number() over (order by sa.created_at))::int rn
  from signature_acts sa
  where sa.kind='refusal' and sa.outcome='refused'
    and sa.id in (select md5('saqeel-demo:signature_acts:'||g::text)::uuid from generate_series(1,14) g)
), devs as (
  select id, device_identifier, app_version, assigned_user_id, (row_number() over (order by device_identifier))::int rn
  from mvp3_devices where platform='ipad_os'
), dc as (select count(*)::int c from devs),
reasons(rn, reason, statement, witness, continuation, region, lat, lng) as (values
 (1,'امتناع ممثل المنشأة عن التوقيع لحين مراجعة الإدارة القانونية','دوّنت الملاحظات وعرضت التقرير على الممثل وأثبت رفضه أمامي','فهد عبدالله الحربي — مشرف الإنتاج','report_finalised_with_refusal_note','الرياض',24.7136,46.6753),
 (2,'اعتراض الممثل على وصف المخالفة الوارد في التقرير','قرأت بنود المخالفة على الممثل وأصر على رفض التوقيع','ماجد سعد العتيبي — مدير المصنع','escalate_to_supervisor','الرياض',24.6408,46.7728),
 (3,'عدم حضور مفوض بالتوقيع أثناء الزيارة','تعذّر حضور مفوض معتمد رغم الانتظار المقرر','سالم ناصر الدوسري — مسؤول السلامة','proceed_without_signature','جدة',21.4858,39.1925),
 (4,'رفض الممثل التوقيع قبل استشارة مالك المنشأة','أبلغت الممثل بأن الرفض يُوثّق ولا يوقف الإجراء','هيثم رائد باناجه — مسؤول الجودة','report_finalised_with_refusal_note','جدة',21.5433,39.1728),
 (5,'اعتراض على نتيجة القياس الميداني للانبعاثات','عرضت قراءة الجهاز وصورة العداد على الممثل','عبدالرحمن خالد القحطاني — مهندس التشغيل','escalate_to_supervisor','الدمام',26.4207,50.0888),
 (6,'الممثل غير مخوّل بالتوقيع نيابة عن المنشأة','تحققت من التفويض ولم يكن ساريًا وقت الزيارة','نايف مبارك الشمري — مشرف الوردية','proceed_without_signature','الدمام',26.3927,50.1912),
 (7,'رفض التوقيع اعتراضًا على مدة المهلة التصحيحية','أوضحت أن المهلة تصدر بقرار لاحق وليست في التقرير','بدر سليمان الغامدي — مدير العمليات','escalate_to_supervisor','مكة المكرمة',21.3891,39.8579),
 (8,'انسحاب الممثل قبل إتمام إجراء التوقيع','أثبتّ انسحاب الممثل وحضور الشاهد على الواقعة','تركي حمد المالكي — أمين المستودع','report_finalised_with_refusal_note','مكة المكرمة',21.4267,39.8261),
 (9,'اعتراض على تصنيف المخالفة كمخالفة جسيمة','بيّنت للممثل مرجع التصنيف في اللائحة المعتمدة','وليد فيصل الزهراني — مدير الالتزام','escalate_to_supervisor','المدينة المنورة',24.5247,39.5692),
 (10,'رفض التوقيع لعدم توفر نسخة ورقية من التقرير','أوضحت أن النسخة الرسمية تُسلّم إلكترونيًا','سعود عايض البقمي — مسؤول الشؤون الإدارية','proceed_without_signature','المدينة المنورة',24.4672,39.6142),
 (11,'اعتراض على دخول المفتش لمنطقة الإنتاج المقيدة','وثّقت التنسيق المسبق مع إدارة السلامة قبل الدخول','مشعل ظافر العسيري — مسؤول السلامة','escalate_to_supervisor','أبها',18.2465,42.5117),
 (12,'رفض التوقيع لحين مراجعة المستشار القانوني للمنشأة','أبلغت الممثل بأن المراجعة اللاحقة لا تعلّق التوثيق','راكان عوض الرويلي — مدير الفرع','report_finalised_with_refusal_note','تبوك',28.3838,36.5550),
 (13,'اعتراض على عدد بنود المخالفة المسجلة في الزيارة','راجعت البنود بندًا بندًا مع الممثل قبل الإثبات','ياسر مطلق الحارثي — مشرف الصيانة','escalate_to_supervisor','القصيم',26.3260,43.9750),
 (14,'رفض التوقيع دون إبداء سبب من ممثل المنشأة','عرضت التقرير ثلاث مرات وأثبت الرفض بحضور الشاهد','هاني جابر الفيفي — مسؤول الاستقبال','report_finalised_with_refusal_note','جازان',16.8894,42.5706)
)
insert into mvp3_signature_refusals (id, signature_act_id, refusal_reason, witness_name, inspector_statement, device_context, location_context, workflow_continuation, recorded_by, recorded_at)
select md5('saqeel-demo:mvp3_signature_refusals:'||acts.id::text)::uuid,
       acts.id, r.reason, r.witness, r.statement,
       jsonb_build_object(
         'device_identifier', (select d.device_identifier from devs d join dc on true where d.rn = ((acts.rn % dc.c) + 1)),
         'platform','ipad_os',
         'app_version', (select d.app_version from devs d join dc on true where d.rn = ((acts.rn % dc.c) + 1)),
         'connectivity', case when acts.rn % 3 = 0 then 'offline' else 'online' end),
       jsonb_build_object('region', r.region, 'lat', r.lat, 'lng', r.lng, 'accuracy_m', 8 + (acts.rn % 5), 'source','device_gnss'),
       r.continuation,
       acts.actor_user,
       acts.created_at + interval '6 minutes'
from acts join reasons r on r.rn = acts.rn
on conflict do nothing;


-- ---------------------------------------------------------------------
-- 19. ai_events — append-only advisory log (+75 proposed events)
--     Only the two event_type values the application itself writes
--     ('proposed', 'disposed') are used; no new vocabulary is invented.
--     ai_events is append-only (block_ai_event_mutation).
--     The 'disposed' pass is a no-op on the current staging dataset — every
--     disposed suggestion already carries its event — but it is kept so the
--     file is complete for a fresh environment.
-- ---------------------------------------------------------------------
with cand as (
  select s.id, s.surface, s.created_at, (row_number() over (order by s.created_at, s.id))::int rn
  from ai_suggestions s
  -- Guard ignores seed-owned events so the candidate set is run-invariant.
  where not exists (
    select 1 from ai_events e
    where e.suggestion_id = s.id and e.event_type='proposed'
      and e.id <> md5('saqeel-demo:ai_events:proposed:'||s.id::text)::uuid)
  -- Hard cap: no-op once this seed owns its 75 events.
  and (select count(*) from ai_events e2
       where e2.id = md5('saqeel-demo:ai_events:proposed:'||e2.suggestion_id::text)::uuid) < 75
  order by s.created_at, s.id
  limit 75
), actors(rn, email) as (values (1,'inspector@mim.gov.sa'),(2,'inspector1@mim.gov.sa'),(3,'inspector2@mim.gov.sa'),(4,'planner@mim.gov.sa'),(5,'ops@mim.gov.sa'))
insert into ai_events (id, suggestion_id, event_type, actor, payload, created_at)
select md5('saqeel-demo:ai_events:proposed:'||cand.id::text)::uuid,
       cand.id, 'proposed',
       (select u.id from auth.users u where u.email = (select a.email from actors a where a.rn = ((cand.rn % 5) + 1))),
       jsonb_build_object('surface', cand.surface, 'source', 'gemini'),
       cand.created_at + interval '2 seconds'
from cand
on conflict do nothing;

with cand as (
  select s.id, s.surface, s.disposition, s.disposed_by, s.disposed_reason,
         coalesce(s.disposed_at, s.created_at + interval '4 minutes') as at
  from ai_suggestions s
  where s.disposition <> 'proposed'
    and not exists (select 1 from ai_events e where e.suggestion_id = s.id and e.event_type='disposed')
)
insert into ai_events (id, suggestion_id, event_type, actor, payload, created_at)
select md5('saqeel-demo:ai_events:disposed:'||cand.id::text)::uuid,
       cand.id, 'disposed', cand.disposed_by,
       jsonb_build_object('to', cand.disposition, 'reason', coalesce(cand.disposed_reason, 'مراجعة بشرية: الاقتراح غير منطبق على هذه الحالة')),
       cand.at
from cand
on conflict do nothing;


-- ---------------------------------------------------------------------
-- 20. ocr_extractions — document capture outcomes (+24 rows)
--     Status mix deliberately includes no_text_found / failed / unavailable
--     so the surface shows real degradation, not only success.
-- ---------------------------------------------------------------------
with cand as (
  select e.id, e.evidence_type, e.captured_at, e.captured_by,
         (row_number() over (order by (case e.evidence_type when 'document' then 0 when 'photo' then 1 else 2 end), e.captured_at, e.id))::int rn
  from evidence e
  where e.deleted_at is null
    and e.evidence_type in ('document','photo')
    -- Guard ignores seed-owned extractions so the candidate set is run-invariant.
    and not exists (
      select 1 from ocr_extractions o
      where o.evidence_id = e.id
        and o.id <> md5('saqeel-demo:ocr_extractions:'||e.id::text)::uuid)
    -- Hard cap: `evidence` grows from other seeds, so "first N" would otherwise
    -- drift. Once this seed owns 24 rows the statement is a no-op.
    and (select count(*) from ocr_extractions o2
         where o2.id = md5('saqeel-demo:ocr_extractions:'||o2.evidence_id::text)::uuid) < 24
  order by (case e.evidence_type when 'document' then 0 when 'photo' then 1 else 2 end), e.captured_at, e.id
  limit 24
)
insert into ocr_extractions (id, evidence_id, status, extracted_text, provider, requested_by, created_at)
select md5('saqeel-demo:ocr_extractions:'||cand.id::text)::uuid,
       cand.id,
       case (cand.rn % 8)
         when 0 then 'no_text_found' when 1 then 'extracted' when 2 then 'extracted'
         when 3 then 'failed' when 4 then 'extracted' when 5 then 'pending'
         when 6 then 'extracted' else 'unavailable' end,
       case (cand.rn % 8)
         when 1 then 'المملكة العربية السعودية — وزارة الصناعة والثروة المعدنية. ترخيص صناعي رقم '||lpad(((cand.rn*7919)%900000+100000)::text,6,'0')||' — الحالة: ساري — تاريخ الانتهاء: 2027-03-14'
         when 2 then 'سجل تجاري رقم '||lpad(((cand.rn*104729)%9000000000+1000000000)::text,10,'0')||' — اسم المنشأة: شركة الصناعات المعدنية المتقدمة — المدينة: الرياض'
         when 4 then 'شهادة معايرة جهاز قياس الانبعاثات — رقم الشهادة CAL-'||lpad(((cand.rn*3571)%90000+10000)::text,5,'0')||' — صالحة حتى: 2026-12-31'
         when 6 then 'بطاقة سلامة كيميائية — المادة: هيدروكسيد الصوديوم — رمز التصنيف: UN1823 — إجراءات التخزين موضحة على العبوة'
         else null end,
       'gemini',
       coalesce(cand.captured_by, (select u.id from auth.users u where u.email='inspector@mim.gov.sa')),
       cand.captured_at + interval '11 minutes'
from cand
on conflict do nothing;


-- ---------------------------------------------------------------------
-- 21. virtual_sessions — virtual inspection rooms (+14 rows)
--     UNIQUE (visit_id). state advances through the virtual_state enum and
--     the timeline carries only the events consistent with that state.
--     Insert only — guard_virtual_transition fires on UPDATE.
-- ---------------------------------------------------------------------
with cand as (
  select v.id as visit_id, v.window_start, v.factory_id,
         (row_number() over (order by v.window_start desc, v.id))::int rn
  from visits v
  where v.execution_mode::text = 'virtual'
    and v.window_start >= timestamptz '2026-06-20 00:00:00+03'
    and v.window_start <= timestamptz '2026-08-10 00:00:00+03'
    -- Guard ignores seed-owned sessions so the candidate set is run-invariant.
    and not exists (
      select 1 from virtual_sessions vs
      where vs.visit_id = v.id
        and vs.id <> md5('saqeel-demo:virtual_sessions:'||v.id::text)::uuid)
    -- Hard cap: no-op once this seed owns its 14 sessions.
    and (select count(*) from virtual_sessions vs2
         where vs2.id = md5('saqeel-demo:virtual_sessions:'||vs2.visit_id::text)::uuid) < 14
  order by v.window_start desc, v.id
  limit 14
), st(rn, state) as (values (1,'scheduled'),(2,'waiting'),(3,'joined'),(4,'verified'),(5,'in_progress'),(6,'closed'),(7,'closed'))
insert into virtual_sessions (id, visit_id, state, appointment_at, timeline)
select md5('saqeel-demo:virtual_sessions:'||cand.visit_id::text)::uuid,
       cand.visit_id,
       ((select st.state from st where st.rn = ((cand.rn % 7) + 1)))::virtual_state,
       cand.window_start,
       (
         select jsonb_agg(entry order by ord)
         from (
           select 1 as ord, jsonb_build_object(
             'at', to_char(cand.window_start - interval '3 days', 'YYYY-MM-DD"T"HH24:MI:SSOF'),
             'actor', (select u.id from auth.users u where u.email='planner@mim.gov.sa')::text,
             'event', 'scheduled',
             'detail', jsonb_build_object('appointment_at', to_char(cand.window_start,'YYYY-MM-DD"T"HH24:MI:SSOF'))) as entry
           union all
           select 2, jsonb_build_object(
             'at', to_char(cand.window_start - interval '10 minutes', 'YYYY-MM-DD"T"HH24:MI:SSOF'),
             'actor', (select u.id from auth.users u where u.email='inspector@mim.gov.sa')::text,
             'event', 'waiting',
             'detail', jsonb_build_object('channel','virtual_room'))
           where ((cand.rn % 7) + 1) >= 2
           union all
           select 3, jsonb_build_object(
             'at', to_char(cand.window_start + interval '4 minutes', 'YYYY-MM-DD"T"HH24:MI:SSOF'),
             'actor', (select u.id from auth.users u where u.email='inspector@mim.gov.sa')::text,
             'event', 'joined',
             'detail', jsonb_build_object('participants', 2))
           where ((cand.rn % 7) + 1) >= 3
           union all
           select 4, jsonb_build_object(
             'at', to_char(cand.window_start + interval '9 minutes', 'YYYY-MM-DD"T"HH24:MI:SSOF'),
             'actor', (select u.id from auth.users u where u.email='inspector@mim.gov.sa')::text,
             'event', 'verified',
             'detail', jsonb_build_object('identity_check','representative_id_confirmed'))
           where ((cand.rn % 7) + 1) >= 4
           union all
           select 5, jsonb_build_object(
             'at', to_char(cand.window_start + interval '14 minutes', 'YYYY-MM-DD"T"HH24:MI:SSOF'),
             'actor', (select u.id from auth.users u where u.email='inspector@mim.gov.sa')::text,
             'event', 'in_progress',
             'detail', jsonb_build_object('walkthrough','production_line'))
           where ((cand.rn % 7) + 1) >= 5
           union all
           select 6, jsonb_build_object(
             'at', to_char(cand.window_start + interval '52 minutes', 'YYYY-MM-DD"T"HH24:MI:SSOF'),
             'actor', (select u.id from auth.users u where u.email='inspector@mim.gov.sa')::text,
             'event', 'closed',
             'detail', jsonb_build_object('outcome','session_completed'))
           where ((cand.rn % 7) + 1) >= 6
         ) t
       )
from cand
on conflict do nothing;


-- ---------------------------------------------------------------------
-- NOT SEEDED, deliberately:
--   audit_event_source_contracts — a governed mapping between audit event
--   types (audit_event_registry) and source object/action pairs, not demo
--   data. Adding rows would invent governance, so the existing 12 rows are
--   left untouched.
-- =====================================================================
