# welding-visuals

A Claude skill for building **interactive, sourced explainer figures of welding processes** as single self-contained HTML pages. Each figure has a draggable lifecycle timeline (for example arc start, weld pool, travel, solidification), hover explanations, material-coloured parts, and a **claim registry** so a welding specialist can review exactly what the page says.

Worked examples: TIG (GTAW), MIG (GMAW) with a short-circuit / spray toggle, and resistance spot welding with a normal / too-much-heat (expulsion) toggle.

> **Status: draft.** No claim has been reviewed by a subject-matter expert yet (every `review.status` is `pending`). Most citations rest on search-result text; three papers and parts of three AWS Welding Handbook volumes were read. Resistance spot welding of steel has no process-chapter source yet, and the drawn spot-weld nugget is narrower than handbook examples. See `SKILL.md` ("Current limits") and `references/proportions.md`. Figures explain mechanisms only; they are not welding procedures.

## Use it as a skill
Copy this folder into your Claude skills location (or zip it and upload it), keeping `SKILL.md` at the top of the folder. Claude reads `SKILL.md` first and loads the files under `references/` only when needed.

## Build and check the figures
```bash
cd scripts && npm ci            # once: jsdom and resvg
cd ..
node examples/spot-weld-lifecycle/build.mjs                 # writes examples/spot-weld-lifecycle/dist/
node examples/legacy/make-dist.mjs gtaw                     # TIG and MIG (still standalone scripts)
node examples/legacy/make-dist.mjs gmaw
node scripts/verify-all.mjs examples/spot-weld-lifecycle/dist/spot-weld-white.html
```
Open any `dist/*-white.html` in a browser, or drag the timeline strip. The checks use a simulated browser, so open a page in a real browser before sharing it.

## Layout
| path | what |
|---|---|
| `SKILL.md` | workflow, hard rules, when to read what |
| `kit/` | shared engine (`lifecycle-engine.mjs`), claim registry library (`claims.mjs`), hosting variants (`package.mjs`), vendored page shell (`vendor/anima`, MIT) |
| `claims/` | claim registries (`rsw.json`, `gtaw.json`, `gmaw.json`) and `sources.json` (how much of each source was actually read) |
| `references/` | process notes, physics, standards glossary, defects, proportions, safety, intake procedure, pitfalls, document library index |
| `scripts/` | verification, claim lint, review-checklist generator, frame render, video export, `book-search.py` for citing printed page numbers from PDFs |
| `examples/` | the spot-weld reference build on the shared kit; TIG and MIG as legacy standalone builds |
| `evals/` | test prompts with expectations |

## Review checklist for an expert
```bash
node scripts/build-checklist.mjs claims/rsw.json claims/sources.json > review-spot-welding.md
```

## Reference books and copyright
Reference PDFs (AWS Welding Handbook volumes and similar) are **not** part of this repository and `.gitignore` blocks `*.pdf`. Claims are paraphrases with printed page numbers. Do not commit book text or scans.

## Licence
No licence has been chosen for this repository yet; choose one before making it public. `kit/vendor/anima/` is MIT-licensed third-party code from the Anima skill (see the `LICENSE` file there) and must keep its notice.
