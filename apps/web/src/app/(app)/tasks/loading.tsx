import Shell from "@/components/Shell";
import { Heading, Text } from "@/components/saqeel/type";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function Loading() {
  const { tasks } = getMessages(await getLocale());

  return (
    <Shell current="/tasks" title="">
      <Heading level={1}>{tasks.title}</Heading>
      <Text tone="muted" live="status">{tasks.loading}</Text>
    </Shell>
  );
}
