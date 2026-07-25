import { readFileSync, writeFileSync } from "node:fs";
import type { CardReport } from "./types";

interface MutableCard {
  id: string;
  design?: number;
  designEvidence?: unknown;
}

interface MutableSpine {
  revision: string;
  updated: string;
  updatedBy: string;
  cards: MutableCard[];
}

export interface WriterPreview {
  mode: "dry-run" | "write";
  cardId: string;
  previousScore: number | null;
  nextScore: number;
  previousRevision: string;
  nextRevision: string;
  evidence: string;
}

function nextRevision(current: string): string {
  const match = /^(.*?)(\d+)$/.exec(current);
  if (!match) throw new Error(`Unsupported spine revision format: ${current}`);
  return `${match[1]}${Number(match[2]) + 1}`;
}

export function updateSpineDesignLane(
  spinePath: string,
  report: CardReport,
  reportPath: string,
  options: { write: boolean; expectedRevision?: string },
): WriterPreview {
  if (report.score === null) {
    throw new Error(`Writer refused ${report.cardId}: structural score is null`);
  }
  const spine = JSON.parse(readFileSync(spinePath, "utf8")) as MutableSpine;
  if (options.expectedRevision && spine.revision !== options.expectedRevision) {
    throw new Error(
      `Writer refused ${report.cardId}: expected revision ${options.expectedRevision}, found ${spine.revision}`,
    );
  }
  const card = spine.cards.find(candidate => candidate.id === report.cardId);
  if (!card) throw new Error(`Writer refused: card ${report.cardId} does not exist`);
  const revision = nextRevision(spine.revision);
  const preview: WriterPreview = {
    mode: options.write ? "write" : "dry-run",
    cardId: report.cardId,
    previousScore: card.design ?? null,
    nextScore: report.score,
    previousRevision: spine.revision,
    nextRevision: revision,
    evidence: reportPath,
  };
  if (!options.write) return preview;

  card.design = report.score;
  card.designEvidence = {
    harness: "BS-1",
    measuredAt: report.generatedAt,
    report: reportPath,
    rule: report.rule,
    variants: report.variants.length,
  };
  spine.revision = revision;
  spine.updated = report.generatedAt;
  spine.updatedBy = "codex-bs-1-pixel-harness";
  writeFileSync(spinePath, `${JSON.stringify(spine, null, 2)}\n`, "utf8");
  return preview;
}
