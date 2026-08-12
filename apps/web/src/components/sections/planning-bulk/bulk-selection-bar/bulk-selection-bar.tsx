import Button from "@/components/saqeel/button/button";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import styles from "./bulk-selection-bar.module.css";

export type SelectionBarStrings = {
  selectionBar: string;
  readyNothing: string;
  clearSelection: string;
  reviewContinue: string;
  saveDraft: string;
  draftSaved: string;
  draftSaveFailed: string;
  reviewFallback: string;
};

export default function BulkSelectionBar({
  selectedCount, draftReference, draftPersistable, saveFailed, saving,
  strings, onClear, onSaveDraft, onReview,
}: {
  selectedCount: number;
  draftReference: string | null;
  draftPersistable: boolean;
  saveFailed: boolean;
  saving: boolean;
  strings: SelectionBarStrings;
  onClear: () => void;
  onSaveDraft: () => void;
  onReview: () => void;
}) {
  const hasSelection = selectedCount > 0;

  return (
    <div className={styles.root}>
      <div className={styles.status}>
        <strong aria-live="polite">
          <Text as="span" role="bodyStrong" numeric>
            {strings.selectionBar.replace("{n}", String(selectedCount))}
          </Text>
        </strong>
        {hasSelection
          ? <Button variant="tertiary" onClick={onClear}>{strings.clearSelection}</Button>
          : <StatusPill tone="warning">{strings.readyNothing}</StatusPill>}
        {draftReference !== null && !saveFailed
          ? <Text as="span" tone="muted" live="status">{strings.draftSaved.replace("{ref}", draftReference)}</Text>
          : null}
        {saveFailed ? <StatusPill tone="danger">{strings.draftSaveFailed}</StatusPill> : null}
      </div>
      <div className={styles.actions}>
        {saveFailed
          ? <Button variant="secondary" href="/planning/bulk/review">{strings.reviewFallback}</Button>
          : null}
        {hasSelection
          ? <Button variant="secondary" busy={saving} disabled={!draftPersistable} onClick={onSaveDraft}>{strings.saveDraft}</Button>
          : null}
        <Button variant="primary" busy={saving} disabled={!hasSelection} onClick={onReview}>
          {strings.reviewContinue}
        </Button>
      </div>
    </div>
  );
}
