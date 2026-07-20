/** Inline banner: info / warning / critical / success / immutable (read-only lock). */
export interface BannerProps {
  tone?: "info" | "warning" | "critical" | "success" | "immutable";
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}
export declare function Banner(props: BannerProps): JSX.Element;
