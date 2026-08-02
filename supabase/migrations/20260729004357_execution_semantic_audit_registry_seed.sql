-- Recovered from live schema_migrations.statements — file was missing from this repo; this is the exact applied SQL, added 2026-08-02 during migration reconciliation.

-- Restores the immutable semantic-audit registry after a clean test-environment reset.
-- This is additive: it preserves the canonical event definitions and never disables audit.
insert into public.audit_event_registry(event_type,schema_version,title,aliases,requirement_refs,acceptance_refs,required_fields,source_mapping_status)
values
('VisitPlanCreated',1,'Visit planned','{}',array['MVP2-REQ-0137','MVP2-REQ-0154'],array['MVP2-AC-0137','MVP2-AC-0154'],array['method','status','created_at'],'canonical'),
('PackageCompiled',1,'Package compiled','{}',array['MVP2-REQ-0138'],array['MVP2-AC-0138'],array['package_version','package_hash'],'needs_contract'),
('PackageDownloaded',1,'Package downloaded','{}',array['MVP2-REQ-0139','MVP2-REQ-0157'],array['MVP2-AC-0139','MVP2-AC-0157'],array['device_id','package_id','checksum'],'missing'),
('GeofenceCheckIn',1,'Geofence check-in',array['GeoCheckIn'],array['MVP2-REQ-0140','MVP2-REQ-0158'],array['MVP2-AC-0140','MVP2-AC-0158'],array['visit_id','accuracy_m','occurred_at'],'partial'),
('AnswerSaved',1,'Answer saved','{}',array['MVP2-REQ-0141'],array['MVP2-AC-0141'],array['question_id','answer','validation_complete','saved_at'],'canonical'),
('EvidenceCaptured',1,'Evidence captured','{}',array['MVP2-REQ-0142','MVP2-REQ-0161'],array['MVP2-AC-0142','MVP2-AC-0161'],array['evidence_id','hash','captured_at'],'canonical'),
('FindingCreated',1,'Finding created','{}',array['MVP2-REQ-0143','MVP2-REQ-0162'],array['MVP2-AC-0143','MVP2-AC-0162'],array['finding_id','item_id','severity'],'canonical'),
('SignatureRecorded',1,'Signature or refusal recorded',array['DigitalSignatureCaptured','SignatureRefused'],array['MVP2-REQ-0144'],array['MVP2-AC-0144'],array['outcome','verification_status'],'partial'),
('SyncCompleted',1,'Sync completed','{}',array['MVP2-REQ-0145'],array['MVP2-AC-0145'],array['uploaded_items','retry_count'],'missing'),
('ReviewDecisionRecorded',1,'Review decision recorded','{}',array['MVP2-REQ-0146','MVP2-REQ-0167'],array['MVP2-AC-0146','MVP2-AC-0167'],array['decision','reason'],'canonical'),
('NoticeIssued',1,'Enforcement notice issued',array['EnforcementIssued'],array['MVP2-REQ-0147'],array['MVP2-AC-0147'],array['notice_id','clause','delivery_status'],'partial'),
('CorrectionOrObjectionEvent',1,'Correction or objection closure','{}',array['MVP2-REQ-0148'],array['MVP2-AC-0148'],array['case_id','outcome'],'needs_contract'),
('RegulationVersionPublished',1,'Regulation version published','{}',array['MVP2-REQ-0149'],array['MVP2-AC-0149'],array['regulation_id','code','status'],'canonical'),
('TemplatePublished',1,'Template published','{}',array['MVP2-REQ-0150'],array['MVP2-AC-0150'],array['template_version','regulation_version'],'needs_contract'),
('WorkflowActivated',1,'Workflow activated','{}',array['MVP2-REQ-0151'],array['MVP2-AC-0151'],array['workflow_version','approval_id'],'needs_contract'),
('RiskModelActivated',1,'Risk model activated','{}',array['MVP2-REQ-0152'],array['MVP2-AC-0152'],array['model_version','approval_id'],'needs_contract'),
('RiskScoreCalculated',1,'Risk score calculated','{}',array['MVP2-REQ-0153'],array['MVP2-AC-0153'],array['factory_id','score','model_version'],'missing'),
('AssignmentAccepted',1,'Assignment accepted','{}',array['MVP2-REQ-0155'],array['MVP2-AC-0155'],array['assignment_id','accepted_at'],'needs_contract'),
('OfflinePackageLocked',1,'Offline package locked','{}',array['MVP2-REQ-0156'],array['MVP2-AC-0156'],array['package_version_id','hash_status'],'partial'),
('InspectionStarted',1,'Inspection started','{}',array['MVP2-REQ-0159'],array['MVP2-AC-0159'],array['inspection_id','start_time'],'canonical'),
('FormAnswerChanged',1,'Form answer changed','{}',array['MVP2-REQ-0160'],array['MVP2-AC-0160'],array['question_id','answer'],'canonical'),
('DigitalSignatureCaptured',1,'Digital signature captured','{}',array['MVP2-REQ-0163'],array['MVP2-AC-0163'],array['signer_id','method','report_hash','verification_status'],'needs_contract'),
('SignatureRefused',1,'Signature refused','{}',array['MVP2-REQ-0164'],array['MVP2-AC-0164'],array['reason','report_hash'],'needs_contract'),
('InspectionSubmitted',1,'Inspection submitted','{}',array['MVP2-REQ-0165'],array['MVP2-AC-0165'],array['inspection_id','submit_time'],'canonical'),
('SyncConflictResolved',1,'Sync conflict resolved','{}',array['MVP2-REQ-0166'],array['MVP2-AC-0166'],array['local_value','server_value','resolution_rule'],'missing'),
('CommitteeDecisionRecorded',1,'Committee decision recorded','{}',array['MVP2-REQ-0168'],array['MVP2-AC-0168'],array['outcome','rationale','effective_date'],'needs_contract'),
('CorrectionSubmitted',1,'Correction submitted','{}',array['MVP2-REQ-0169'],array['MVP2-AC-0169'],array['violation_id','submitted_at'],'needs_contract'),
('ObjectionFiled',1,'Objection filed','{}',array['MVP2-REQ-0170'],array['MVP2-AC-0170'],array['case_id','grounds','submitted_at'],'needs_contract'),
('DashboardViewed',1,'Dashboard viewed','{}',array['MVP2-REQ-0171'],array['MVP2-AC-0171'],array['dashboard','filters','data_snapshot_id'],'missing'),
('AdminOverrideAttempted',1,'Admin override attempted','{}',array['MVP2-REQ-0172'],array['MVP2-AC-0172'],array['object_id','reason','approval_flag'],'partial')
on conflict (event_type,schema_version) do nothing;

insert into public.audit_event_source_contracts(event_type,schema_version,source_object_type,source_action) values
('VisitPlanCreated',1,'visit_plans','INSERT'),
('InspectionStarted',1,'inspections','UPDATE'),
('AnswerSaved',1,'checklist_responses','INSERT'),
('AnswerSaved',1,'checklist_responses','UPDATE'),
('FormAnswerChanged',1,'checklist_responses','UPDATE'),
('EvidenceCaptured',1,'evidence','INSERT'),
('InspectionSubmitted',1,'submission_versions','INSERT'),
('SignatureRecorded',1,'submission_versions','INSERT'),
('ReviewDecisionRecorded',1,'reviews','UPDATE'),
('RegulationVersionPublished',1,'regulations','UPDATE'),
('OfflinePackageLocked',1,'package_versions','UPDATE')
on conflict do nothing;
