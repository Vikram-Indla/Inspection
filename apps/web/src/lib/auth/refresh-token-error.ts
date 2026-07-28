type AuthErrorLike = {
  code?: unknown;
  message?: unknown;
};

export function isInvalidRefreshToken(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const candidate = error as AuthErrorLike;
  const code = typeof candidate.code === "string" ? candidate.code : "";
  const message = typeof candidate.message === "string" ? candidate.message : "";

  return code === "refresh_token_not_found"
    || /invalid refresh token|refresh token (?:is )?not (?:valid|found)/i.test(message);
}
