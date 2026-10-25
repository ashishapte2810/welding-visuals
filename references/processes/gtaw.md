# GTAW (TIG)  `claims/gtaw.json`, builder `examples/legacy/gtaw-build.mjs` (not yet on the shared engine)

**Shows:** longitudinal section, DCEN, autogenous, flat position. HF start, tungsten cathode, argon shield, arc bell, pool that lengthens behind the arc, columnar grains, HAZ. No toggles.

| stage | p | what the model does |
|---|---|---|
| pre-flow | 0 to 0.10 | gas on, no arc |
| arc start | 0.10 to 0.20 | HF spark (0.10 to 0.17), current ramps up from 0.17 |
| pool growth | 0.20 to 0.36 | torch stationary, pool grows |
| travel | 0.36 to 0.70 | torch moves, pool tail lengthens |
| downslope | 0.70 to 0.80 | current ramps down, pool shrinks, crater |
| post-flow and freeze | 0.80 to 1.0 | gas continues, last liquid freezes, HAZ finishes |

**Status of facts:** 20 claims. Now backed by the **AWS Welding Handbook, 9th ed. vol. 2, ch. 3** (printed pages in each claim): DCEN heat split (about 70 percent at the work), tungsten electrode behaviour and classes, helium versus argon, arc-start methods and their drawbacks, crater filling by gradual current decrease, tungsten oxidation after the arc goes out. Pool forces and epitaxial solidification are still journal and teaching sources. Remaining unsourced: typical post-flow durations and slope times (not shown). **Figure gap:** handbook p.115 says tip included angle changes penetration and bead width; the tip is drawn schematically.

**Questions for the expert**
1. Is a pool noticeably longer behind the arc than ahead, at typical TIG speeds? How much?
2. Which start method should be the default for your audience: HF, lift-arc, or both?
3. Is DCEN autogenous the right "base case", or should filler be added first? AC on aluminium?
4. What does a good bead macro look like for the material your audience uses (HAZ width, penetration profile)?
5. Which defects matter most to show (tungsten inclusion, porosity from poor shielding, undercut, crater cracking)?

**Handbook tables available but not used:** Table 3.2 (electrode diameter and gas nozzle against current, argon shielding). Use only with units, conditions and a page-image check.

**Missing for a robust version:** filler rod addition, AC waveform and cathodic cleaning, electrode tip geometry and classification, pulsing, back-purge, joint geometry, gas flow and purity guidance, heat input calculation. Each needs a reference supplied by the user or a source found and read.
