import "./tokens.css";
import PwaRegister from "@/components/PwaRegister";
import "./astryx.css";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { getLocale } from "@/lib/i18n";

// Ministry theme (DGA): IBM Plex Sans Arabic carries both EN and AR text.
const plexArabic = IBM_Plex_Sans_Arabic({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "arabic"],
  variable: "--font-plex-arabic",
  display: "swap",
});

export const viewport = { themeColor: "#1B8354" };
export const metadata = {
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/favicon-32.png", sizes: "32x32" }],
    apple: "/apple-touch-icon.png",
  },
  title: "Inspection Platform — Ministry of Industry and Mineral Resources",
  description: "Ministry of Industry and Mineral Resources — Inspection Platform",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={plexArabic.variable}>
      <body><PwaRegister />{children}</body>
    </html>
  );
}
