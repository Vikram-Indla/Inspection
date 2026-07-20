import React from "react";
import { Menu } from "../feedback/Menu.jsx";
import { Avatar } from "../data/Avatar.jsx";
export function UserMenu({ name, role, items = [] }) {
  return (
    <Menu align="end"
      trigger={<button className="btn btn-ghost" style={{ paddingInline: "var(--space-1)" }} aria-label={"User menu — " + name}><Avatar name={name} /></button>}
      items={[{ label: name + (role ? " · " + role : ""), heading: true }, "sep", ...items]} />
  );
}