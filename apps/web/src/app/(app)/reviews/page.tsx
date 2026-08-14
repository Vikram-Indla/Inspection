import Shell, { preloadShell } from "@/components/Shell";
import ReviewsAccessState from "@/components/sections/reviews/reviews-access-state/reviews-access-state";
import ReviewsScreen from "@/components/sections/reviews/reviews-screen/reviews-screen";
import { hasQueueAccess } from "@/features/reviews/access";
import { loadReviewQueue } from "@/features/reviews/queries";
import { buildReviewsStrings } from "@/features/reviews/strings";
import { getUserRoles } from "@/lib/persona";
import { getLocale } from "@/lib/i18n";
import { getServerUser, supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function Reviews({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  preloadShell("/reviews");
  const params = await searchParams;
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";
  const locale = await getLocale();
  const strings = buildReviewsStrings(locale);
  const { data: { user } } = await getServerUser();
  const { data: roleRows } = user ? await getUserRoles(user.id) : { data: null };

  if (!hasQueueAccess(roleRows)) {
    return (
      <Shell current="/reviews" title={strings.title}>
        <ReviewsAccessState strings={strings} />
      </Shell>
    );
  }

  return (
    <Shell current="/reviews" title={strings.title}>
      <ReviewsScreen
        loaded={await loadReviewQueue(await supabaseServer())}
        filters={{
          query: one(params.q),
          status: one(params.status),
          risk: one(params.risk),
          overdueOnly: one(params.overdue) === "1",
        }}
        strings={strings}
        locale={locale}
      />
    </Shell>
  );
}
