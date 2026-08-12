import { Card, CardBody, CardGrid, CardHeader, CardValueSlot } from "@/components/saqeel/card/card";
import { Skeleton, SkeletonRegion } from "@/components/saqeel/skeleton/skeleton";

function GroupTileSkeleton() {
  return (
    <Card as="div">
      <CardBody gap="tight">
        <Skeleton shape="line" width="wide" size="sm" />
        <CardValueSlot><Skeleton shape="line" width="tiny" size="lg" /></CardValueSlot>
        <Skeleton shape="line" width="half" size="sm" />
      </CardBody>
    </Card>
  );
}

export default function OperationsBoardSkeleton({ label }: { label: string }) {
  return (
    <div data-sqx-cards="flush">
      <SkeletonRegion label={label}>
        <Card as="div">
          <CardHeader
            title={<Skeleton shape="line" width="narrow" size="lg" />}
            description={<Skeleton shape="line" width="wide" size="sm" />}
          />
          <CardBody>
            <CardGrid min="sm">
              {Array.from({ length: 2 }, (_, index) => <GroupTileSkeleton key={index} />)}
            </CardGrid>
          </CardBody>
        </Card>
      </SkeletonRegion>
    </div>
  );
}
