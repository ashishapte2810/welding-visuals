# Proportion rules

Rules that keep drawings believable. Status says whether the ratio is checked at build time and how well it is supported.

| rule | applied value | enforced | support |
|---|---|---|---|
| Spot-weld nugget diameter against **single-sheet thickness**, normal heat | drawn about **2.0** | **warning at every build** (`examples/spot-weld-lifecycle/build.mjs`) | **Handbook evidence says it should be larger.** 7th ed. vol. 1 p.40: a worked example assumes a 5 mm nugget in 1.0 mm sheets (about 5). 8th ed. vol. 3 Table 1.47 (aluminium, minimum design nugget, checked against the page image): 3.6 mm for 0.81 mm sheet (4.4), 4.1 for 1.02 (4.0), 4.6 for 1.27 (3.6), 5.1 for 1.60 (3.2), 5.8 for 2.03 (2.9), 6.3 for 2.54 (2.5), 7.1 for 3.17 (2.2). The table prints "31.7" for the 3.17 mm row, a typo in the book. **Aluminium minimums, not steel typicals.** |
| Spot-weld nugget height against stack thickness | drawn about 50 percent | no | 7th ed. vol. 1 p.40 worked example: nugget 1.5 mm high in a 2.0 mm stack (75 percent), an assumed example, not a measurement |
| Spot-weld nugget width against electrode face width | about 1.0 to 1.2 (build check 0.9 to 1.4) | yes | **unverified**; judged from experience. Handbook gives dome-radius faces (aluminium schedules use 51 to 152 mm face radii, 8th ed. vol. 3 Table 1.49), so "face width" is itself a simplification |
| Pool longer behind the arc than ahead during travel | tail grows with travel | yes (model check) | **memory**; no read source |
| Bead crown height (MIG) | small relative to plate thickness | no | illustrative |
| Arc length against stickout (MIG) | arc shorter than stickout | no | illustrative |
| HAZ width | small and growing with time | no | illustrative; replace with a measured ratio from a macro |
| MIG spray penetration shape | drawn as a deeper half-ellipse | no | handbook (9th ed. vol. 2 p.154): spray gives narrow, deep, **finger-like** penetration; the drawn shape is not finger-like |
| TIG electrode tip | schematic point | no | handbook p.115: larger included angle gives deeper penetration and a narrower bead |

## Decision pending: re-scale the spot-weld figure
The drawn sheets are thick and the electrodes narrow compared with real welds, so the nugget looks small against the sheets. A geometry that satisfies both the handbook ratios and the face rule: sheet thickness **24 px** (now 30), nugget half-width **36 px** (diameter 3.0 x thickness), nugget half-height **16 px** (about 67 percent of the stack), electrode tip half-width **40 px** (face a little wider than the nugget). This changes the look the user approved (slimmer sheets, stubbier electrodes), so it is **not applied**. If accepted: change `GEO.T`, `GEO.TIPW`, and `A`, `B` in `model`, update the label anchors, run `scripts/verify-all.mjs`, and look at frames in both modes.

A drawing must never be scaled up "for visibility" in a way that changes a ratio an expert will check. If a part must be exaggerated, say so in the caption (the spot-weld caption already says "not to scale").
