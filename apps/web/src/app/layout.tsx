import "./tokens.css";
import PwaRegister from "@/components/PwaRegister";
import ThemeScript from "@/components/ThemeScript";
import "./astryx.css";
import { IBM_Plex_Sans_Arabic, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { getLocale } from "@/lib/i18n";

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
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/favicon-32.png", sizes: "32x32" }],
    apple: "/apple-touch-icon.png",
  },
  title: "Saqeel صقيل — Industrial Inspection Platform",
  description: "Saqeel (صقيل | صناعي) — the national industrial inspection platform. One platform. Every factory. Every inspection. Every decision.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={`${grotesk.variable} ${plexArabic.variable} ${jbMono.variable}`}>
      <head><ThemeScript /></head>
      <body><PwaRegister />{children}</body>
    </html>
  );
}
