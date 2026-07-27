import "./tokens.css";
import "./saqeel-runtime.css";
import PwaRegister from "@/components/PwaRegister";
import ThemeScript from "@/components/ThemeScript";
import DeviceScript from "@/components/DeviceScript";
import ThemeChannelSync from "@/components/ThemeChannelSync";
import "./saqeel-components-legacy.css";
// SAQEEL Inspection Design System v1.0 component layers.
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

// IBM Plex Sans Arabic provides one restrained bilingual product voice. Its
// Latin subset keeps English and Arabic metrics aligned across every shell page.
// Self-hosted (next/font/local) — Next.js dev/build must not depend on
// reaching fonts.googleapis.com/fonts.gstatic.com at request time (offline
// environments hit an unhandled Event from next/font/google's fetch failure).
// Files sourced once from the matching @fontsource npm packages.
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
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={plexArabic.variable} suppressHydrationWarning>
      <head><ThemeScript /><DeviceScript /></head>
      <body><PwaRegister /><ThemeChannelSync />{children}</body>
    </html>
  );
}
