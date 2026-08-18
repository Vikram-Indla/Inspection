import { createComplianceRequest } from "@/app/(app)/admin/compliance-requests/actions";
import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect from "@/components/saqeel/select/select";
import Textarea from "@/components/saqeel/textarea/textarea";
import TextInput from "@/components/saqeel/text-input/text-input";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import ActionForm from "./action-form";
import styles from "./compliance-requests.module.css";

export default function RequestCreate({ locale, defaults }: {
  locale: Locale;
  defaults: { requestType: string; title: string; description: string };
}) {
  const copy = getMessages(locale).adminComplianceRequests;
  const c = copy.create;

  return (
    <ShellPageFrame
      breadcrumbLabel={copy.breadcrumb.create}
      breadcrumbs={[
        { label: copy.breadcrumb.administration, href: "/admin" },
        { label: copy.breadcrumb.list, href: "/admin/compliance-requests" },
        { label: copy.breadcrumb.create },
      ]}
      title={c.title}
    >
      <Card as="section">
        <CardHeader level="h2" title={c.heading} description={c.hint} />
        <CardBody>
          <ActionForm action={createComplianceRequest} redirectOnCreate className={styles.form}>
            <div className={styles.formGrid}>
              <Field label={c.requestType} htmlFor="ccr-type">
                <SaqeelSelect
                  id="ccr-type"
                  name="request_type"
                  label={c.requestType}
                  defaultValue={defaults.requestType}
                  required
                  options={[{ value: "create", label: copy.kinds.create }, { value: "modify", label: copy.kinds.modify }]}
                />
              </Field>
              <Field label={c.titleLabel} htmlFor="ccr-title">
                <TextInput id="ccr-title" name="title" required maxLength={180} placeholder={c.titlePlaceholder} defaultValue={defaults.title} />
              </Field>
              <div className={styles.wide}>
                <Field label={c.description} htmlFor="ccr-desc">
                  <Textarea id="ccr-desc" name="description" rows={4} placeholder={c.descriptionPlaceholder} defaultValue={defaults.description} />
                </Field>
              </div>
              <div className={styles.wide}>
                <Field label={c.comments} htmlFor="ccr-comments">
                  <Textarea id="ccr-comments" name="comments" rows={3} placeholder={c.commentsPlaceholder} />
                </Field>
              </div>
            </div>
            <div className={styles.footer}>
              <Button type="submit" variant="primary" size="sm">{c.submit}</Button>
              <Button href="/admin/compliance-requests" prefetch={false} variant="tertiary" size="sm">{c.cancel}</Button>
            </div>
          </ActionForm>
        </CardBody>
      </Card>
    </ShellPageFrame>
  );
}
