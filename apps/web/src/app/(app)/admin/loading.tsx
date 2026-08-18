import RouteLoading from "@/components/RouteLoading";

export default function AdminLoading() {
  return (
    <RouteLoading
      framed
      en="Loading administration"
      ar="جارٍ تحميل الإدارة"
      bodyEn="Checking your access and loading the records you can see."
      bodyAr="جارٍ التحقق من صلاحياتك وتحميل السجلات التي يمكنك الاطلاع عليها."
    />
  );
}
