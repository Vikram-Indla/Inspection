import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";

const EVENT_TONE: Readonly<Record<string, StatusTone>> = {
  visit_expired: "danger",
  visit_cancelled: "danger",
  planning_supervision_rejected: "danger",
  compliance_request_rejected: "danger",
  visit_returned: "warning",
  visit_rescheduled: "warning",
  virtual_rescheduled: "warning",
  planning_visit_reschedule: "warning",
  compliance_request_returned: "warning",
  compliance_request_partially_approved: "warning",
  assignment: "accent",
  visit_republished: "accent",
  planning_visit_reassign: "accent",
  planning_supervision_requested: "info",
  submission_received: "info",
  resubmission: "info",
  review_decision: "info",
  virtual_scheduled: "info",
  compliance_request_submitted: "info",
  compliance_request_approved: "success",
  compliance_request_published: "success",
};

export function notificationTone(eventKey: string): StatusTone {
  return EVENT_TONE[eventKey] ?? "neutral";
}
