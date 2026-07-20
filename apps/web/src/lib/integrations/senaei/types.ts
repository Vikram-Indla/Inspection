export type DomainResult<T> =
  | { status: "available"; data: T; source: "senaei"; fetchedAt: string }
  | { status: "degraded"; data: T | null; code: string; message: string; retryable: boolean }
  | { status: "not_configured"; data: null; code: string; domain: string; message: string }
  | { status: "failed"; data: null; code: string; message: string; retryable: boolean };

export type SenaeiAuthMode = "api_key" | "bearer";
export type SenaeiPublicEndpointAuthMode = "api_key" | "none";
export type SenaeiProductionLineMode = "get_query";
export type SenaeiProductionLineType = "product" | "raw-material" | "spare-part" | "machine";
export type SenaeiClientConfig = { baseUrl: URL; allowedHostSuffix: string; authMode: SenaeiAuthMode; publicEndpointAuthMode: SenaeiPublicEndpointAuthMode | null; apiKey: string | null; bearerToken: string | null; timeoutMs: number; maxJsonBytes: number; getRetryCount: number; productionLineMode: SenaeiProductionLineMode | null };
export type RequestOptions = { method?: "GET" | "POST"; query?: Record<string, string | number | boolean | undefined>; body?: BodyInit; bodyKind?: "multipart_form_data"; auth?: "configured" | "api_key" | "none"; headers?: Record<string, string> };
export type SenaeiClient = { readonly productionLineMode: SenaeiProductionLineMode | null; readonly publicEndpointAuthMode: SenaeiPublicEndpointAuthMode | null; requestJson(path: string, options?: RequestOptions): Promise<DomainResult<unknown>> };

export type LabelValue = { value: string | null; label: string | null };
export type CommercialRegistration = { number: string | null; unifiedNumber: string | null; nameEn: string | null; nameAr: string | null };
export type IndustrialLicense = { externalId: string; licenseNumber: string | null; type: LabelValue | null; status: LabelValue | null; investmentType: LabelValue | null; investmentSize: number | null };
export type PlantAddress = { externalId: string | null; addressLine1: string | null; districtEn: string | null; districtAr: string | null; buildingNumber: string | null; additionalNumber: string | null; zipCode: string | null; unitNumber: string | null; streetNameEn: string | null; streetNameAr: string | null; latitude: number | null; longitude: number | null; cityNameEn: string | null; cityNameAr: string | null; regionNameEn: string | null; regionNameAr: string | null };
export type IndustrialPlant = { externalId: string; plantNumber: string | null; state: LabelValue | null; licenseNumber: string | null; mainActivityCodeL2: string | null; mainActivityCodeL4: string | null; hasApprovedManpower: boolean | null; insideIndustrialCity: boolean | null; startedProductionAt: string | null; closedAt: string | null; establishedAt: string | null; canceledAt: string | null; landProvider: unknown; industrialCity: unknown; address: PlantAddress | null; commercialRegistration: CommercialRegistration | null };
export type InspectionTaskDetail = { externalId: string; number: string | null; workflow: string | null; status: string | null; createdAt: string | null; visit: { externalId: string; type: LabelValue | null; method: LabelValue | null; visitDate: string | null; facilityName: string | null; crNumber: string | null; notes: string | null; inspector: { externalId: string | null; name: string | null } | null; plant: IndustrialPlant | null } | null; license: IndustrialLicense | null };
export type ProductionLineItem = { externalId: string; externalPlantId: string | null; externalProductId: string | null; externalUnitId: string | null; quantity: number | null; isPrimary: boolean | null; realProduction: number | null; maximumProduction: number | null; price: number | null; hsCode: string | null; hsCodeType: string | null; nameEn: string | null; nameAr: string | null; isSparePart: boolean | null; isMachine: boolean | null; isEndProduct: boolean | null; isRawMaterial: boolean | null; unitCode: string | null; unitNameEn: string | null; unitNameAr: string | null; activityIsicCode: string | null; activityNameEn: string | null; activityNameAr: string | null; createdAt: string | null; updatedAt: string | null };
export type ProductionLinePage = { currentPage: number; lastPage: number; perPage: number; total: number; items: ProductionLineItem[] };
export type RegulationItem = { externalId: string; name: string | null; description: string | null; type: LabelValue | null; administrativeName: LabelValue | null; reportKind: LabelValue | null; approvalOption: LabelValue | null; rejectionOption: LabelValue | null; status: LabelValue | null; attachmentMode: LabelValue | null; entityNotification: boolean | null; appearedInSelfAssessment: boolean | null; mandatoryForInspector: boolean | null };
export type Regulation = { externalId: string; name: string | null; number: string | null; issueDate: string | null; active: boolean | null; issuingAuthorities: LabelValue[]; items: RegulationItem[]; createdAt: string | null };

