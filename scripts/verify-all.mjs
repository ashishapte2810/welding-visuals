#!/usr/bin/env node
// One command: hosted checks + runtime sweep + interaction contract.   node verify-all.mjs <figure.html> [--auto]
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url)); const file = process.argv[2]; const auto = process.argv.includes("--auto");
if (!file) { console.error("usage: verify-all.mjs <figure.html> [--auto]"); process.exit(2); }
let bad = 0;
for (const [name, args] of [["check-hosted.mjs", [file, ...(auto ? ["--auto"] : [])]], ["check-runtime.mjs", [file]], ["check-interactions.mjs", [file]]]) {
  console.log("\n== " + name); const r = spawnSync("node", [join(here, name), ...args], { stdio: "inherit" }); if (r.status !== 0) bad++;
}
console.log(bad ? `\n${bad} check group(s) failed` : "\nall check groups passed"); process.exit(bad ? 1 : 0);
