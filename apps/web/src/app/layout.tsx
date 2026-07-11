import "./tokens.css";
import "./astryx.css";

export const metadata = {
  title: "MIM Inspection Platform",
  description: "Ministry of Industry and Mineral Resources — MVP1 Inspection Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body>{children}</body>
    </html>
  );
}
