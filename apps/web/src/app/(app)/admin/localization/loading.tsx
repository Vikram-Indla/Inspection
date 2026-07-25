import RouteLoading from "@/components/RouteLoading";

// Route-level loading fallback follows the active locale and announces busy
// state through the shared, accessible route-loading contract.
export default function Loading() {
  return (
    <RouteLoading
      en="Loading localization registry…"
      ar="جارٍ تحميل سجل الترجمات…"
      bodyEn="Loading the RLS-scoped translation dictionary."
      bodyAr="جارٍ تحميل قاموس الترجمات المقيّد حسب صلاحيات الصفوف."
    />
  );
}
