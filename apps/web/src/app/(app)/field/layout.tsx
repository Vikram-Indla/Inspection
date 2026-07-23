import type { ReactNode } from "react";
import { useT } from "@/lib/i18n";

// SAQEEL field (inspector iPad) channel layout. This segment renders its OWN
// self-contained chrome from the canonical SAQEEL field design system — the
// global AppShell topbar/sidebar is bypassed for /field paths in the parent
// (app)/layout.tsx. The design's stylesheet (public/saqeel-ds/saqeel/styles.css)
// is linked ONLY here, so its token/component layer is scoped to field routes
// and never leaks into the console/admin chrome (which stays on astryx.css).
// Each field page renders its own design header + <FieldNav> bottom bar.
export default async function FieldLayout({ children }: { children: ReactNode }) {
  const { locale } = await useT();
  return (
    <>
      {/* Next hoists this <link> to <head>; the DS @imports (tokens, IBM Plex
          via Google Fonts) resolve relative to styles.css under /saqeel-ds. */}
      <link rel="stylesheet" href="/saqeel-ds/saqeel/styles.css" />
      <div
        dir={locale === "ar" ? "rtl" : "ltr"}
        lang={locale}
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          background: "var(--surface-canvas)",
          color: "var(--text-primary)",
          fontFamily: "var(--font-body)",
        }}
      >
        {children}
      </div>
    </>
  );
}
