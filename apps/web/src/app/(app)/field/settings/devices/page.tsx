import Link from "next/link";
import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import { useT } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import TrustedDevicesClient from "./TrustedDevicesClient";

export default async function FieldTrustedDevicesPage() {
  const [sb, { t, locale }] = await Promise.all([supabaseServer(), useT()]);
  const { data: { user }, error } = await getVerifiedUser(sb);
  if (error || !user) redirect("/login");

  return (
    <Shell current="/field/settings" title={locale === "ar" ? "الأجهزة الموثوقة" : t("field.devices.title", "Trusted devices")}>
      <div className="ax-field-page" style={{ display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
        <Link className="ax-link" href="/field/settings" prefetch={false}>
          {locale === "ar" ? "← رجوع إلى الإعدادات" : t("field.devices.backToSettings", "← Back to settings")}
        </Link>
        <TrustedDevicesClient locale={locale} />
      </div>
    </Shell>
  );
}
