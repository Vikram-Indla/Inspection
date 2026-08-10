export type Shape<T> = (fields: Fields) => T;

export type Fields = {
  readonly text: (key: string) => string;
  readonly optionalText: (key: string) => string | null;
  readonly number: (key: string) => number;
  readonly optionalNumber: (key: string) => number | null;
  readonly flag: (key: string) => boolean;
  readonly optionalFlag: (key: string) => boolean | null;
  readonly optionalTextList: (key: string) => string[] | null;
  readonly optionalRecord: (key: string) => Record<string, unknown> | null;
  readonly raw: (key: string) => unknown;
  readonly toOne: <E>(key: string, shape: Shape<E>) => E | null;
  readonly toMany: <E>(key: string, shape: Shape<E>) => E[];
  readonly optionalToMany: <E>(key: string, shape: Shape<E>) => E[] | null;
};

export class ShapeMismatch extends Error {}

function describe(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "nothing";
  if (Array.isArray(value)) return "an array";
  return `a ${typeof value}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function reject(path: string, expected: string, value: unknown): never {
  throw new ShapeMismatch(`${path} expected ${expected}, received ${describe(value)}`);
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isAbsent(value: unknown): boolean {
  return value === null || value === undefined;
}

function fieldsOf(row: Record<string, unknown>, path: string): Fields {
  const at = (key: string) => `${path}.${key}`;

  return {
    raw: key => row[key],

    text: key => {
      const value = row[key];
      return typeof value === "string" ? value : reject(at(key), "a string", value);
    },

    optionalText: key => {
      const value = row[key];
      if (isAbsent(value)) return null;
      return typeof value === "string" ? value : reject(at(key), "a string or null", value);
    },

    number: key => {
      const parsed = asNumber(row[key]);
      return parsed === null ? reject(at(key), "a number", row[key]) : parsed;
    },

    optionalNumber: key => {
      const value = row[key];
      if (isAbsent(value)) return null;
      const parsed = asNumber(value);
      return parsed === null ? reject(at(key), "a number or null", value) : parsed;
    },

    flag: key => {
      const value = row[key];
      return typeof value === "boolean" ? value : reject(at(key), "a boolean", value);
    },

    optionalFlag: key => {
      const value = row[key];
      if (isAbsent(value)) return null;
      return typeof value === "boolean" ? value : reject(at(key), "a boolean or null", value);
    },

    optionalTextList: key => {
      const value = row[key];
      if (isAbsent(value)) return null;
      if (!Array.isArray(value)) return reject(at(key), "an array of strings or null", value);
      return value.map((entry, index) =>
        typeof entry === "string" ? entry : reject(`${at(key)}[${index}]`, "a string", entry));
    },

    optionalRecord: key => {
      const value = row[key];
      if (isAbsent(value)) return null;
      return isRecord(value) ? value : reject(at(key), "an object or null", value);
    },

    toOne: (key, shape) => {
      const value = row[key];
      if (isAbsent(value)) return null;
      const single = Array.isArray(value) ? value[0] : value;
      if (isAbsent(single)) return null;
      return applyShape(single, shape, at(key));
    },

    toMany: (key, shape) => {
      const value = row[key];
      if (isAbsent(value)) return [];
      const entries = Array.isArray(value) ? value : [value];
      return entries.map((entry, index) => applyShape(entry, shape, `${at(key)}[${index}]`));
    },

    optionalToMany: (key, shape) => {
      const value = row[key];
      if (isAbsent(value)) return null;
      const entries = Array.isArray(value) ? value : [value];
      return entries.map((entry, index) => applyShape(entry, shape, `${at(key)}[${index}]`));
    },
  };
}

export function applyShape<T>(value: unknown, shape: Shape<T>, path: string): T {
  if (!isRecord(value)) return reject(path, "an object", value);
  return shape(fieldsOf(value, path));
}
