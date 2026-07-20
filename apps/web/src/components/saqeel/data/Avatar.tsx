import React from "react";

export interface AvatarProps {
  name?: string;
  size?: "sm" | "md" | "lg";
  src?: string;
}

export function Avatar({ name = "", size = "md", src }: AvatarProps) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");
  const cls = "avatar" + (size === "sm" ? " avatar-sm" : size === "lg" ? " avatar-lg" : "");
  if (src) return <img className={cls} src={src} alt={name} style={{ objectFit: "cover" }} />;
  return (
    <span className={cls} aria-hidden="true" title={name}>
      {initials}
    </span>
  );
}

export interface UserChipProps {
  name?: string;
  role?: string;
  size?: "sm" | "md" | "lg";
}

export function UserChip({ name, role, size = "md" }: UserChipProps) {
  return (
    <span className="user-chip">
      <Avatar name={name} size={size === "lg" ? "md" : "sm"} />
      <span className="stack" style={{ gap: 0 }}>
        <span style={{ fontWeight: 500 }}>{name}</span>
        {role && <span className="t-caption">{role}</span>}
      </span>
    </span>
  );
}
