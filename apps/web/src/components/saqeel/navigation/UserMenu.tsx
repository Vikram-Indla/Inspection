"use client";
import React from "react";
import { Menu, type MenuItem } from "../feedback/Menu";
import { Avatar } from "../data/Avatar";

export interface UserMenuProps {
  name: string;
  role?: string;
  items?: MenuItem[];
}

export function UserMenu({ name, role, items = [] }: UserMenuProps) {
  return (
    <Menu
      align="end"
      trigger={
        <button
          className="btn btn-ghost btn-touch"
          style={{ paddingInline: "var(--space-1)" }}
          aria-label={"User menu — " + name}
        >
          <Avatar name={name} />
        </button>
      }
      items={[{ label: name + (role ? " · " + role : ""), heading: true }, "sep", ...items]}
    />
  );
}
