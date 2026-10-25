// Claim registry: every sentence shown on a page lives in claims/<figure>.json with sources, confidence and review status.
// Build scripts read the text from here, so what the specialist reviews is exactly what the page says.
import { readFileSync } from "node:fs";
import { esc } from "./lifecycle-engine.mjs";

const CONF = ["established", "literature", "practitioner", "illustrative", "unsourced"];
const REVIEW = ["pending", "verified", "corrected", "rejected"];

export function loadRegistry(claimsPath, sourcesPath) {
  const c = JSON.parse(readFileSync(claimsPath, "utf8"));
  const s = JSON.parse(readFileSync(sourcesPath, "utf8")).sources;
  return { meta: c.meta, claims: c.claims, sources: s };
}

/** Throws one error listing every problem. requiredSlots: ui slots the figure needs (e.g. "hover:elec", "stage:0"). */
export function lintRegistry(reg, requiredSlots = []) {
  const errs = [], ids = new Set(), slots = new Map();
  for (const c of reg.claims) {
    if (ids.has(c.id)) errs.push(`duplicate id ${c.id}`); ids.add(c.id);
    if (!CONF.includes(c.confidence)) errs.push(`${c.id}: confidence must be one of ${CONF.join("/")}`);
    if (!REVIEW.includes(c.review?.status)) errs.push(`${c.id}: review.status must be one of ${REVIEW.join("/")}`);
    if (c.review?.status === "rejected") errs.push(`${c.id}: rejected by reviewer; fix or remove before building`);
    const needSrc = ["established", "literature", "practitioner"].includes(c.confidence);
    if (needSrc && !(c.sources || []).length) errs.push(`${c.id}: confidence ${c.confidence} needs at least one source`);
    for (const ref of c.sources || []) if (!reg.sources[ref.split(":")[0]]) errs.push(`${c.id}: unknown source ${ref.split(":")[0]}`);
    if (/\d/.test(c.text) && !c.numbers_ok) errs.push(`${c.id}: contains a digit; numbers need numbers_ok:true plus a source that states them`);
    if (c.numbers_ok && !(c.sources || []).length) errs.push(`${c.id}: numbers_ok without a source`);
    const key = c.ui; if (!key.startsWith("footnote") && key !== "stage-hot") { if (slots.has(key)) errs.push(`ui slot ${key} used twice`); slots.set(key, c); }
  }
  for (const r of requiredSlots) if (!slots.has(r)) errs.push(`missing claim for ui slot ${r}`);
  for (const [k] of slots) if (requiredSlots.length && !requiredSlots.includes(k)) errs.push(`claim for unused ui slot ${k}`);
  for (const s of Object.values(reg.sources)) if (!s.label || (!s.url && s.type !== "book")) errs.push(`source ${s.id}: label required, and url unless it is a book`);
  if (errs.length) throw new Error("claim registry problems:\n - " + errs.join("\n - "));
  return reg;
}

const bySlot = (reg, ui) => reg.claims.find((c) => c.ui === ui);
export const hoverText = (reg, key) => bySlot(reg, "hover:" + key).text;
export const stageText = (reg, i) => bySlot(reg, "stage:" + i).text;
export const stageHot = (reg) => (bySlot(reg, "stage-hot") || { text: "" }).text;
export const hoverAttr = (reg, key) => esc(hoverText(reg, key));
export const hoverKeys = (reg) => reg.claims.filter((c) => c.ui.startsWith("hover:")).map((c) => c.ui.slice(6));

/** The "what the figure shows, and how sure we are" footer, built from footnote claims plus meta. */
export function footerHtml(reg) {
  const li = reg.claims.filter((c) => c.ui.startsWith("footnote:")).map((c) => {
    // group page cites per source: "AWS Welding Handbook ..., pp. 113, 114"
    const by = new Map();
    for (const ref of c.sources || []) { const [id, pg] = ref.split(":"); if (!by.has(id)) by.set(id, []); if (pg) by.get(id).push(pg); }
    const links = [...by].map(([id, pgs]) => { const s = reg.sources[id]; const name = s.url ? `<a href="${esc(s.url)}">${esc(s.label)}</a>` : esc(s.label); return name + (pgs.length ? `, ${pgs.length > 1 ? "pp." : "p."} ${esc(pgs.join(", "))}` : ""); }).join("; ");
    return `<li><strong>${esc(c.ui.slice(9))}.</strong> ${esc(c.text)}${links ? ` (${links})` : ""}</li>`;
  }).join("\n");
  const m = reg.meta;
  return `<footer class="bio-sources">
<h2>${esc(m.title)}</h2>
<ul>
${li}
</ul>
<p><strong>Not sourced, so treat as qualitative.</strong> ${esc(m.unsourced)}</p>
<p><strong>What was simplified.</strong> ${esc(m.simplified)}</p>
<p>${esc(m.disclaimer)}</p>
</footer>`;
}
