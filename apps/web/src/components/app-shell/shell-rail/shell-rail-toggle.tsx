"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/saqeel/icon/icon";
import styles from "./shell-rail.module.css";

const STORAGE_KEY = "saqeel-shell-collapsed";
const RAIL_ATTRIBUTE = "data-shell-rail";

function applyRailState(collapsed: boolean): void {
  document.documentElement.setAttribute(RAIL_ATTRIBUTE, collapsed ? "collapsed" : "expanded");
}

export default function ShellRailToggle({ collapseLabel, expandLabel }: {
  collapseLabel: string;
  expandLabel: string;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = (() => {
      try {
        return localStorage.getItem(STORAGE_KEY) === "1";
      } catch {
        return false;
      }
    })();
    setCollapsed(stored);
    applyRailState(stored);
  }, []);

  const label = collapsed ? expandLabel : collapseLabel;

  function toggle(): void {
    const next = !collapsed;
    setCollapsed(next);
    applyRailState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      applyRailState(next);
    }
  }

  return (
    <button
      className={styles.toggle}
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      aria-controls="sqx-shell-rail"
      aria-expanded={!collapsed}
    >
      <Icon name="collapseRail" size="sm" mirrored />
    </button>
  );
}
