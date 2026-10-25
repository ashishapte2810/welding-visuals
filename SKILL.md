---
name: welding-visuals
description: Build interactive, sourced explainer figures of welding processes (TIG/GTAW, MIG/GMAW, resistance spot welding, and further processes) as standalone HTML pages with a drag-through-the-lifecycle timeline (arc start, weld pool, metal transfer, nugget formation, solidification, HAZ), hover explanations, material-accurate colors, and a claim registry that a welding specialist can review. Use this skill whenever the user wants to visualize, animate, diagram, teach or explain a welding process or phenomenon, wants a welding figure, animation or video for engineers, technicians or apprentices, wants to extend or correct an existing welding figure, or wants welding explainer content checked with an expert, even if they never say "skill" or "animation". Do not use it for WPS/PQR calculations, code-compliance checks, or step-by-step welding instructions.
---

# Welding visuals

Turns a welding process into a self-contained, interactive HTML figure that a person drags through from start to finish, with every sentence on screen traceable to a source and open to expert review. The audience is usually engineering professionals and technicians, so accuracy and honesty about limits matter more than polish.

The three finished figures are the worked examples: resistance spot welding (`examples/spot-weld-lifecycle/`, built on the shared kit), and TIG and MIG (`examples/legacy/`, standalone scripts not yet ported).

## What this skill is not
It explains mechanisms. It does not produce welding procedures, parameter recommendations, or compliance judgements. For WPS/PQR work (heat-input checks, coupon matrices), use a procedure-qualification skill and let this one illustrate the mechanism. If asked for settings or steps, follow `references/safety.md`.

## Before you start
Ask (skip what is already answered; use the answers to size the job):
1. **Process and concept**: which process, and which part of its life (the whole lifecycle, or one mechanism)?
2. **Audience**: who watches, with what prior knowledge, in what setting?
3. **Interaction**: timeline drag is the default; which toggles (a mode, a defect, a slider) would teach the most?
4. **Sources**: which codes, handbooks and company documents govern? Anything they supply goes through `references/reference-intake.md`.
5. **Delivery**: HTML file, link, video, slide; white (default) or dark.

Size it and say so before heavy work: a **Figure** is one process lifecycle or mechanism with one or two toggles (our three figures); a **Hero** adds a second view, many parts or a 3D torch; an **Epic** spans several processes or an organ-scale system. Propose a Figure first and confirm before starting a Hero or Epic.

## Workflow
1. **Research and register claims first.** Collect sources, then write `claims/<figure>.json` before any drawing (`references/claims-and-sources.md`). Open each document's first page and confirm authors, venue and scope; record how much you read. Anything not supported by a source you read is `illustrative` or `unsourced`, and a number without a source that states it is not shown.
2. **Write the model.** One pure `model(p, mode)` drives everything (`references/model-contract.md`). Write the build-time invariants, including proportion rules (`references/proportions.md`), before the drawing.
3. **Draw the scene** in the 960 by 640 canvas with material colors and the labelling rules in `references/style.md`. Use the process file in `references/processes/` for stage structure and the open questions to raise.
4. **Assemble with the kit**: `kit/lifecycle-engine.mjs` (timeline strip, controls, drag/tour/keyboard/reduced-motion, hover, status), `kit/claims.mjs` (text and footer from the registry), `kit/package.mjs` (white and auto pages). Copy `examples/spot-weld-lifecycle/build.mjs` as the template: figure-specific SVG and `drawScene` in, shared behaviour out. Do not copy engine code into a new figure.
5. **Verify** (`references/verification.md`): `cd scripts && npm install` once, then `node scripts/verify-all.mjs <page.html>`. Then render frames (`render-frames.mjs`), **open and look at several across the timeline in each mode and theme**, and fix layout problems. A passing script run is not a visual check. Say plainly that the scripts use a simulated browser and that a real-browser check is still needed.
6. **Deliver**: the white page by default, the auto page if asked; publish or attach as the user prefers. A video is `scripts/export-video.mjs` (draft quality) or a screen recording of the HTML for full fidelity.
7. **Expert loop**: `scripts/build-checklist.mjs` makes a review checklist from the registry. Apply corrections to the registry and references, rebuild, re-verify, and republish in place so links keep working. Move lessons into `references/pitfalls.md`.

