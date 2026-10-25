# Pitfalls we hit (and what now catches them)

| what went wrong | cause | caught by |
|---|---|---|
| Page script failed to load entirely | two `const` with the same name (an SVG namespace and a droplet count) | `check-interactions` (nothing advances), jsdom init error |
| Particles drawn at twice the torch offset | positions inside an already translated group had the torch x added again | `render-frames` review (cluster far from the arc); keep one coordinate system per group |
| Idle tour took over during a held drag and reset the timeline | resume timer only tracked pointer down/up, not a held press | `check-interactions` (drag-and-hold test); engine's `holding` counter |
| Labels clipped at the canvas edge when the torch was at its start | label offset assumed room to the left | `check-runtime` (bounds) |
| Bottom labels collided; leaders crossed the plate | fixed label slots | `packLabels`; `check-runtime` (overlap) |
| Nugget about three times the electrode face | drawn for visibility, not proportion | build-time proportion check; `proportions.md` |
| Build check failed on correct behaviour | check sampled the wrong instant (expulsion peaks later than the check assumed) | review failing checks before "fixing" the model |
| Check on the pool outline failed spuriously | comparing a continuous outline with a 2 px sampled envelope | tolerance of one sample plus 0.5 px |
| Tour seemed to ignore my scrub in a test | the idle tour resumed after 3.6 s of simulated time | pause the tour first in tests (`#play` click) |
| Wrong author on a source | credited the website hosting a PDF | open the document; `claims-and-sources.md` |
| Wording looser than the source (pinch force; sharp transition; spot vs travelling GMAW) | wrote from the snippet, not the paper | read the abstract page or first page; record scope in `note` |
| Heat-affected label stayed faint after the zone was scaled down | fade thresholds tied to the old size | review frames after any size change |
| Shell brace expansion failed when creating folders | `sh` has no `{a,b}` | use explicit paths |
| A supplied file was not what its name said (an 'ASM' handbook was AWS 8th ed. vol. 3 on non-ferrous materials; 'Volume 1' was the 7th edition of 1976) | trusted the file name | read the title pages first; record the true edition and what it does not cover (`library/INDEX.md`) |
| Citing wrong page numbers from a book | the PDF-to-printed page offset drifts inside scanned books | `scripts/book-search.py` takes the printed number from each page's own header or footer |
| Doubt about OCR digits in scanned books | OCR can misread numbers | rasterize the page region (`pdftoppm -x -y -W -H`) and read it before recording a number; done for 70/30, 20 to over 200, and Table 1.47 |
| A confident figure statement was contradicted by the handbook (interface contact resistance 'stays highest') | wrote from a patent and a paper, not the physics chapter | read the physics section of a handbook before writing mechanism claims |
| Over-corrected a wording after reading one paper (pinch force) | one source's critique was of a different thing (pinch-instability theory) | when two sources seem to conflict, check whether they describe the same quantity before changing text |
