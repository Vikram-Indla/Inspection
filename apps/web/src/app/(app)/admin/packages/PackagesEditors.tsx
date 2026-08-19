import DesignerScreen from "@/components/sections/admin-packages/designer-screen/designer-screen";
import PackagesScreen from "@/components/sections/admin-packages/packages-screen/packages-screen";
import type { EditorStringBags } from "@/features/admin-packages/editor-strings";
import type { PackagesData } from "@/features/admin-packages/queries";
import { isEditableDraft, type PackagesQuery, type VersionRow } from "@/features/admin-packages/view";
import type { Locale } from "@/lib/i18n";
import DraftEditor from "./DraftEditor";
import type { ImpactData } from "./ImpactPanel";
import ImpactPanel from "./ImpactPanel";
import PackagePreview, { type PreviewItem } from "./PackagePreview";
import { ApprovePublish, DeactivatePackage, NewDraftForm, NewPackageForm } from "./PublishControls";
import TemplateRegistry from "./TemplateRegistry";

const EMPTY_IMPACT: ImpactData = { pinned: null, referencing: [], diff: null };

function toPreviewItems(items: PackagesData["items"], locale: Locale): Record<string, PreviewItem> {
  const previewItems: Record<string, PreviewItem> = {};
  for (const item of items) {
    const response = (item.response_model ?? {}) as {
      responses?: string[];
      mapping?: Record<string, { violation?: string; action_form?: string }>;
      requirement?: "required" | "optional" | "conditional";
      scoring_enabled?: boolean;
      conditional?: { visible_when?: string; mandatory_when_visible?: boolean };
    };
    const evidence = item.evidence_rule as { on?: string; type?: string; min?: number; mandatory?: boolean } | null;
    const responses = response.responses ?? [];
    const nonCompliant = response.mapping?.non_compliant;
    previewItems[item.code] = {
      code: item.code,
      title: item.title,
      responses,
      isDate: responses.includes("value_date"),
      evidence: evidence?.on
        ? { type: evidence.type ?? "photo", min: Math.max(1, evidence.min ?? 1), mandatory: !!evidence.mandatory }
        : null,
      conditional: response.conditional?.visible_when ?? null,
      requirement: response.requirement ?? "required",
      mandatoryWhenVisible: !!response.conditional?.mandatory_when_visible,
      scoringEnabled: response.scoring_enabled !== false,
      guidance: locale === "ar" ? (item.guidance_ar ?? item.guidance_en) : (item.guidance_en ?? item.guidance_ar),
      clause: item.regulation_clauses
        ? { clause_ref: item.regulation_clauses.clause_ref, legal_source: item.regulation_clauses.legal_source }
        : null,
      ncViolation: nonCompliant?.violation ?? null,
      ncActionForm: nonCompliant?.action_form ?? null,
    };
  }
  return previewItems;
}

export default function PackagesEditors({ data, query, locale, bags, impact }: {
  data: PackagesData;
  query: PackagesQuery;
  locale: Locale;
  bags: EditorStringBags;
  impact: Map<string, ImpactData>;
}) {
  const previewItems = toPreviewItems(data.items, locale);

  const previewFor = (version: VersionRow) => (
    <PackagePreview
      actionForms={(version.definition.action_forms ?? []).map(form => ({ ...form }))}
      headingLevel={isEditableDraft(version, data.canWrite) ? 5 : 3}
      itemMap={previewItems}
      sections={(version.definition.sections ?? []).map(section => ({
        key: section.key,
        title: section.title ?? section.key,
        items: section.items,
      }))}
      strings={bags.preview}
    />
  );

  if (data.selection) {
    const { version } = data.selection;
    const canDesign = isEditableDraft(version, data.canWrite) && !data.itemBankUnavailable;

    return (
      <DesignerScreen
        data={data}
        deactivateFor={target => <DeactivatePackage strings={bags.publish} versionId={target.id} locale={locale} />}
        designer={canDesign && version ? (
          <>
            <DraftEditor
              catalog={data.items.filter(item => item.active).map(item => ({ code: item.code, title: item.title }))}
              definition={version.definition}
              preview={previewFor(version)}
              strings={bags.draft}
              templates={data.templates
                .filter(template => ["published", "locked"].includes(template.status))
                .map(template => ({
                  id: template.id,
                  label: `${template.template_key} · ${template.version_label}`,
                }))}
              versionId={version.id}
              violations={data.violations.map(violation => ({
                id: violation.code,
                label: `${violation.code} — ${violation.title}`,
              }))}
            />
            <ApprovePublish strings={bags.publish} versionId={version.id} />
          </>
        ) : null}
        impact={<ImpactPanel data={(version && impact.get(version.id)) ?? EMPTY_IMPACT} strings={bags.impact} />}
        locale={locale}
        newDraftForm={<NewDraftForm packageId={data.selection.pkg.id} strings={bags.publish} locale={locale} />}
        preview={version ? previewFor(version) : null}
        query={query}
        selection={data.selection}
      />
    );
  }

  return (
    <PackagesScreen
      data={data}
      locale={locale}
      newPackageForm={<NewPackageForm strings={bags.newPackage} />}
      notFound={query.packageId !== ""}
      query={query}
      readAt={Date.now()}
      templateRegistry={data.canWrite && !data.templatesUnavailable
        ? <TemplateRegistry strings={bags.template} templates={data.templates} locale={locale} />
        : null}
    />
  );
}
