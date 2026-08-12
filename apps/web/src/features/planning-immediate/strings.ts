import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

export type ImmediateMessages = ReturnType<typeof getMessages>["planning"]["immediate"];

export function immediateMessages(locale: Locale): ImmediateMessages {
  return getMessages(locale).planning.immediate;
}

export type ImmediateScreenStrings = {
  readonly title: string;
  readonly context: string;
  readonly factory360Context: string;
  readonly returnToFactory: string;
};

export function immediateScreenStrings(locale: Locale): ImmediateScreenStrings {
  const { title, context, factory360Context, returnToFactory } = immediateMessages(locale);
  return { title, context, factory360Context, returnToFactory };
}
