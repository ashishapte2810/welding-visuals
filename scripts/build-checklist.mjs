#!/usr/bin/env node
// Turn a claim registry into a review checklist for a subject-matter expert.
//   node build-checklist.mjs ../claims/rsw.json ../claims/sources.json > review-rsw.md
import { readFileSync } from "node:fs";
const [cp, sp] = process.argv.slice(2); if (!cp || !sp) { console.error("usage: build-checklist.mjs <claims.json> <sources.json>"); process.exit(2); }
const { meta, claims } = JSON.parse(readFileSync(cp, "utf8")); const S = JSON.parse(readFileSync(sp, "utf8")).sources;
const count = (f) => claims.filter(f).length;
const out = [`# Review checklist: ${meta.figure}`, "", `${claims.length} claims. Please mark each one: verified / needs correction / wrong, and write the correction.`, "",
  `By confidence: ${["established", "literature", "practitioner", "illustrative", "unsourced"].map((c) => c + " " + count((x) => x.confidence === c)).join(", ")}.`,
  `Claims resting only on sources I did not read beyond search-result text: ${count((c) => c.sources.length && c.sources.every((r) => S[r.split(":")[0]].read === "snippet"))} of ${claims.length}.`, ""];
for (const c of claims) {
  out.push(`## ${c.id}  (${c.ui}, ${c.confidence})`, "", c.text, "");
  if (c.note) out.push(`> Note: ${c.note}`, "");
  if (c.sources.length) out.push("Sources: " + c.sources.map((ref) => { const [id, pg] = ref.split(":"); return `${S[id].label}${pg ? ", p. " + pg : ""} [read: ${S[id].read}]`; }).join("; "), "");
  out.push("- [ ] verified   - [ ] needs correction   - [ ] wrong", "- Correction / comment: ", "");
}
out.push("---", "", "Not sourced (qualitative): " + meta.unsourced, "", "Simplified: " + meta.simplified, "");
console.log(out.join("\n"));
