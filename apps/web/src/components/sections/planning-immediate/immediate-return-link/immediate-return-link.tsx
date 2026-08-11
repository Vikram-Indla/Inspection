import Button from "@/components/saqeel/button/button";
import type { ImmediateScreenStrings } from "@/features/planning-immediate/strings";
import type { FactoryHandoff } from "@/features/planning-immediate/types";

export default function ImmediateReturnLink({ handoff, strings }: {
  handoff: FactoryHandoff;
  strings: ImmediateScreenStrings;
}) {
  if (handoff.returnTo === null) return null;

  return (
    <Button
      variant="link"
      size="sm"
      icon="previousPage"
      href={handoff.returnTo}
      label={strings.returnToFactory}
    >
      {strings.returnToFactory}
    </Button>
  );
}
