import type { IconName } from "@/components/saqeel/icon/icon-registry";

export type ShellNavItem = {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly icon: IconName;
  readonly businessTab: string;
  readonly enabled: boolean;
  readonly badge?: number;
  readonly disabledReason?: string;
  readonly parentId?: string;
  readonly parentLabel?: string;
};

export type ShellNavSubgroup = {
  readonly kind: "subgroup";
  readonly id: string;
  readonly label: string;
  readonly icon: IconName;
  readonly items: readonly ShellNavItem[];
};

export type ShellNavEntry =
  | { readonly kind: "item"; readonly item: ShellNavItem }
  | ShellNavSubgroup;

export type ShellNavGroup = {
  readonly id: string;
  readonly label: string;
  readonly isAdministration: boolean;
  readonly entries: readonly ShellNavEntry[];
  readonly items: readonly ShellNavItem[];
};

export type ShellIdentity = {
  readonly name: string;
  readonly email: string;
  readonly initials: string;
  readonly roleSummary: string;
  readonly roleTitles: readonly string[];
  readonly homeRegion: string | null;
};

export type ShellScope = {
  readonly date: boolean;
  readonly region: boolean;
};

export type ShellStrings = Readonly<Record<string, string>>;

export type ShellView = {
  readonly locale: "ar" | "en";
  readonly pathname: string;
  readonly groups: readonly ShellNavGroup[];
  readonly identity: ShellIdentity;
  readonly regions: readonly string[];
  readonly roles: readonly string[];
  readonly isFieldOnly: boolean;
  readonly isAdminWorkspace: boolean;
  readonly scope: ShellScope;
};
