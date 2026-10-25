# Document library index

One row per document the user provides (see ../reference-intake.md). The PDFs themselves are NOT stored in this skill: they are copyrighted, user-supplied and not redistributable. Keep the path the user gave and read them with `scripts/book-search.py`.

| id (claims/sources.json) | what it actually is (checked from the title pages) | file name as supplied | pages used (printed) | rights | read | used for |
|---|---|---|---|---|---|---|
| `awshb9-v2p1` | AWS Welding Handbook, **9th ed., vol. 2, Welding Processes** (title page says Part 1; preface says Part 2), (c) 2004 AWS, 15 chapters (arc power sources, SMAW, GTAW, GMAW, FCAW, SAW, PAW, ...) | `AWS_Welding_Handbook_Volume_2_-_Part_1.pdf` (788 pp, born-digital text layer) | ch.1 pp.27, 41 / ch.2 p.55 / ch.3 GTAW pp.104-106, 113-116, 119, 128-130 / ch.4 GMAW pp.150-154, 157, 164, 181, 183, 195-196 | AWS copyright; user copy | excerpt | `claims/gtaw.json`, `claims/gmaw.json` |
| `awshb7-v1` | AWS Welding Handbook, **7th ed., vol. 1, Fundamentals of Welding** (1976) | `AWS_Welding_Handbook_Volume_1.pdf` (386 pp, scanned with OCR) | pp.14-15 (resistance welding survey), 39-40 (resistance heating physics), glossary pp.296, 307, 313, 319 | AWS copyright; user copy | excerpt | `claims/rsw.json` |
| `awshb8-v3` | AWS Welding Handbook, **8th ed., vol. 3, Materials and Applications Part 1** (1996), ed. W. R. Oates; aluminium, magnesium, copper, nickel, lead and zinc, plastics, composites, ceramics, repair, underwater. **No carbon-steel chapter.** | `ASM_Welding_Handbook.pdf` (533 pp, scanned with OCR; the file name says ASM but the book is AWS) | pp.72-76 (aluminium resistance and spot welding, Table 1.47, Table 1.49) | AWS copyright; user copy | excerpt | `claims/rsw.json`, proportions |

## What these three books do and do not cover
- **TIG (GTAW) and MIG (GMAW): well covered** by the 9th ed. vol. 2 (chapters 3 and 4).
- **Resistance spot welding of steel: not covered by a process chapter.** The 7th ed. vol. 1 gives a short survey and the physics of resistance heating (and says detailed coverage was planned for a later volume); the 8th ed. vol. 3 covers aluminium spot welding only. The 9th ed. **vol. 3** (resistance, solid state and other processes) and **AWS C1.1** would close this gap.
- Not read: the remaining chapters of all three books (SMAW, FCAW, SAW, PAW; vol. 1 chapters 2-6 beyond the pages above, including heat flow and welding metallurgy; vol. 3 chapters 2-10).
- Editions differ (1976, 1996, 2004): prefer the newest for process statements and note the edition on every claim.

## Wanted next, in priority order
1. 9th ed. vol. 3 (resistance welding chapter) and/or AWS C1.1; the force, current and time schedules the expert trusts.
2. Etched macro cross-sections: TIG and MIG beads, spot-weld nuggets (with scale), to fix proportions.
3. The governing codes the expert works to (name, edition).
4. Remaining chapters worth reading from the books above: vol. 1 (7th) chapter 3 heat flow and chapter 4 welding metallurgy (solidification, HAZ); vol. 2 (9th) chapter 1 arc power sources.
5. Anonymized WPS/PQR, spot-weld schedules, inspection and peel/chisel test reports; manufacturer application notes.
6. Audience brief and terminology list (see ../specialist-interview.md).
