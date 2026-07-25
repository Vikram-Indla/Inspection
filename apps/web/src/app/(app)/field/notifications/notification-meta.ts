// SAQEEL PWA-Field Notifications.dc.html — icon + category vocabulary shared by
// the list and the detail screen so the glyph and the words on one notification
// can never disagree. Icon tokens are ported verbatim from the design's
// iconMeta(); category labels are the design's own category_en/category_ar.
// Only DS tokens — no bare colors.

export type NotificationIcon = { path: string; bg: string; color: string };

export const NOTIFICATION_ICONS = {
  license: { path: "M9 12h6M9 16h6M9 8h3M6 4h9l3 3v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z", bg: "var(--accent-soft)", color: "var(--accent-text)" },
  assign: { path: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11", bg: "var(--status-compliant-soft)", color: "var(--status-compliant-text)" },
  return: { path: "M9 14l-4-4 4-4M5 10h11a4 4 0 0 1 0 8h-1", bg: "var(--status-warning-soft)", color: "var(--status-warning-text)" },
  sync: { path: "M4 4v5h5M20 20v-5h-5M4.5 9a8 8 0 0 1 14.1-3.5M19.5 15a8 8 0 0 1-14.1 3.5", bg: "var(--surface-sunken)", color: "var(--text-secondary)" },
  calendar: { path: "M8 2v4M16 2v4M3 9h18M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z", bg: "var(--accent-soft)", color: "var(--accent-text)" },
  cancel: { path: "M12 9v4M12 16.5h.01M10.3 4.5 2.7 18a1.5 1.5 0 0 0 1.3 2.2h16a1.5 1.5 0 0 0 1.3-2.2L13.7 4.5a1.5 1.5 0 0 0-2.6 0z", bg: "var(--status-critical-soft)", color: "var(--status-critical-text)" },
} as const satisfies Record<string, NotificationIcon>;

export type NotificationCategory = keyof typeof NOTIFICATION_ICONS;

// Glyph per event. A neutral fallback glyph states nothing false, so unmapped
// events still get an icon.
const EVENT_ICON: Record<string, NotificationCategory> = {
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

// Category WORDS are a factual claim, so this is a separate, stricter map than
// the glyph map above: an event only appears here when one of the design's six
// categories is actually true of it. `otp_code` reuses the license GLYPH but is
// not a license update; `visit_expired` is not a cancellation; `review_decision`
// and `virtual_closed` are not necessarily returns. Those render no category at
// all rather than a wrong one.
const EVENT_CATEGORY: Record<string, NotificationCategory> = {
  assignment: "assign",
  visit_republished: "assign",
  visit_returned: "return",
  visit_cancelled: "cancel",
  reschedule: "calendar",
  visit_rescheduled: "calendar",
  virtual_scheduled: "calendar",
  virtual_rescheduled: "calendar",
};

export function notificationIcon(eventKey: string): NotificationIcon {
  return NOTIFICATION_ICONS[EVENT_ICON[eventKey] ?? "sync"];
}

// null when no design category is truthfully known for this event.
export function notificationCategory(eventKey: string): NotificationCategory | null {
  return EVENT_CATEGORY[eventKey] ?? null;
}

// The design's own category strings (category_en / category_ar).
const CATEGORY_LABEL: Record<NotificationCategory, { en: string; ar: string }> = {
  license: { en: "License update", ar: "تحديث ترخيص" },
  assign: { en: "Visit assignment", ar: "تكليف زيارة" },
  return: { en: "Report returned", ar: "إرجاع تقرير" },
  sync: { en: "Sync", ar: "مزامنة" },
  calendar: { en: "Appointment", ar: "موعد" },
  cancel: { en: "Cancellation", ar: "إلغاء" },
};

export function notificationCategoryLabel(category: NotificationCategory, locale: string): string {
  return locale === "ar" ? CATEGORY_LABEL[category].ar : CATEGORY_LABEL[category].en;
}
