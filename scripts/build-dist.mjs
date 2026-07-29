// Builds dist/: a copy of just the files a static host needs to serve the
// site — leaves out dev-only files (scripts/, package.json, README, .git).
// No bundling/minifying — this project ships its source as-is, dist/ exists
// purely so "everything to upload" is one clean folder instead of the whole
// repo with its dev tooling mixed in.
import { cpSync, rmSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const distDir = path.join(root, "dist");

const FILES = ["index.html", "style.css", "app.js", "board-logic.js", "csv.js", "sounds.js"];
const DIRS = ["data", "assets"];

if (existsSync(distDir)) rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir);

for (const file of FILES) {
  cpSync(path.join(root, file), path.join(distDir, file));
}
for (const dir of DIRS) {
  cpSync(path.join(root, dir), path.join(distDir, dir), { recursive: true });
}

console.log(`Built dist/ — ${FILES.length} files plus ${DIRS.join("/, ")}/.`);
