// Shared identity-chrome helper for the shell (ShellClient). Kept as its own
// small dependency-free module rather than exported from the shell component
// itself, so other account-chrome consumers can import it without pulling in
// the shell's full render tree.

// Initials come from the governed display name when one exists ("عبدالله محمد
// القحطاني" -> "عم"), and only fall back to the email local-part when no
// display name is available.
export function initials(label: string) {
  const local = label.includes("@") ? label.split("@")[0] : label;
  const parts = (local || "S").split(/[\s._-]+/).filter(Boolean);
  return parts.slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "S";
}
