import styles from "./kbd.module.css";

export type KbdProps = {
  keys: string;
};

export default function Kbd({ keys }: KbdProps) {
  return <kbd className={styles.root}>{keys}</kbd>;
}
