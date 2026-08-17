import type { IconName } from "@/components/saqeel/icon/icon-registry";

export type NotificationTone = "accent" | "success" | "warning" | "neutral" | "danger";
export type NotificationVisual = { icon: IconName; tone: NotificationTone };
export type NotificationCategory = "license" | "assign" | "return" | "sync" | "calendar" | "cancel";

const CATEGORY_VISUAL: Readonly<Record<NotificationCategory, NotificationVisual>> = {
  license: { icon: "forms", tone: "accent" },
  assign: { icon: "review", tone: "success" },
  return: { icon: "revert", tone: "warning" },
  sync: { icon: "refresh", tone: "neutral" },
  calendar: { icon: "calendar", tone: "accent" },
  cancel: { icon: "risk", tone: "danger" },
};

const EVENT_ICON: Readonly<Record<string, NotificationCategory>> = {
  assignment: "assign",
  visit_republished: "assign",
  visit_returned: "return",
  review_decision: "return",
  virtual_closed: "return",
  visit_cancelled: "cancel",
  visit_expired: "cancel",
  reschedule: "calendar",
  visit_rescheduled: "calendar",
  virtual_scheduled: "calendar",
  virtual_rescheduled: "calendar",
  otp_code: "license",
};

const EVENT_CATEGORY: Readonly<Record<string, NotificationCategory>> = {
  assignment: "assign",
  visit_republished: "assign",
  visit_returned: "return",
  visit_cancelled: "cancel",
  reschedule: "calendar",
  visit_rescheduled: "calendar",
  virtual_scheduled: "calendar",
  virtual_rescheduled: "calendar",
};

export function notificationVisual(eventKey: string): NotificationVisual {
  return CATEGORY_VISUAL[EVENT_ICON[eventKey] ?? "sync"];
}

export const RETURN_VISUAL: NotificationVisual = CATEGORY_VISUAL.return;

export function notificationCategory(eventKey: string): NotificationCategory | null {
  return EVENT_CATEGORY[eventKey] ?? null;
}
