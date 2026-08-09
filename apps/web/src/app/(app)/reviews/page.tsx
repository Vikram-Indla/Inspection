import Shell, { preloadShell } from "@/components/Shell";
import { getServerUser, supabaseServer } from "@/lib/supabase-server";
import { getUserRoles } from "@/lib/persona";
import { useT } from "@/lib/i18n";
import { hasQueueAccess } from "@/features/reviews/access";
import { loadReviewQueue } from "@/features/reviews/queries";
import { QueueScreen } from "./QueueScreen";
import { QueueUnauthorized } from "./QueueUnauthorized";

export const dynamic = "force-dynamic";

export default async function Reviews() {
  preloadShell("/reviews");
  const { t } = await useT();
  const title = t("review.list.title", "Inspection review queue");
  const { data: { user } } = await getServerUser();
  const { data: roleRows } = user ? await getUserRoles(user.id) : { data: null };
  if (!hasQueueAccess(roleRows)) {
    return (
      <Shell current="/reviews" title={title}>
        <QueueUnauthorized />
      </Shell>
    );
  }
  const sb = await supabaseServer();
  const loaded = await loadReviewQueue(sb);
  return (
    <Shell current="/reviews" title={title}
      context={<span className="sq-lozenge sq-lozenge--info">{t("review.list.context", "Read-only queue")}</span>}>
      <QueueScreen loaded={loaded} />
    </Shell>
  );
}
