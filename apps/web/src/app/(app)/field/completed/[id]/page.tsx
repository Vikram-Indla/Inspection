import { redirect } from "next/navigation";
import CompletedReceiptScreen from "@/components/sections/field-completed/completed-receipt-screen";
import CompletedUnavailable from "@/components/sections/field-completed/completed-unavailable";
import { loadCompletedReceipt } from "@/features/field-completed/queries";
import { getLocale } from "@/lib/i18n";

export default async function CompletedInspectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [locale, { id }] = await Promise.all([getLocale(), params]);
  const result = await loadCompletedReceipt(id);

  if (result.status === "unauthenticated") redirect("/login");
  if (result.status === "unavailable") return <CompletedUnavailable locale={locale} />;

  return <CompletedReceiptScreen record={result.record} locale={locale} />;
}
