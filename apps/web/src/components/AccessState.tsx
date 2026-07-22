"use client";
// CD-003 / AUTH-03 — shared shell-less access-state card. Used by the
// /launch no-workspace state and the /launch role-resolution failure state.
// Never renders navigation, a Shell, module names or available roles — this
// card exists precisely because authorization has not (yet, or ever) placed
// the user in a workspace. Reuses the login/reset .lg-page/.lg-card contract
// (login.css) so it inherits the same tokens-only, both-theme, RTL-mirrored
// styling without new CSS.
import { useEffect, useRef } from "react";

export type AccessStateTone = "neutral" | "critical";

export default function AccessState({
  tone, heading, body, identity, identityLabel, actions, dir, lang,
}: {
  tone: AccessStateTone;
  heading: string;
  body: string;
  identity?: string;      // authenticated user's own email only
  identityLabel?: string;
  actions: React.ReactNode; // action stack — buttons/links, ≥48px targets (lg-submit/sq-btn)
  dir?: "rtl" | "ltr";
  lang?: string;
}) {
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  // Focus transfer on arrival (design frame 1i): the heading is the landing
  // point for both status and alert announcements.
  useEffect(() => { headingRef.current?.focus(); }, []);

  return (
    <div className="lg-page" dir={dir} lang={lang}>
      <main className="lg-center">
        <div className="lg-card" role={tone === "critical" ? "alert" : "status"}>
          <h1 className="lg-card__title" ref={headingRef} tabIndex={-1}>{heading}</h1>
          <p className="lg-card__sub">{body}</p>
          {identity && (
            <p className="lg-identity" dir="ltr">{identityLabel} {identity}</p>
          )}
          <div className="lg-credentials">{actions}</div>
        </div>
      </main>
    </div>
  );
}
