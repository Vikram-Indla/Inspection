const SECRET_KEY = /(password|secret|service.?role|token|authorization|api.?key|jwt)/i;
const JWT_LIKE = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g;

export function redact(value, key = "") {
  if (SECRET_KEY.test(key)) return "[REDACTED]";
  if (typeof value === "string") return value.replace(JWT_LIKE, "[REDACTED_JWT]");
  if (Array.isArray(value)) return value.map(item => redact(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [childKey, redact(childValue, childKey)]),
    );
  }
  return value;
}
export function safeJson(value) {
  return `${JSON.stringify(redact(value), null, 2)}\n`;
}
