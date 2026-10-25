#!/usr/bin/env node
// Checks for a page that will be published or emailed: self-contained, phone-safe, theme tokens as expected.
//   node check-hosted.mjs <figure.html> [--auto]
import { readFileSync, statSync } from "node:fs";
import { fail, ok } from "./lib/sim.mjs";
const file = process.argv[2]; const auto = process.argv.includes("--auto"); if (!file) { console.error("usage: check-hosted.mjs <figure.html> [--auto]"); process.exit(2); }
const h = readFileSync(file, "utf8");
const bad = [...h.matchAll(/<script[^>]+src=|<link[^>]+stylesheet|<img[^>]+src="https?:|url\(\s*["']?https?:|@import/g)];
bad.length ? fail("external resources: " + bad.map((m) => m[0]).join(", ")) : ok("no external scripts, stylesheets, images or fonts");
statSync(file).size < 16e6 ? ok("size " + Math.round(statSync(file).size / 1024) + " KB (limit 16 MB)") : fail("over 16 MB");
h.includes("viewport-fit=cover") && h.includes("env(safe-area-inset-top") ? ok("phone safe-area handling present") : fail("missing viewport-fit/safe-area handling");
if (auto) h.includes("prefers-color-scheme") ? ok("auto theme: follows the viewer's setting") : fail("auto theme script missing");
else (h.includes("--anatomy-page:#ffffff") && !h.includes("prefers-color-scheme: dark)')")) ? ok("white page: locked, pure white background") : fail("white variant tokens not applied or theme sync present");
/\b(TODO|FIXME|lorem)\b/i.test(h) ? fail("placeholder text found") : ok("no placeholder text");
