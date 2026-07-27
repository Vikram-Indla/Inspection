import RouteLoading from "@/components/RouteLoading";

// WA-M6/M8/M9/M10-AC-004 — common Admin route-tree loading state.
// Individual modules may provide a more specific boundary; this fallback keeps
// navigation responsive without asserting that any RLS-scoped data is empty.
export default function AdminLoading() {
  return (
    <RouteLoading
      en="Loading administration"
      ar="جارٍ تحميل الإدارة"
      bodyEn="Verifying access and loading RLS-scoped administration data."
      bodyAr="جارٍ التحقق من الصلاحيات وتحميل بيانات الإدارة المقيّدة حسب صلاحيات الصفوف."
    />
  );
}
