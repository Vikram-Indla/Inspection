// Shared identity-chrome helpers for the shell family (ShellClient,
// AdminShellClient). Kept as a small dependency-free module rather than
// exported from either shell component, since ShellClient renders
// AdminShellClient and a cross-import back the other way would be circular.

// Initials come from the governed display name when one exists ("عبدالله محمد
// القحطاني" -> "عم"), and only fall back to the email local-part when no
// display name is available.
export function initials(label: string) {
  const local = label.includes("@") ? label.split("@")[0] : label;
  const parts = (local || "S").split(/[\s._-]+/).filter(Boolean);
  return parts.slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "S";
}
