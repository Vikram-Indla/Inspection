import { PLACEHOLDER_SPLIT, PLACEHOLDER_TOKEN } from "@/features/admin-localization/placeholders";
import styles from "./localization-row.module.css";

export default function PlaceholderText({ text, errorTokens }: {
  text: string;
  errorTokens: ReadonlySet<string>;
}) {
  return (
    <>
      {text.split(PLACEHOLDER_SPLIT).map((part, index) => {
        const token = PLACEHOLDER_TOKEN.exec(part);
        if (!token) return <span key={`${index}-${part}`}>{part}</span>;
        return (
          <span
            className={styles.token}
            data-missing={errorTokens.has(token[1]) ? "" : undefined}
            key={`${index}-${part}`}
          >
            {part}
          </span>
        );
      })}
    </>
  );
}
