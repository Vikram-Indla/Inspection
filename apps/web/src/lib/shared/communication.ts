// Shared platform contract 0193 — bilingual notice / correction / objection /
// deadline / evidence communication. Implemented once, proven per consumer.
// TASK-MVP2-SHARED-0193 · MVP2-REQ-0193.
// DEC-004: Arabic native terminology is HELD. This never invents Arabic text — an
// unapproved AR string is explicitly marked held, never silently substituted.

export type BilingualText = {
  en: string;
  ar: string | null;          // null when no APPROVED Arabic term exists
  arStatus: "approved" | "held";
};

/** Build a bilingual field. If the Arabic term is not approved, ar stays null and
 *  arStatus is 'held' — the UI must show the held state, not a fabricated string. */
export function bilingual(en: string, approvedAr?: string | null): BilingualText {
  const ar = approvedAr && approvedAr.trim() ? approvedAr.trim() : null;
  return { en, ar, arStatus: ar ? "approved" : "held" };
}

export type CommunicationKind = "notice" | "correction" | "objection" | "deadline" | "evidence";

export type Communication = {
  kind: CommunicationKind;
  subject: BilingualText;
  body: BilingualText;
  deadline?: string | null;   // ISO; never a fabricated policy window
};

/** A communication is presentable when English is complete; Arabic completeness is
 *  reported separately so a held AR term blocks nothing but is never hidden. */
export function isPresentable(c: Communication): boolean {
  return !!c.subject.en?.trim() && !!c.body.en?.trim();
}

export function arabicComplete(c: Communication): boolean {
  return c.subject.arStatus === "approved" && c.body.arStatus === "approved";
}
