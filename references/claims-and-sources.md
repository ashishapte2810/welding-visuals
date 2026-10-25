# Claims and sources

Every sentence a reader sees (hover text, stage text, footer notes) is a **claim** in `claims/<figure>.json`. The build script reads its text from there, so what an expert reviews is exactly what the page says. `kit/claims.mjs` lints the registry and the build stops on any error.

## Claim fields
| field | meaning |
|---|---|
| `id` | unique, e.g. `rsw-h-fay` |
| `ui` | where it appears: `hover:<part>`, `stage:<n>`, `stage-hot` (extra text in a toggled case), `footnote:<heading>` |
| `text` | the exact words shown |
| `confidence` | `established` (textbook-level, several sources agree), `literature` (stated in a cited source), `practitioner` (forum or shop knowledge), `illustrative` (describes what is drawn), `unsourced` (shown, but no source found) |
| `sources` | ids from `claims/sources.json`; required for the first three confidence levels |
| `numbers_ok` | true only if the text contains a number and a listed source states it |
| `note` | what the reviewer should look at; write NEEDS CHECK where the text goes beyond the sources read |
| `review` | `{status: pending/verified/corrected/rejected, reviewer, comment}`; `rejected` blocks the build |

## Source fields (`claims/sources.json`)
`label` is what appears on screen. **Keep author names out of a label until you have read the document's first page and seen them.** `read` records how much was actually read: `full`, `excerpt`, `snippet` (search-result text only) or `not-read`. Search snippets often omit authors, venues and caveats, so a claim resting only on snippets is weak; the review checklist counts these.

## Rules and the reasons for them
- **Numbers need a source that states them.** A number on screen reads as a fact. If no read source gives it, say it qualitatively. The lint rejects any digit without `numbers_ok`.
- **Check attribution by opening the document.** In this project three attributions were wrong or unconfirmed until checked: a conference paper credited to the website that hosted it, a venue stated that the document does not give, and an author list the extract did not show. Check before publishing, and fix published pages in place.
- **Quote a source's actual scope.** Example: a GMAW pool-flow paper models *spot* GMAW (a stationary pool); a TIG paper's finding applies below about 200 A and flips at high current. State the limit or leave the claim out.
- **Prefer reading the abstract page or first page over trusting a search snippet.** If a snippet is all you have, mark the claim accordingly.
- **Paraphrase.** Do not reproduce paywalled text; keep any direct quote short and cite it.

## Review loop with a subject-matter expert
1. `node scripts/build-checklist.mjs claims/<fig>.json claims/sources.json > review-<fig>.md`
2. The expert marks each claim verified / needs correction / wrong.
3. Update `review.status`, `reviewer` and `comment`, and fix `text`. Move corrections that generalize into `references/` (a proportion rule, a terminology note, a pitfall).
4. Rebuild, re-run `scripts/verify-all.mjs`, republish with `url` so existing links keep working.
