// Build a legacy figure in both themes and write dist/<fig>-white.html and dist/<fig>-auto.html.   node make-dist.mjs gtaw|gmaw
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { hosted } from "../../kit/package.mjs";
const HERE = dirname(fileURLToPath(import.meta.url)); const fig = process.argv[2];
if (!["gtaw", "gmaw"].includes(fig)) { console.error("usage: make-dist.mjs gtaw|gmaw"); process.exit(2); }
for (const flag of [[], ["--light"]]) { const r = spawnSync("node", [join(HERE, fig + "-build.mjs"), ...flag], { stdio: "inherit" }); if (r.status !== 0) process.exit(1); }
const dark = readFileSync(join(HERE, `${fig}-lifecycle.html`), "utf8"), light = readFileSync(join(HERE, `${fig}-lifecycle-light.html`), "utf8");
mkdirSync(join(HERE, "dist"), { recursive: true });
writeFileSync(join(HERE, `dist/${fig}-white.html`), hosted(dark, light, { mode: "white" }));
writeFileSync(join(HERE, `dist/${fig}-auto.html`), hosted(dark, light, { mode: "auto" }));
console.log(`wrote dist/${fig}-white.html and dist/${fig}-auto.html`);
