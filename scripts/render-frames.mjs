#!/usr/bin/env node
// Render still frames to PNG for layout review.  node render-frames.mjs <figure.html> <outdir> [--theme light|dark] [--p 0.1,0.5,0.9] [--mode 1]
import { mkdirSync, writeFileSync } from "node:fs";
import { loadPage } from "./lib/sim.mjs";
import { renderPng } from "./lib/render.mjs";
const [file, out] = process.argv.slice(2); const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i > 0 ? process.argv[i + 1] : d; };
if (!file || !out) { console.error("usage: render-frames.mjs <figure.html> <outdir> [--theme light|dark] [--p list] [--mode n]"); process.exit(2); }
const theme = arg("theme", "light"), ps = arg("p", "0.1,0.3,0.55,0.8,0.97").split(",").map(Number), mode = arg("mode", "0");
const page = loadPage(file); page.frames(10); page.q("#play").click();
const mb = page.qa(".tg-modes button"); if (mb[+mode]) mb[+mode].click();
mkdirSync(out, { recursive: true });
for (const p of ps) { page.setP(p); page.frames(200); const f = `${out}/frame-m${mode}-p${String(p).replace(".", "_")}.png`; writeFileSync(f, renderPng(page, { theme })); console.log("wrote", f, "|", page.q("[data-readout]").textContent); }
if (page.errors.length) { console.error("script errors:", page.errors[0]); process.exit(1); }
