import { CardGrid } from "@/components/saqeel/card/card";
import StatCard from "@/components/saqeel/stat-card/stat-card";

export type VisitStatusTile = {
  readonly key: string;
  readonly label: string;
  readonly count: number | null;
  readonly href: string;
  readonly active: boolean;
};

export default function VisitStatusTiles({ tiles, strings }: {
  tiles: readonly VisitStatusTile[];
  strings: { readonly groupLabel: string; readonly unavailable: string; readonly activeNote: string };
}) {
  return (
    <section role="group" aria-label={strings.groupLabel}>
      <CardGrid min="sm">
        {tiles.map(tile => (
          <StatCard
            key={tile.key}
            label={tile.label}
            value={tile.count === null ? strings.unavailable : tile.count}
            href={tile.href}
            sub={tile.active ? strings.activeNote : undefined}
          />
        ))}
      </CardGrid>
    </section>
  );
}
