"use client";

import { useState, type ReactNode } from "react";
import Tabs, { tabPanelProps, type TabItem } from "@/components/saqeel/tabs/tabs";
import styles from "./compliance-requests.module.css";

export type WorkspaceTabValue = "dependencies" | "history" | "decisions";

export default function WorkspaceTabs({ label, tabs, panels }: {
  label: string;
  tabs: readonly TabItem<WorkspaceTabValue>[];
  panels: Readonly<Record<WorkspaceTabValue, ReactNode>>;
}) {
  const [tab, setTab] = useState<WorkspaceTabValue>(tabs[0]?.value ?? "dependencies");

  return (
    <div className={styles.tabsWrap}>
      <Tabs items={tabs} value={tab} onChange={setTab} label={label} idBase="ccr-workspace" />
      <div className={styles.tabPanel} {...tabPanelProps("ccr-workspace", tab)}>
        {panels[tab]}
      </div>
    </div>
  );
}
