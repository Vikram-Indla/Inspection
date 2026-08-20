import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import { Skeleton, SkeletonRegion, SkeletonText } from "@/components/saqeel/skeleton/skeleton";
import FactoryWorkspace from "@/components/sections/factories/factory-workspace/factory-workspace";

function SkeletonPanel({ lines = 4 }: { lines?: number }) {
  return (
    <Card as="section">
      <CardHeader title={<Skeleton shape="line" width="half" />} />
      <CardBody><SkeletonText lines={lines} /></CardBody>
    </Card>
  );
}

export default function CrSkeleton({ label, railLabel, contextLabel }: {
  label: string;
  railLabel: string;
  contextLabel: string;
}) {
  return (
    <SkeletonRegion label={label}>
      <FactoryWorkspace
        startLabel={railLabel}
        endLabel={contextLabel}
        start={<SkeletonPanel lines={6} />}
        end={<><SkeletonPanel lines={3} /><SkeletonPanel lines={4} /></>}
      >
        <SkeletonPanel lines={6} />
        <SkeletonPanel lines={5} />
        <SkeletonPanel lines={4} />
      </FactoryWorkspace>
    </SkeletonRegion>
  );
}
