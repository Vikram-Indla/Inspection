import { ICONS, type IconName } from "./icon-registry";
import styles from "./icon.module.css";

export type IconSize = "sm" | "md" | "lg" | "xl";

type IconProps = {
  name: IconName;
  size?: IconSize;
  label?: string;
  mirrored?: boolean;
};

export default function Icon({ name, size = "md", label, mirrored }: IconProps) {
  const Glyph = ICONS[name];
  const className = mirrored ? `${styles.icon} ${styles.mirrored}` : styles.icon;
  return label ? (
    <Glyph className={className} data-size={size} role="img" aria-label={label} />
  ) : (
    <Glyph className={className} data-size={size} aria-hidden="true" focusable="false" />
  );
}
