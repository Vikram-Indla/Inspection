// SAQEEL DS — className joiner (mirrors component-source `cls`).
export const cls = (...a: Array<string | false | null | undefined>): string =>
  a.filter(Boolean).join(" ");