## Hard rules, and why
- **No number without a source that states it.** On a technical page a number reads as fact; a plausible invented value is worse than a qualitative statement. `kit/claims.mjs` enforces this.
- **Verify attribution by reading the document.** Author names, venues and scopes taken from memory or a search snippet were wrong or loose several times in this project. Put no author name in a label until you have seen it.
- **State a source's scope.** A model of spot GMAW is not a travelling-torch result; a Marangoni finding at low current does not hold at high current. Include the limit or omit the claim.
- **Be honest about what is schematic.** Every page says "schematic, not to scale; time axis stretched", lists what was simplified, and says which parts are unsourced.
- **Never exaggerate a ratio an expert will check.** If a part is enlarged, say so in the caption. Check ratios at build time.
- **Mechanism, not procedure.** No settings, steps or compliance claims (`references/safety.md`).
- **Colors mean materials.** Copper reddish brown, steel grey, heat yellow. The yellow glow is a cue, not a temperature scale.
- **Fix mistakes where they were published.** If a check or source reading shows an error, correct the live page and the registry, and tell the user what changed.

## Defaults
White page, monospace labels, one hover-info panel, idle tour about 30 s, stage buttons, native slider, optional mode toggle, sources footer, education-only note. File names `dist/<figure>-white.html` and `dist/<figure>-auto.html`.

## When to read what
| need | read |
|---|---|
| the user supplied a document or book | `references/reference-intake.md`, `references/library/INDEX.md`; read books with `scripts/book-search.py` |
| writing or editing text on a page | `references/claims-and-sources.md` |
| model, motion, invariants | `references/model-contract.md` |
| layout, colors, labels | `references/style.md` |
| controls and behaviour | `references/interaction-contract.md` |
| testing | `references/verification.md`, `references/pitfalls.md` |
| a specific process | `references/processes/gtaw.md`, `gmaw.md`, `rsw.md` |
| physics, metallurgy, standards, defects, proportions, safety | `references/physics-and-metallurgy.md`, `standards-glossary.md`, `defects.md`, `proportions.md`, `safety.md` |
| interviewing the expert or planning the next process | `references/specialist-interview.md`, `references/roadmap.md` |

## Current limits (say these when relevant)
- **Sources:** three AWS Welding Handbook volumes have been read in part (9th ed. vol. 2 GTAW and GMAW chapters; 7th ed. vol. 1 resistance heating pages; 8th ed. vol. 3 aluminium resistance welding pages), plus three papers read in full. Most other citations still rest on search-result text; the registry's `read` field shows which. Check `references/library/INDEX.md` for what each document does and does not cover.
- **Resistance spot welding of steel has no process chapter** in the supplied books; the 9th ed. vol. 3 and AWS C1.1 are wanted. The spot-weld figure's schedules and proportions are therefore unverified.
- Paid standards (AWS C1.1, C5.6, A5.12 beyond the handbook's own citations) have not been consulted. The standards glossary marks what is verified as cited and what is from memory.
- TIG and MIG take their text and footers from the claim registry, but their drawing and interaction code is still standalone (`examples/legacy/`); only the spot-weld figure is fully on the shared engine.
- **Known proportion issue:** the drawn spot-weld nugget is about 2 times the sheet thickness; handbook examples are about 3 to 5. A re-scale is proposed in `references/proportions.md` and awaits a decision. MIG spray penetration is drawn as a half-ellipse, but the handbook describes it as narrow and finger-like.
- Verification uses a simulated browser and a vector renderer that drops soft glows; real-browser checks are manual. Numbers from scanned books must be checked against the page image.
