import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const configuredRoot = process.env.INSPECTION_DOCS_ROOT?.trim();

export const inspectionDocsRoot = configuredRoot
  ? resolve(configuredRoot)
  : join(homedir(), "Desktop", "Inspection Documentation");

export function evidenceDirectory(name: string): string {
  const directory = join(
    inspectionDocsRoot,
    "07_TEST_EVIDENCE_AND_SCREENSHOTS",
    "product-contract",
    "evidence",
    "screens",
    name,
  );
  mkdirSync(directory, { recursive: true });
  return directory;
}
