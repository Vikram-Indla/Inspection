import DevicesSkeleton from "@/components/sections/admin-devices/devices-skeleton";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function LoadingDevices() {
  const locale = await getLocale();
  return <DevicesSkeleton label={getMessages(locale).adminDevices.loading} />;
}
