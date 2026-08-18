import { addComplianceRequestDependency } from "@/app/(app)/admin/compliance-requests/actions";
import Button from "@/components/saqeel/button/button";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect from "@/components/saqeel/select/select";
import { Text } from "@/components/saqeel/type";
import type { Component, Dependency } from "@/features/admin-compliance-requests/types";
import type { Messages } from "@/i18n/messages";
import ActionForm from "./action-form";
import styles from "./compliance-requests.module.css";

type Copy = Messages["adminComplianceRequests"];

export default function DependenciesPanel({ requestId, dependencies, components, editable, labelForComponent, copy }: {
  requestId: string;
  dependencies: readonly Dependency[];
  components: readonly Component[];
  editable: boolean;
  labelForComponent: (id: string) => string;
  copy: Copy;
}) {
  const d = copy.dependencies;

  return (
    <div className={styles.panelStack}>
      {dependencies.length === 0 ? (
        <Text tone="muted">{d.empty}</Text>
      ) : (
        <ol className={styles.tree}>
          {dependencies.map(dependency => (
            <li key={dependency.id} className={styles.treeRow}>
              <a href={`#component-${dependency.parent_component_id}`} className={styles.treeLink}>
                <Text role="label" as="span" dir="auto">{labelForComponent(dependency.parent_component_id)}</Text>
              </a>
              <span aria-hidden="true" className={styles.treeArrow}>→</span>
              <a href={`#component-${dependency.child_component_id}`} className={styles.treeLink}>
                <Text role="label" as="span" dir="auto">{labelForComponent(dependency.child_component_id)}</Text>
              </a>
            </li>
          ))}
        </ol>
      )}

      {editable && components.length >= 2 ? (
        <ActionForm action={addComplianceRequestDependency} className={styles.form}>
          <input type="hidden" name="request_id" value={requestId} />
          <div className={styles.formGrid}>
            <Field label={d.parent} htmlFor="ccr-dep-parent">
              <SaqeelSelect id="ccr-dep-parent" name="parent_component_id" label={d.parent} required
                options={components.map(component => ({ value: component.id, label: labelForComponent(component.id) }))} />
            </Field>
            <Field label={d.child} htmlFor="ccr-dep-child">
              <SaqeelSelect id="ccr-dep-child" name="child_component_id" label={d.child} required
                options={components.map(component => ({ value: component.id, label: labelForComponent(component.id) }))} />
            </Field>
          </div>
          <div className={styles.footer}>
            <Button type="submit" variant="secondary" size="sm">{d.add}</Button>
          </div>
        </ActionForm>
      ) : null}
    </div>
  );
}
