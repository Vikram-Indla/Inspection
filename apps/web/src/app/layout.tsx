import "./tokens.css";
import PwaRegister from "@/components/PwaRegister";
import ThemeScript from "@/components/ThemeScript";
import ThemeChannelSync from "@/components/ThemeChannelSync";
import "./saqeel-components-legacy.css";
// SAQEEL Inspection Design System v1.0 component layer. saqeel-components.css is
// the canonical layer; saqeel-components-legacy.css holds the .sq-* families not
// yet redesigned into it. Both consume SAQEEL semantic tokens only; no legacy
// alias layer remains — astryx.css and its .ax-* families are fully retired.
import "./saqeel-components.css";
import localFont from "next/font/local";
import { getLocale } from "@/lib/i18n";
import { registerAdapter } from "@/lib/notify";
import { registerStagingNotificationAdapters } from "@/lib/providers/notification-stubs";

// Cycle 2 Wave 2.E wiring — module-level (once per server process, not per
// request). registerStagingNotificationAdapters() itself no-ops unless
// FEATURE_NOTIFICATION_STUBS=staging is explicitly set, so this import is a
// harmless no-op for every real deployment that doesn't set that flag.
registerStagingNotificationAdapters(registerAdapter);

// Government Foundation V1: IBM Plex Sans Arabic provides the shared bilingual
// product voice. Space Grotesk remains loaded only for the frozen input contract;
// JetBrains Mono is restricted to identifiers and machine telemetry.
// Self-hosted (next/font/local) — Next.js dev/build must not depend on
// reaching fonts.googleapis.com/fonts.gstatic.com at request time (offline
// environments hit an unhandled Event from next/font/google's fetch failure).
// Files sourced once from the matching @fontsource npm packages.
const grotesk = localFont({
  src: [
    { path: "../fonts/space-grotesk/space-grotesk-latin-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/space-grotesk/space-grotesk-latin-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/space-grotesk/space-grotesk-latin-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/space-grotesk/space-grotesk-latin-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-grotesk",
  display: "swap",
});
const plexArabic = localFont({
  src: [
    { path: "../fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-latin-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-latin-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-latin-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-latin-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-arabic-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-arabic-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-arabic-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-arabic-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-plex-arabic",
  display: "swap",
});
const jbMono = localFont({
  src: [
    { path: "../fonts/jetbrains-mono/jetbrains-mono-latin-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/jetbrains-mono/jetbrains-mono-latin-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/jetbrains-mono/jetbrains-mono-latin-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-jbmono",
  display: "swap",
});

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F7F8" },
    { media: "(prefers-color-scheme: dark)", color: "#101317" },
  ],
  // iPad standalone PWA: draw under the status bar / home indicator so the field
  // chrome's env(safe-area-inset-*) padding (FieldHeader/FieldNav) governs the
  // inset. The field app is fullscreen, not a reduced web portal (design policy).
  viewportFit: "cover" as const,
};
export const metadata = {
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/saqeel-favicon.svg", type: "image/svg+xml" }, { url: "/saqeel-favicon-32.png", sizes: "32x32" }],
    apple: "/saqeel-favicon-180.png",
  },
  title: "Saqeel صقيل — Industrial Inspection Platform",
  description: "Saqeel (صقيل | صناعي) — the national industrial inspection platform. One platform. Every factory. Every inspection. Every decision.",
  // Installed-to-home-screen presentation on iPadOS/Safari and Android/Chromium.
  // appleWebApp.capable + mobile-web-app-capable make the launched app run
  // standalone (no browser chrome); black-translucent lets content extend under
  // the status bar, paired with viewportFit:"cover" above.
  appleWebApp: { capable: true, title: "Saqeel", statusBarStyle: "black-translucent" as const },
  formatDetection: { telephone: false },
  other: { "mobile-web-app-capable": "yes" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={`${grotesk.variable} ${plexArabic.variable} ${jbMono.variable}`} suppressHydrationWarning>
      <head><ThemeScript /></head>
      <body><PwaRegister /><ThemeChannelSync />{children}</body>
    </html>
  );
}
