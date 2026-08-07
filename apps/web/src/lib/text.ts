const SEPARATORS = /[_-]+/g;

export function sentenceCase(value: string, locale?: string): string {
  if (!value) return value;
  return value.charAt(0).toLocaleUpperCase(locale) + value.slice(1);
}

export function humaniseEnum(value: string, locale?: string): string {
  return sentenceCase(value.replace(SEPARATORS, " ").trim(), locale);
}
