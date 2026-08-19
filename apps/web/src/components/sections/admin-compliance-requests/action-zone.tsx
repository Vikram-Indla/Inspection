import {
  cancelComplianceRequest, publishComplianceRequest, rejectComplianceRequest,
  returnComplianceRequest, reviseComplianceRequest, submitComplianceRequest,
} from "@/app/(app)/admin/compliance-requests/actions";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import TextInput from "@/components/saqeel/text-input/text-input";
import type { RequestRow } from "@/features/admin-compliance-requests/types";
import { fill, type Messages } from "@/i18n/messages";
import ActionForm from "./action-form";
import styles from "./compliance-requests.module.css";

type Copy = Messages["adminComplianceRequests"];

export default function ActionZone({ request, editable, reviewable, publishable, canRevise, copy }: {
  request: RequestRow;
  editable: boolean;
  reviewable: boolean;
  publishable: boolean;
  canRevise: boolean;
  copy: Copy;
}) {
  const az = copy.actionZone;

  return (
    <Card as="section" role="region">
      <CardHeader level="h2" title={az.heading} description={az.hint} />
      <CardBody>
        <div className={styles.actionList}>
          {editable ? (
            <>
              <ActionForm action={submitComplianceRequest}>
                <input type="hidden" name="request_id" value={request.id} />
                <Button type="submit" variant="primary" size="sm">{az.submit}</Button>
              </ActionForm>
              <ActionForm action={cancelComplianceRequest}>
                <input type="hidden" name="request_id" value={request.id} />
                <input type="hidden" name="comments" value={az.cancelComment} />
                <Button type="submit" variant="tertiary" size="sm">{az.cancel}</Button>
              </ActionForm>
            </>
          ) : null}

          {canRevise ? (
            <ActionForm action={reviseComplianceRequest} className={styles.inlineForm}>
              <input type="hidden" name="request_id" value={request.id} />
              <TextInput name="comments" placeholder={az.revisePlaceholder} label={az.revisePlaceholder} />
              <Button type="submit" variant="primary" size="sm">{fill(az.revise, { n: request.current_revision + 1 })}</Button>
            </ActionForm>
          ) : null}

          {reviewable ? (
            <>
              <ActionForm action={returnComplianceRequest} className={styles.inlineForm}>
                <input type="hidden" name="request_id" value={request.id} />
                <TextInput name="comments" required placeholder={az.returnPlaceholder} label={az.returnPlaceholder} />
                <Button type="submit" variant="secondary" size="sm">{az.return}</Button>
              </ActionForm>
              <ActionForm action={rejectComplianceRequest} className={styles.inlineForm}>
                <input type="hidden" name="request_id" value={request.id} />
                <TextInput name="comments" required placeholder={az.rejectPlaceholder} label={az.rejectPlaceholder} />
                <Button type="submit" variant="danger" size="sm">{az.reject}</Button>
              </ActionForm>
            </>
          ) : null}

          {publishable ? (
            <ActionForm action={publishComplianceRequest}>
              <input type="hidden" name="request_id" value={request.id} />
              <Button type="submit" variant="primary" size="sm">{az.publish}</Button>
            </ActionForm>
          ) : null}
        </div>
      </CardBody>
    </Card>
  );
}
