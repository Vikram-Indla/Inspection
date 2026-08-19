"use client";

import { useActionState } from "react";
import Button from "@/components/saqeel/button/button";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect from "@/components/saqeel/select/select";
import Textarea from "@/components/saqeel/textarea/textarea";
import { Text } from "@/components/saqeel/type";
import { issueDeviceCommand, type DeviceResult } from "@/app/(app)/admin/devices/actions";
import { deviceResultMessage, type AdminDevicesMessages } from "@/features/admin-devices/strings";
import styles from "./devices.module.css";

const COMMANDS = ["suspend", "resume", "expire_packages", "remote_wipe"] as const;

export default function DeviceCommandForm({ deviceId, strings }: {
  deviceId: string;
  strings: AdminDevicesMessages;
}) {
  const [state, action, pending] = useActionState<DeviceResult, FormData>(issueDeviceCommand, {});
  const c = strings.command;

  return (
    <form action={action} className={styles.commandForm}>
      <input type="hidden" name="deviceId" value={deviceId} />
      <Field label={c.command} htmlFor={`cmd-${deviceId}`}>
        <SaqeelSelect id={`cmd-${deviceId}`} name="command" label={c.command} placeholder={c.commandPlaceholder} defaultValue="" required
          options={COMMANDS.map(command => ({ value: command, label: c[command] }))} />
      </Field>
      <Field label={c.reason} htmlFor={`rsn-${deviceId}`}>
        <Textarea id={`rsn-${deviceId}`} name="reason" rows={2} required placeholder={c.reasonPlaceholder} />
      </Field>
      <div className={styles.formActions}>
        <Button type="submit" variant="primary" disabled={pending}>{pending ? c.queuing : c.queue}</Button>
        {state.error ? <Text role="label" tone="danger" live="alert">{deviceResultMessage(state.error, strings)}</Text> : null}
        {state.notice ? <Text role="label" tone="success" live="status">{deviceResultMessage(state.notice, strings)}</Text> : null}
      </div>
    </form>
  );
}
