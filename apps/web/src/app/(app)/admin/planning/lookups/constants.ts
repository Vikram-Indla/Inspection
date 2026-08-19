export const LOOKUP_KINDS = [
  "visit_type", "visit_mode", "priority",
  "return_reason", "cancellation_reason", "manual_entry_reason", "assignment_override_reason",
] as const;

export const KNOWN_METADATA_FLAGS = [
  "manual_entry_allowed", "attachment_required", "location_required", "comments_required",
] as const;
