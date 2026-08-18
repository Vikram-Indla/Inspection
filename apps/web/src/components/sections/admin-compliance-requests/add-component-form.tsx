import { addComplianceRequestComponent } from "@/app/(app)/admin/compliance-requests/actions";
import Button from "@/components/saqeel/button/button";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect from "@/components/saqeel/select/select";
import Textarea from "@/components/saqeel/textarea/textarea";
import TextInput from "@/components/saqeel/text-input/text-input";
import { Text } from "@/components/saqeel/type";
import type { Messages } from "@/i18n/messages";
import ActionForm from "./action-form";
import styles from "./compliance-requests.module.css";

type Copy = Messages["adminComplianceRequests"];

const PROPOSED_DEFAULT = '{\n  "code": "",\n  "title": ""\n}';

export default function AddComponentForm({ requestId, isModify, copy }: {
  requestId: string;
  isModify: boolean;
  copy: Copy;
}) {
  const a = copy.addComponent;

  return (
    <details className={styles.advanced}>
      <summary className={styles.summary}>{a.heading}</summary>
      <div className={styles.advancedBody}>
        <Text tone="muted">{a.hint}</Text>
        <ActionForm action={addComplianceRequestComponent} className={styles.form}>
          <input type="hidden" name="request_id" value={requestId} />
          <div className={styles.formGrid}>
            <Field label={a.type} htmlFor="ccr-add-kind">
              <SaqeelSelect
                id="ccr-add-kind"
                name="entity_kind"
                label={a.type}
                defaultValue="regulation"
                required
                options={[
                  { value: "regulation", label: copy.kinds.regulation },
                  { value: "inspection_item", label: copy.kinds.inspection_item },
                  { value: "violation", label: copy.kinds.violation },
                  { value: "penalty", label: copy.kinds.penalty },
                ]}
              />
            </Field>
            <Field label={a.target} htmlFor="ccr-add-target">
              <TextInput id="ccr-add-target" name="target_entity_id" placeholder={isModify ? a.targetRequired : a.targetOptional} />
            </Field>
          </div>
          <div className={styles.formGrid}>
            <Field label={a.current} htmlFor="ccr-add-current">
              <Textarea id="ccr-add-current" name="current_snapshot" rows={8} defaultValue="{}" placeholder="{}" />
            </Field>
            <Field label={a.proposed} htmlFor="ccr-add-proposed">
              <Textarea id="ccr-add-proposed" name="proposed_snapshot" rows={8} required defaultValue={PROPOSED_DEFAULT} placeholder={PROPOSED_DEFAULT} />
            </Field>
          </div>
          <Field label={a.comments} htmlFor="ccr-add-comments">
            <Textarea id="ccr-add-comments" name="component_comments" rows={2} placeholder={a.comments} />
          </Field>
          <div className={styles.footer}>
            <Button type="submit" variant="secondary" size="sm">{a.add}</Button>
          </div>
        </ActionForm>
      </div>
    </details>
  );
}
