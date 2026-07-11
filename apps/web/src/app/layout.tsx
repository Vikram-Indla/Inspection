import "./tokens.css";
import PwaRegister from "@/components/PwaRegister";
import "./astryx.css";

export const viewport = { themeColor: "#0866FF" };
export const metadata = {
  manifest: "/manifest.json",
  title: "MIM Inspection Platform",
  description: "Ministry of Industry and Mineral Resources — MVP1 Inspection Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body><PwaRegister />{children}</body>
    </html>
  );
}
