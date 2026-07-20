import "server-only";

import { createHash } from "node:crypto";
import { failed } from "../errors";
import type {
  DomainResult, GovernedInspectionSubmission, PreparedSenaeiInspectionSubmission, SenaeiInspectionSubmissionPayload,
  SenaeiSubmissionAttachment, SenaeiSubmissionAttachmentManifest, SenaeiSubmissionOutboxEnvelope,
  SenaeiSubmissionProduct, SenaeiSubmissionRawMaterial, SenaeiSubmissionTool, SenaeiClient, SenaeiOperationResult,
} from "../types";

const BLOCKED_MESSAGE = "External inspection submission is prepared locally but forwarding requires a governed trigger decision.";
const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const nonBlank = (value: string | undefined) => value !== undefined && value.trim() !== "";

function appendText(form: FormData, field: string, value: string | undefined): void { if (value !== undefined && nonBlank(value)) form.append(field, value); }
function attachmentManifest(field: string, attachment: SenaeiSubmissionAttachment): SenaeiSubmissionAttachmentManifest {
  if (!/^[a-f0-9]{64}$/i.test(attachment.sha256)) throw new Error(`Attachment ${field} must include a SHA-256 checksum.`);
  return { field, filename: attachment.filename, sha256: attachment.sha256.toLowerCase(), size: attachment.file.size, type: attachment.file.type };
}
function appendAttachments(form: FormData, manifest: SenaeiSubmissionAttachmentManifest[], field: string, attachments: SenaeiSubmissionAttachment[] | undefined): void {
  for (const attachment of attachments ?? []) { manifest.push(attachmentManifest(field, attachment)); form.append(field, attachment.file, attachment.filename); }
}
function appendProducts(form: FormData, products: SenaeiSubmissionProduct[] | undefined): void {
  for (const [index, product] of (products ?? []).entries()) {
    appendText(form, `selected_products[${index}][id]`, product.id); appendText(form, `selected_products[${index}][name]`, product.name);
    appendText(form, `selected_products[${index}][hs_code]`, product.hsCode); appendText(form, `selected_products[${index}][is_regulated]`, product.isRegulated);
  }
}
function appendTools(form: FormData, tools: SenaeiSubmissionTool[] | undefined): void {
  for (const [index, tool] of (tools ?? []).entries()) { appendText(form, `selected_tools[${index}][id]`, tool.id); appendText(form, `selected_tools[${index}][name]`, tool.name); appendText(form, `selected_tools[${index}][is_passed]`, tool.isPassed); }
}
function appendRawMaterials(form: FormData, materials: SenaeiSubmissionRawMaterial[] | undefined): void {
  for (const [index, material] of (materials ?? []).entries()) {
    appendText(form, `selected_raw_materials[${index}][id]`, material.id); appendText(form, `selected_raw_materials[${index}][name]`, material.name);
    appendText(form, `selected_raw_materials[${index}][quantity]`, material.quantity); appendText(form, `selected_raw_materials[${index}][is_beneficiary]`, material.isBeneficiary); appendText(form, `selected_raw_materials[${index}][is_in_factory]`, material.isInFactory);
  }
}

