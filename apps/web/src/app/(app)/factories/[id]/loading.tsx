import { useT } from "@/lib/i18n";
import { Card, CardBody } from "@/components/saqeel/card/card";
import { SkeletonRegion, SkeletonText } from "@/components/saqeel/skeleton/skeleton";
import FactoryDossier from "@/components/sections/factories/factory-dossier/factory-dossier";

export default async function Loading() {
  const { t } = await useT();
  const label = t("f360.loading.dossier", "Loading factory profile");
  return (
    <SkeletonRegion label={label}>
      <FactoryDossier
        aside={
          <Card as="section">
            <CardBody>
              <SkeletonText lines={4} />
            </CardBody>
          </Card>
        }
      >
        <Card as="section">
          <CardBody>
            <SkeletonText lines={5} />
          </CardBody>
        </Card>
      </FactoryDossier>
    </SkeletonRegion>
  );
}
