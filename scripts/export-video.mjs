#!/usr/bin/env node
// Record the idle tour as an MP4 (or GIF with .gif). Draft quality: rendered by resvg, so soft glows are flatter than in a browser.
// For full fidelity, screen-record the HTML file in a real browser instead.
//   node export-video.mjs <figure.html> <out.mp4> [--fps 12] [--theme light] [--width 1280] [--mode 0] [--max-seconds 40]
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { loadPage } from "./lib/sim.mjs";
import { renderPng } from "./lib/render.mjs";
const [file, out] = process.argv.slice(2); const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i > 0 ? process.argv[i + 1] : d; };
if (!file || !out) { console.error("usage: export-video.mjs <figure.html> <out.mp4|out.gif> [--fps n] [--theme light|dark] [--width px] [--mode n] [--max-seconds s]"); process.exit(2); }
const fps = +arg("fps", 12), theme = arg("theme", "light"), width = +arg("width", 1280), maxS = +arg("max-seconds", 40), mode = +arg("mode", 0);
const page = loadPage(file); page.frames(3);
const mb = page.qa(".tg-modes button"); if (mb[mode]) { mb[mode].click(); page.setP(0); page.q("#play").click(); } // mode click stops the tour; restart it from 0
const dir = mkdtempSync(join(tmpdir(), "wv-"));
const per = Math.max(1, Math.round(30 / fps)); let n = 0, done = 0;
while (page.seconds() < maxS) {
  page.frames(per);
  writeFileSync(join(dir, `f${String(n++).padStart(5, "0")}.png`), renderPng(page, { theme, width }));
  if (+page.q("#tl-range").value >= 1000) { if (++done > fps * 2) break; }
}
const gif = out.endsWith(".gif");
const args = ["-y", "-framerate", String(fps), "-i", join(dir, "f%05d.png"), ...(gif ? ["-vf", "fps=" + fps + ",scale=800:-1:flags=lanczos"] : ["-pix_fmt", "yuv420p", "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2"]), out];
const r = spawnSync("ffmpeg", args, { stdio: "pipe" });
rmSync(dir, { recursive: true, force: true });
if (r.status !== 0) { console.error(String(r.stderr).split("\n").slice(-6).join("\n")); process.exit(1); }
console.log(`wrote ${out}: ${n} frames at ${fps} fps (${(n / fps).toFixed(1)} s)`);
