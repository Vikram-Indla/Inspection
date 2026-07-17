import "./tokens.css";
import PwaRegister from "@/components/PwaRegister";
import ThemeScript from "@/components/ThemeScript";
import "./astryx.css";
import { IBM_Plex_Sans_Arabic, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { getLocale } from "@/lib/i18n";
import { registerAdapter } from "@/lib/notify";
import { registerStagingNotificationAdapters } from "@/lib/providers/notification-stubs";

// Cycle 2 Wave 2.E wiring — module-level (once per server process, not per
// request). registerStagingNotificationAdapters() itself no-ops unless
// FEATURE_NOTIFICATION_STUBS=staging is explicitly set, so this import is a
// harmless no-op for every real deployment that doesn't set that flag.
registerStagingNotificationAdapters(registerAdapter);

// Saqeel theme v2: Space Grotesk carries EN (launch-film geometric sans),
// IBM Plex Sans Arabic carries AR, JetBrains Mono carries data labels.
const grotesk = Space_Grotesk({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-grotesk",
  display: "swap",
});
const plexArabic = IBM_Plex_Sans_Arabic({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "arabic"],
  variable: "--font-plex-arabic",
  display: "swap",
});
const jbMono = JetBrains_Mono({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-jbmono",
  display: "swap",
});

export const viewport = { themeColor: "#0A0A14" };
export const metadata = {
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/saqeel-prism.svg", type: "image/svg+xml" }, { url: "/saqeel-prism-32.png", sizes: "32x32" }],
    apple: "/saqeel-prism-180.png",
  },
  title: "Saqeel صقيل — Industrial Inspection Platform",
  description: "Saqeel (صقيل | صناعي) — the national industrial inspection platform. One platform. Every factory. Every inspection. Every decision.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={`${grotesk.variable} ${plexArabic.variable} ${jbMono.variable}`} suppressHydrationWarning>
      <head><ThemeScript /></head>
      <body><PwaRegister />{children}</body>
    </html>
  );
}
