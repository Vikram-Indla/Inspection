"use client";

import { useActionState } from "react";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect from "@/components/saqeel/select/select";
import TextInput from "@/components/saqeel/text-input/text-input";
import Textarea from "@/components/saqeel/textarea/textarea";
import Button from "@/components/saqeel/button/button";
import { createNotificationRule, type NotifRuleResult } from "@/app/(app)/admin/notifications/actions";
import { eventLabel, channelLabel, type AdminNotificationsMessages } from "@/features/admin-notifications/strings";
import type { RoleOption } from "@/features/admin-notifications/types";
import NotifMsg from "./notif-msg";
import styles from "./notifications.module.css";

const EVENT_KEYS = ["assignment", "reschedule", "review_decision", "virtual_closed", "virtual_rescheduled", "virtual_scheduled", "visit_cancelled"];
const CHANNELS = ["inapp", "push", "sms", "email"];

export default function NotifCreateForm({ roles, rolesAvailable, strings }: {
  roles: readonly RoleOption[];
  rolesAvailable: boolean;
  strings: AdminNotificationsMessages;
}) {
  const [state, action, pending] = useActionState<NotifRuleResult, FormData>(createNotificationRule, {});
  const f = strings.form;
  const roleOptions = roles.map(role => ({ value: role.role_key, label: role.title }));

  return (
    <form action={action} className={styles.formStack}>
      <div className={styles.formGrid}>
        <Field label={f.eventKey} htmlFor="ntf-event">
          <SaqeelSelect id="ntf-event" name="event_key" label={f.eventKey} placeholder={f.eventPlaceholder} defaultValue="" required
            options={EVENT_KEYS.map(key => ({ value: key, label: eventLabel(key, strings) }))} />
        </Field>
        <Field label={f.channel} htmlFor="ntf-channel">
          <SaqeelSelect id="ntf-channel" name="channel" label={f.channel} defaultValue="inapp" required
            options={CHANNELS.map(key => ({ value: key, label: channelLabel(key, strings) }))} />
        </Field>
        <Field label={f.recipientRole} htmlFor="ntf-recipient">
          <SaqeelSelect id="ntf-recipient" name="recipient_role" label={f.recipientRole} placeholder={f.rolePlaceholder} defaultValue="" required disabled={!rolesAvailable} options={roleOptions} />
        </Field>
        <Field label={f.slaMinutes} htmlFor="ntf-sla">
          <TextInput id="ntf-sla" name="sla_minutes" type="number" inputMode="numeric" placeholder={f.slaPlaceholder} />
        </Field>
        <Field label={f.escalationRole} htmlFor="ntf-escalation">
          <SaqeelSelect id="ntf-escalation" name="escalation_role" label={f.escalationRole} defaultValue="" disabled={!rolesAvailable}
            options={[{ value: "", label: f.escalationPlaceholder }, ...roleOptions]} />
        </Field>
      </div>
      <Field label={f.template} htmlFor="ntf-template" hint={f.templateNote}>
        <Textarea id="ntf-template" name="template" rows={2} required placeholder={f.templatePlaceholder} />
      </Field>
      <div className={styles.formActions}>
        <Button type="submit" variant="primary" disabled={pending || !rolesAvailable}>{pending ? strings.actions.creating : strings.actions.create}</Button>
        <NotifMsg state={state} strings={strings} />
      </div>
    </form>
  );
}
