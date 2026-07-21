/** 46px status strip — five state domains as glyph+word pairs, never chip clusters in titles. */
export interface StatusRailProps {
  items: { label?: React.ReactNode; value: React.ReactNode; tone?: "success" | "warning" | "critical" | "info" }[];
  end?: React.ReactNode;
  label?: string;
  className?: string;
}
export declare function StatusRail(props: StatusRailProps): JSX.Element;
