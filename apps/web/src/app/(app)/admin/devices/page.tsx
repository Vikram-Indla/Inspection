import DevicesScreen from "@/components/sections/admin-devices/devices-screen";
import { loadDevices } from "@/features/admin-devices/queries";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function DevicesPage() {
  const [locale, data] = await Promise.all([getLocale(), loadDevices()]);
  return <DevicesScreen data={data} locale={locale} />;
}
