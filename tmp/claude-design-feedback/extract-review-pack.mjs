import fs from "node:fs/promises";
import { gunzipSync } from "node:zlib";

const input = process.argv[2] || "/Users/vikramindla/Downloads/Saqeel_CD-001_Review_Pack.html";
const outputName = process.argv[3] || "CD001";
const baseDir = "/Users/vikramindla/Developer/Inspection/tmp/claude-design-feedback";
const source = await fs.readFile(input, "utf8");
const match = source.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/);
if (!match) throw new Error("Bundled template not found");
const template = JSON.parse(match[1]);
await fs.writeFile(`${baseDir}/${outputName}-unpacked.html`, template, "utf8");
const manifestMatch = source.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/);
if (!manifestMatch) throw new Error("Bundled manifest not found");
const manifest = JSON.parse(manifestMatch[1]);
const assetDir = `${baseDir}/${outputName}-assets`;
await fs.mkdir(assetDir,{recursive:true});
const extensions = {"image/png":"png","image/jpeg":"jpg","image/webp":"webp","text/html":"html","text/css":"css","application/javascript":"js"};
for (const [uuid,entry] of Object.entries(manifest)) {
  let bytes = Buffer.from(entry.data,"base64");
  if (entry.compressed) bytes = gunzipSync(bytes);
  await fs.writeFile(`${assetDir}/${uuid}.${extensions[entry.mime] || "bin"}`,bytes);
}
console.log(`Extracted ${template.length} characters and ${Object.keys(manifest).length} assets`);
