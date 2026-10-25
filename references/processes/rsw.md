# Resistance spot welding  `claims/rsw.json`, builder `examples/spot-weld-lifecycle/build.mjs` (on the shared engine; the reference implementation)

**Shows:** cross-section through the electrode axis, two equal steel sheets, water-cooled copper electrodes, force and current profiles. **Toggle:** normal heat versus too much heat (expulsion).

| stage | p | what the model does |
|---|---|---|
| squeeze | 0 to 0.22 | electrodes close (by 0.12), force builds, no current |
| weld | 0.22 to 0.58 | current on, nugget grows from the faying interface; in the hot case expulsion near 0.50 to 0.58 |
| hold | 0.58 to 0.80 | current off, force held, liquid core freezes inward |
| off and release | 0.80 to 1.0 | force released, electrodes open, indentation remains |

**Status of facts:** 20 claims. Handbook support (7th ed. vol. 1, 1976; 8th ed. vol. 3, 1996, aluminium only): H = I squared R t and the four resistances; **in steel, contact resistance between the sheets largely disappears in the first half cycle but the early heating raises the metal's own resistance** (this corrected an earlier oversimplification in the figure text); contact resistance falls as force rises; the sheets are clamped to contain the molten metal at the joint center; formal definitions of nugget, nugget size, off time and faying surface; force kept on the nugget through solidification and cooling. The Hirsch and Leibovitz paper (read in full) supplies force, expulsion, indentation and squeeze-time behaviour. **No steel resistance-welding process chapter was available**; the 9th ed. vol. 3 and AWS C1.1 are wanted.

**Dimensional finding:** handbook examples put the nugget at about 3 to 5 times a single sheet's thickness (aluminium minimum design: 2.2 to 4.4 times); the figure draws 2.0 times. The build prints a warning; a re-scaled geometry is proposed in `references/proportions.md` and **awaits a decision** because it changes the look the user approved. The nugget-to-electrode-face rule (0.9 to 1.4) is still enforced but unverified.

**Questions for the expert**
1. Nugget diameter against electrode face and against sheet thickness: what is believable and what do your standards require?
2. Should a "force too low" and "force too high" toggle replace or join the heat toggle? (The Hirsch paper reports both.)
3. How should AC versus DC (and medium-frequency DC) be shown?
4. Coated steel, three-sheet stacks, and unequal thickness: which is first?
5. Is the electrode tip wear (mushrooming) worth a figure of its own?
6. Which weld schedule table do you trust (AWS C1.1, RWMA manual, a customer standard)?

**Missing:** coatings, sheet gaps, shunting, weld lobe diagram, pulsed or upslope current, electrode wear, projection and seam welding, schedule values (need a reference).
