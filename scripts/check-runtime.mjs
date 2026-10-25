#!/usr/bin/env node
// Sweep the timeline in every mode and check: no script errors, no NaN/undefined geometry, readout present,
// every visible label inside the canvas, and no two visible labels overlapping.
//   node check-runtime.mjs <figure.html>
import { loadPage, fail, ok } from "./lib/sim.mjs";
const file = process.argv[2]; if (!file) { console.error("usage: check-runtime.mjs <figure.html>"); process.exit(2); }
const page = loadPage(file); const { q, qa, w, frames, setP, errors } = page;
frames(10); page.q("#play").click();               // stop the idle tour so the sweep controls the timeline
const modes = qa(".tg-modes button").length || 1;
let checked = 0, problems = 0;
const boxOf = (g) => { const t = g.querySelector("text"), x = +t.getAttribute("x"), y = +t.getAttribute("y"), a = t.getAttribute("text-anchor"), wd = t.textContent.length * 7, h = 12;
  const l = a === "end" ? x - wd : a === "middle" ? x - wd / 2 : x; return { l, r: l + wd, t: y - h, b: y + 3, name: t.textContent }; };
for (let m = 0; m < modes; m++) {
  if (modes > 1) { qa(".tg-modes button")[m].click(); frames(5); }
  for (let i = 0; i <= 40; i++) {
    const p = i / 40; setP(p); frames(60);
    checked++;
    const html = q(".tg-fig").outerHTML;
    const bad = html.match(/[a-z-]+="[^"]*(NaN|undefined|Infinity)[^"]*"/g);
    if (bad) { fail(`mode ${m} p=${p}: bad geometry ${bad.slice(0, 2).join(" | ")}`); problems++; }
    if (!q("[data-readout]").textContent.trim()) { fail(`mode ${m} p=${p}: empty readout`); problems++; }
    const labels = qa(".tg-lb").filter((g) => +g.style.opacity > 0.3).map(boxOf);
    for (const b of labels) if (b.l < 0 || b.r > 960) { fail(`mode ${m} p=${p}: label "${b.name}" leaves the canvas (${b.l.toFixed(0)}..${b.r.toFixed(0)})`); problems++; }
    for (let a = 0; a < labels.length; a++) for (let c = a + 1; c < labels.length; c++) { const A = labels[a], B = labels[c];
      if (A.l < B.r && B.l < A.r && A.t < B.b && B.t < A.b) { fail(`mode ${m} p=${p}: labels overlap: "${A.name}" and "${B.name}"`); problems++; } }
    if (problems > 12) break;
  }
}
if (errors.length) { errors.slice(0, 3).forEach((e) => fail("script error: " + e.split("\n")[0])); problems++; }
if (!problems) ok(`runtime sweep: ${checked} timeline positions across ${modes} mode(s), no errors, labels in bounds and non-overlapping`);
