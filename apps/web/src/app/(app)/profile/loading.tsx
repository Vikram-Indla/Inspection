import RouteLoading from "@/components/RouteLoading";

// K-017 — instant visual acknowledgement while the force-dynamic segment
// renders server-side; shares the RouteLoading skeleton (design-system
// consistent, bilingual, aria-busy).
export default function Loading() {
  return <RouteLoading en="Loading profile…" ar="جارٍ تحميل الملف الشخصي…" />;
}
