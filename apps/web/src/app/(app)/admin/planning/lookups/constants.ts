// M9 / PLN-CON-012 — shared constants for the planning lookups control plane.
// Kept out of actions.ts because a "use server" module may only export async
// functions.
export const LOOKUP_KINDS = [
  "visit_type", "visit_mode", "priority",
  "return_reason", "cancellation_reason", "manual_entry_reason", "assignment_override_reason",
] as const;

export const KNOWN_METADATA_FLAGS = [
  "manual_entry_allowed", "attachment_required", "location_required", "comments_required",
] as const;
