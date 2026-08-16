import { getPinnedActiveImpact } from "@/app/(app)/admin/packages/actions";
import type { DefinitionDiff, ImpactData, ReferencingPackage } from "@/app/(app)/admin/packages/ImpactPanel";
import { currentPublished, orderedVersions, type Definition, type PackageRow } from "./view";

function codeSections(definition: Definition): Map<string, string> {
  const result = new Map<string, string>();
  for (const section of definition.sections ?? []) {
    for (const code of section.items ?? []) if (!result.has(code)) result.set(code, section.key ?? "");
  }
  return result;
}

function formKeys(definition: Definition): Set<string> {
  return new Set((definition.action_forms ?? []).map(form => form.key).filter(Boolean));
}

export async function loadImpactMap(
  packages: readonly PackageRow[],
  today: string,
): Promise<Map<string, ImpactData>> {
  const versions = packages.flatMap(pkg => orderedVersions(pkg).map(version => ({ pkg, version })));
  const entries = await Promise.all(versions.map(async ({ pkg, version }) => {
    const codes = new Set(codeSections(version.definition).keys());
    const referencing: ReferencingPackage[] = [];
    for (const other of packages) {
      if (other.id === pkg.id) continue;
      const published = currentPublished(other, today);
      if (!published) continue;
      const shared = [...codes].filter(code => codeSections(published.definition).has(code)).sort();
      if (shared.length) {
        referencing.push({ code: other.code, title: other.title, label: published.version_label, sharedItems: shared });
      }
    }

    const baseline = currentPublished(pkg, today);
    let diff: DefinitionDiff | null = null;
    if (baseline?.id === version.id) {
      diff = { isCurrentPublished: true, comparedLabel: baseline.version_label, added: [], removed: [], moved: [], formsAdded: [], formsRemoved: [] };
    } else if (baseline) {
      const next = codeSections(version.definition);
      const base = codeSections(baseline.definition);
      const nextCodes = new Set(next.keys());
      const baseCodes = new Set(base.keys());
      const nextForms = formKeys(version.definition);
      const baseForms = formKeys(baseline.definition);
      diff = {
        isCurrentPublished: false,
        comparedLabel: baseline.version_label,
        added: [...nextCodes].filter(code => !baseCodes.has(code)).sort(),
        removed: [...baseCodes].filter(code => !nextCodes.has(code)).sort(),
        moved: [...nextCodes].filter(code => baseCodes.has(code) && next.get(code) !== base.get(code)).sort(),
        formsAdded: [...nextForms].filter(key => !baseForms.has(key)).sort(),
        formsRemoved: [...baseForms].filter(key => !nextForms.has(key)).sort(),
      };
    }

    return [version.id, { pinned: await getPinnedActiveImpact(version.id), referencing, diff } as ImpactData] as const;
  }));
  return new Map(entries);
}
