import type { Page } from "@playwright/test";

// DEC-009 acknowledgement gate: submit() opens SignaturePad and only enqueues
// the submission from finalizeSubmit(ack) once a stroke is drawn and a name is
// entered. Drives that dialog so specs can keep asserting on the post-submit
// banner/state exactly as before the signature gate landed.
export async function signAndConfirm(page: Page, name = "Factory representative (G10 Playwright)") {
  const dialog = page.getByRole("dialog", { name: "Factory representative acknowledgement", exact: true });
  const canvas = dialog.getByLabel("Factory representative acknowledgement", { exact: true });
  const box = await canvas.boundingBox();
  if (!box) throw new Error("signature canvas not found");
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.3, { steps: 5 });
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.6, { steps: 5 });
  await page.mouse.up();
  const representativeName = dialog.getByPlaceholder("Full name as recorded on site", { exact: true });
  await representativeName.fill(name);
  const confirm = dialog.getByRole("button", { name: "Confirm & submit", exact: true });
  await confirm.click();
}
