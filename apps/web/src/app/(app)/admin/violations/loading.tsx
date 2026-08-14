import AdminShell from "@/app/(app)/admin/_components/AdminShell";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import { Skeleton, SkeletonRegion } from "@/components/saqeel/skeleton/skeleton";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

const CARDS = 5;
const ROWS = 4;

export default async function Loading() {
  const { enforcement } = getMessages(await getLocale());
  return (
    <AdminShell current="/admin/violations" title={enforcement.catalogue.catalogueTab}>
      <SkeletonRegion label={enforcement.loading}>
        {Array.from({ length: CARDS }, (_unused, card) => (
          <Card as="div" key={card}>
            <CardHeader
              title={<Skeleton shape="line" width="wide" size="lg" />}
              description={<Skeleton shape="line" width="narrow" size="sm" />}
              trailing={<Skeleton shape="pill" width="narrow" />}
            />
            <CardBody gap="tight">
              {Array.from({ length: ROWS }, (_ignored, row) => (
                <Skeleton key={row} shape="line" width={row % 2 === 0 ? "full" : "wide"} size="sm" />
              ))}
            </CardBody>
          </Card>
        ))}
      </SkeletonRegion>
    </AdminShell>
  );
}