// External spellings are retained only at the wire boundary.
export type InspectionObservationWire = { is_distrupted?: unknown; distrubtion_reason?: unknown; other_distrubtion_reason?: unknown; is_exmpted?: unknown; administrators_number?: unknown };
export type InspectionObservation = { isDisrupted: boolean | null; disruptionReason: string | null; otherDisruptionReason: string | null; isExempted: boolean | null; administratorsNumber: number | null };

export type SenaeiUserProfile = { externalId: string; legacyId: string | null; username: string | null; firstName: string | null; lastName: string | null; nationalId: string | null; email: string | null; mobile: string | null; entity: string | null; dateOfBirth: string | null; language: string | null; emailVerifiedAt: string | null; mobileVerifiedAt: string | null; blockedAt: string | null; disabledAt: string | null; createdAt: string | null; updatedAt: string | null; lastLoginAt: string | null; ndbSyncedAt: string | null; ndbLastOperationsAt: string | null };
export type SenaeiLoginResult = { token: string; user: SenaeiUserProfile };
export type SenaeiOperationResult = { success: boolean; message: string | null };
export type SenaeiTaskSummary = { externalId: string; number: string | null; workflow: string | null; status: string | null; createdAt: string | null; visit: { externalId: string; type: LabelValue | null; method: LabelValue | null; visitDate: string | null; facilityName: string | null; crNumber: string | null; notes: string | null; inspector: { externalId: string | null; name: string | null } | null } | null };
// INSP-API-011 is structurally documented as multipart/form-data.  The wire
// spellings below are intentional: the provider's documented misspellings are
// confined to this boundary and never become Factory 360 field names.
export type SenaeiSubmissionAttachment = { file: Blob; filename: string; sha256: string };
export type SenaeiSubmissionChecklistItem = { externalId: string; applies?: string; remarks?: string; responseAttachments?: SenaeiSubmissionAttachment[] };
export type SenaeiSubmissionProduct = { id?: string; name?: string; hsCode?: string; isRegulated?: string };
export type SenaeiSubmissionTool = { id?: string; name?: string; isPassed?: string };
export type SenaeiSubmissionRawMaterial = { id?: string; name?: string; quantity?: string; isBeneficiary?: string; isInFactory?: string };
export type SenaeiInspectionSubmissionPayload = {
  taskId: string; governanceRef: string; inspectionType?: string; isDistrupted?: string;
  distrubtionReason?: string; otherDistrubtionReason?: string; factoryFrontImages?: SenaeiSubmissionAttachment[];
  distrubtionReports?: SenaeiSubmissionAttachment[]; factoryCondition?: string; usedFuelTypes?: string[];
  factoryStopReason?: string; productionDate?: string; specializedProfessionsNumber?: string;
  techniciansNumber?: string; otherTeamNumber?: string; shiftsNumber?: string; factoryOperationMechanism?: string;
  productionLinesNumber?: string; licensedProductsNumber?: string; unLicensedProductsNumber?: string;
  actualProductsNumber?: string; isExporting?: string; exportedProductsNumber?: string;
  toolsAndEquipmentsNumber?: string; isExmpted?: string; notes?: string;
  checklistItems?: SenaeiSubmissionChecklistItem[]; selectedProducts?: SenaeiSubmissionProduct[];
  productImages?: SenaeiSubmissionAttachment[]; selectedTools?: SenaeiSubmissionTool[];
  toolImages?: SenaeiSubmissionAttachment[]; selectedRawMaterials?: SenaeiSubmissionRawMaterial[];
};
export type SenaeiSubmissionAttachmentManifest = { field: string; filename: string; sha256: string; size: number; type: string };
export type PreparedSenaeiInspectionSubmission = {
  endpoint: "/api/inspection/tasks/submit-inspection/{task}"; method: "POST"; contentType: "multipart/form-data";
  taskId: string; governanceRef: string; formData: FormData; attachmentManifest: SenaeiSubmissionAttachmentManifest[]; payloadChecksum: string;
};
export type SenaeiSubmissionOutboxEnvelope = {
  kind: "senaei_inspection_submission"; idempotencyKey: string; payloadChecksum: string;
  deliveryStatus: "BLOCKED_TRIGGER_DECISION"; attemptCount: 0; providerResult: null;
  error: { code: "BLOCKED_TRIGGER_DECISION"; message: string; retryable: false };
  prepared: PreparedSenaeiInspectionSubmission;
};
// Legacy entry point retained for callers while forwarding is governed off.
export type GovernedInspectionSubmission = { taskId: string; governanceRef: string; formData: FormData };
