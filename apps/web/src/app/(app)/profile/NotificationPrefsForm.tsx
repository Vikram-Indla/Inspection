"use client";
import { useActionState } from "react";
import Button from "@/components/saqeel/button/button";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import { Switch } from "@/components/saqeel/inputs/Choice";
import { saveNotificationPreferences, type ProfileResult } from "./actions";
import styles from "@/components/sections/profile/profile.module.css";

export type PrefsLabels = {
  heading: string; push: string; sms: string; email: string; inappNote: string;
  save: string; saving: string; saved: string;
};

export default function NotificationPrefsForm({
  push, sms, email, l,
}: { push: boolean; sms: boolean; email: boolean; l: PrefsLabels }) {
  const [state, action, pending] = useActionState<ProfileResult, FormData>(saveNotificationPreferences, {});
  return (
    <form action={action} className={styles.prefsForm}>
      <Text tone="muted">{l.inappNote}</Text>
      <Switch name="push_enabled" defaultChecked={push} label={l.push} />
      <Switch name="sms_enabled" defaultChecked={sms} label={l.sms} />
      <Switch name="email_enabled" defaultChecked={email} label={l.email} />
      <div className={styles.prefsActions}>
        <Button type="submit" variant="primary" size="sm" disabled={pending} label={pending ? l.saving : l.save}>
          {pending ? l.saving : l.save}
        </Button>
        {state.ok ? <StatusPill tone="success">{l.saved}</StatusPill> : null}
        {state.error ? <StatusPill tone="danger">{state.error}</StatusPill> : null}
      </div>
    </form>
  );
}