/** Builds the structurally documented multipart body; it never makes a network call. */
export function buildInspectionSubmissionPayload(payload: SenaeiInspectionSubmissionPayload): PreparedSenaeiInspectionSubmission {
  if (!payload.taskId.trim() || !payload.governanceRef.trim()) throw new Error("Inspection submission requires task and governance references.");
  const formData = new FormData(); const attachmentManifest: SenaeiSubmissionAttachmentManifest[] = [];
  appendText(formData, "inspection_type", payload.inspectionType); appendText(formData, "is_distrupted", payload.isDistrupted);
  appendText(formData, "distrubtion_reason", payload.distrubtionReason); appendText(formData, "other_distrubtion_reason", payload.otherDistrubtionReason);
  appendAttachments(formData, attachmentManifest, "factory_front_image[]", payload.factoryFrontImages); appendAttachments(formData, attachmentManifest, "distrubtion_report[]", payload.distrubtionReports);
  appendText(formData, "factory_condition", payload.factoryCondition); for (const fuel of payload.usedFuelTypes ?? []) appendText(formData, "used_fuel_type[]", fuel);
  const fields: [string, string | undefined][] = [["factory_stop_reason", payload.factoryStopReason], ["production_date", payload.productionDate], ["specialized_professions_number", payload.specializedProfessionsNumber], ["technicians_number", payload.techniciansNumber], ["other_team_number", payload.otherTeamNumber], ["shifts_number", payload.shiftsNumber], ["factory_operation_mechanism", payload.factoryOperationMechanism], ["production_lines_number", payload.productionLinesNumber], ["licensed_products_number", payload.licensedProductsNumber], ["un_licensed_products_number", payload.unLicensedProductsNumber], ["actual_products_number", payload.actualProductsNumber], ["is_exporting", payload.isExporting], ["exported_products_number", payload.exportedProductsNumber], ["tools_and_equipments_number", payload.toolsAndEquipmentsNumber], ["is_exmpted", payload.isExmpted], ["notes", payload.notes]];
  for (const [field, value] of fields) appendText(formData, field, value);
  for (const item of payload.checklistItems ?? []) {
    if (!item.externalId.trim()) throw new Error("Checklist items require an external id.");
    const root = `checklist_items[${item.externalId}]`; appendText(formData, `${root}[applies]`, item.applies); appendText(formData, `${root}[remarks]`, item.remarks); appendAttachments(formData, attachmentManifest, `${root}[response_attachments][]`, item.responseAttachments);
  }
  appendProducts(formData, payload.selectedProducts); appendAttachments(formData, attachmentManifest, "products_images[]", payload.productImages);
  appendTools(formData, payload.selectedTools); appendAttachments(formData, attachmentManifest, "tools_images[]", payload.toolImages);
  appendRawMaterials(formData, payload.selectedRawMaterials);
  const fieldsForChecksum = Array.from(formData.entries()).filter((entry): entry is [string, string] => typeof entry[1] === "string").sort(([a, av], [b, bv]) => a.localeCompare(b) || av.localeCompare(bv));
  const stableManifest = [...attachmentManifest].sort((a, b) => `${a.field}:${a.filename}:${a.sha256}`.localeCompare(`${b.field}:${b.filename}:${b.sha256}`));
  return { endpoint: "/api/inspection/tasks/submit-inspection/{task}", method: "POST", contentType: "multipart/form-data", bodyKind: "multipart_form_data", taskId: payload.taskId, governanceRef: payload.governanceRef, formData, attachmentManifest: stableManifest, payloadChecksum: digest({ taskId: payload.taskId, governanceRef: payload.governanceRef, fields: fieldsForChecksum, attachments: stableManifest }) };
}

/** The outbox representation is delivery-neutral: enqueue is not a provider submission. */
export function createBlockedSubmissionOutbox(prepared: PreparedSenaeiInspectionSubmission, idempotencyKey: string): SenaeiSubmissionOutboxEnvelope {
  if (!idempotencyKey.trim()) throw new Error("Inspection submission outbox requires an idempotency key.");
  return { kind: "senaei_inspection_submission", idempotencyKey, payloadChecksum: prepared.payloadChecksum, deliveryStatus: "BLOCKED_TRIGGER_DECISION", attemptCount: 0, providerResult: null, error: { code: "BLOCKED_TRIGGER_DECISION", message: BLOCKED_MESSAGE, retryable: false }, prepared };
}

/** Compatibility boundary: intentionally fail closed until a submission trigger is approved. */
export async function submitInspection(_client: SenaeiClient, submission: GovernedInspectionSubmission): Promise<DomainResult<SenaeiOperationResult>> {
  if (!submission.taskId.trim() || !submission.governanceRef.trim() || !(submission.formData instanceof FormData) || !submission.formData.has("inspection_type") || !submission.formData.has("is_distrupted")) return failed("SENAEI_REQUEST_INVALID", "Inspection submission requires task, governance reference and multipart FormData with inspection_type and is_distrupted.");
  return failed("BLOCKED_TRIGGER_DECISION", BLOCKED_MESSAGE);
}
