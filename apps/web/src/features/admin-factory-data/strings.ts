import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

export type AdminFactoryDataMessages = ReturnType<typeof adminFactoryDataMessages>;

export function adminFactoryDataMessages(locale: Locale) {
  return getMessages(locale).adminFactoryData;
}

export function resultMessage(code: string, strings: AdminFactoryDataMessages): string {
  const map: Record<string, string> = strings.result;
  return map[code] ?? code;
}
