import type { IconName } from "@/components/saqeel/icon/icon-registry";
import type { BuiltShellNavGroup, BuiltShellNavItem } from "@/lib/shell-navigation";
import { initials } from "@/lib/shell-identity";
import type { ShellIdentity, ShellNavEntry, ShellNavGroup, ShellNavItem } from "./types";

type Translate = (key: string, fallback: string) => string;
type Locale = "ar" | "en";

const ADMIN_HUB_ORDER = ["people", "rules", "risk", "connections", "governance", "security"] as const;
type AdminHubId = (typeof ADMIN_HUB_ORDER)[number];

const ADMIN_HUB_ITEMS: Readonly<Record<AdminHubId, readonly string[]>> = {
  people: ["adm-users"],
  rules: ["adm-lookup", "adm-survey", "adm-planning-expiry", "adm-planning-lookups", "adm-planning-status", "adm-compliance-requests"],
  risk: ["adm-risk"],
  connections: ["adm-integration", "adm-gis", "adm-gis-spatial"],
  governance: ["adm-notif", "adm-delegation", "adm-operations", "adm-enforcement-recommendations", "adm-workflows"],
  security: ["adm-audit", "adm-access-review", "adm-devices"],
};

const ADMIN_HUB_ICON: Readonly<Record<AdminHubId, IconName>> = {
  people: "access",
  rules: "library",
  risk: "risk",
  connections: "workflow",
  governance: "radar",
  security: "access",
};

const ADMIN_HUB_LABEL_KEY: Readonly<Record<AdminHubId, string>> = {
  people: "admin.shell.hub.people",
  rules: "admin.shell.hub.rules",
  risk: "admin.shell.hub.risk",
  connections: "admin.shell.hub.connections",
  governance: "admin.shell.hub.governance",
  security: "admin.shell.hub.security",
};

const ADMIN_HUB_LABEL_EN: Readonly<Record<AdminHubId, string>> = {
  people: "People & Access",
  rules: "Rules & Content",
  risk: "Risk & Intelligence",
  connections: "Connections & Geography",
  governance: "Governance & Operations",
  security: "Security & Audit",
};

function toNavItem(item: BuiltShellNavItem, locale: Locale, t: Translate): ShellNavItem {
  const disabledReason = item.disabledReasonKey
    ? t(item.disabledReasonKey, (locale === "ar" ? item.disabledReasonAr : item.disabledReasonEn) ?? "")
    : undefined;
  const parentLabel = item.parentLabelKey
    ? locale === "ar"
      ? item.parentLabelAr
      : t(item.parentLabelKey, item.parentLabelEn ?? "")
    : undefined;
  return {
    id: item.id,
    label: locale === "ar" ? item.labelAr : t(item.labelKey, item.labelEn),
    href: item.href,
    icon: item.icon,
    businessTab: item.businessTab,
    enabled: item.enabled,
    badge: item.badge,
    disabledReason,
    parentId: item.parentId,
    parentLabel,
  };
}

function toAdministrationEntries(items: readonly ShellNavItem[], t: Translate): readonly ShellNavEntry[] {
  return ADMIN_HUB_ORDER.flatMap<ShellNavEntry>(hubId => {
    const hubItems = ADMIN_HUB_ITEMS[hubId]
      .map(id => items.find(candidate => candidate.id === id))
      .filter((item): item is ShellNavItem => !!item);
    if (!hubItems.length) return [];
    return [{
      kind: "subgroup",
      id: hubId,
      label: t(ADMIN_HUB_LABEL_KEY[hubId], ADMIN_HUB_LABEL_EN[hubId]),
      icon: ADMIN_HUB_ICON[hubId],
      items: hubItems,
    }];
  });
}

function toBusinessEntries(items: readonly ShellNavItem[]): readonly ShellNavEntry[] {
  return items.flatMap<ShellNavEntry>((item, index) => {
    if (!item.parentId) return [{ kind: "item", item }];
    if (items.findIndex(candidate => candidate.parentId === item.parentId) !== index) return [];
    return [{
      kind: "subgroup",
      id: item.parentId,
      label: item.parentLabel ?? item.label,
      icon: item.icon,
      items: items.filter(candidate => candidate.parentId === item.parentId),
    }];
  });
}

export function toShellNavGroups(
  groups: readonly BuiltShellNavGroup[],
  locale: Locale,
  t: Translate,
): readonly ShellNavGroup[] {
  return groups.map(group => {
    const items = group.items.map(item => toNavItem(item, locale, t));
    const isAdministration = group.id === "administration";
    return {
      id: group.id,
      label: locale === "ar" ? group.labelAr : t(group.labelKey, group.labelEn),
      isAdministration,
      items,
      entries: isAdministration ? toAdministrationEntries(items, t) : toBusinessEntries(items),
    };
  });
}

export function toShellIdentity(input: {
  email: string;
  fullName: string | null;
  region: string | null;
  roles: readonly string[];
  roleTitles: readonly string[];
}): ShellIdentity {
  const name = input.fullName?.trim() || input.email.split("@")[0];
  const titles = input.roleTitles.length ? input.roleTitles : input.roles;
  return {
    name,
    email: input.email,
    initials: initials(input.fullName?.trim() || input.email),
    roleSummary: titles.join(" · "),
    roleTitles: input.roleTitles,
    homeRegion: input.region?.trim() || null,
  };
}

export function toRoleTitles(
  roles: readonly string[],
  rows: readonly { role_key: string; title: string }[],
): readonly string[] {
  const titleByKey = new Map(rows.map(row => [row.role_key, row.title]));
  return roles.map(role => titleByKey.get(role) ?? role);
}
