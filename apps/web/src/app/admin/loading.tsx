import RouteLoading from "@/components/RouteLoading";

// WA-M9/M10-AC-004 — shared fallback for the top-level Admin configuration
// routes that live outside the authenticated `(app)` route group.
export default function AdminConfigurationLoading() {
  return (
    <RouteLoading
      en="Loading administration configuration"
      ar="جارٍ تحميل تهيئة الإدارة"
      bodyEn="Verifying capabilities and loading governed configuration."
      bodyAr="جارٍ التحقق من الصلاحيات وتحميل التهيئة الخاضعة للحوكمة."
    />
  );
}
