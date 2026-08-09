import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import { Skeleton, SkeletonRegion } from "@/components/saqeel/skeleton/skeleton";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

const SECTIONS = 4;
const ROWS_PER_SECTION = 4;

export default async function Loading() {
  const { regulations } = getMessages(await getLocale());
  return (
    <SkeletonRegion label={regulations.loading}>
      {Array.from({ length: SECTIONS }, (_unused, section) => (
        <Card as="div" key={section}>
          <CardHeader title={<Skeleton shape="line" width="half" size="lg" />} />
          <CardBody gap="tight">
            {Array.from({ length: ROWS_PER_SECTION }, (_ignored, row) => (
              <Skeleton key={row} shape="line" width={row % 2 === 0 ? "full" : "wide"} size="sm" />
            ))}
          </CardBody>
        </Card>
      ))}
    </SkeletonRegion>
  );
}
