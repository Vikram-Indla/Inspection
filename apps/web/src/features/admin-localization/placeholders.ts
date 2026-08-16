const TOKEN = /\{\{(\w+)\}\}/g;

export const PLACEHOLDER_SPLIT = /(\{\{\w+\}\})/g;
export const PLACEHOLDER_TOKEN = /^\{\{(\w+)\}\}$/;

function tokensIn(text: string): ReadonlySet<string> {
  return new Set([...text.matchAll(TOKEN)].map(match => match[1]));
}

export function missingPlaceholders(en: string, ar: string): readonly string[] {
  if (ar.trim() === "") return [];
  const translated = tokensIn(ar);
  return [...tokensIn(en)].filter(token => !translated.has(token));
}
