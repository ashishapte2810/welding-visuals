# GMAW (MIG)  `claims/gmaw.json`, builder `examples/legacy/gmaw-build.mjs` (not yet on the shared engine)

**Shows:** longitudinal section, DCEP, solid wire, constant-voltage source, wire-touch start, bead crown from filler. **Toggle:** short-circuit versus spray transfer.

| stage | p | what the model does |
|---|---|---|
| wire feed | 0 to 0.12 | gas on, wire advances toward the work |
| arc start | 0.12 to 0.22 | wire touches (0.12 to 0.15, current surge in the timeline), arc strikes, current ramps |
| pool growth | 0.22 to 0.36 | torch stationary, pool and crown grow |
| travel | 0.36 to 0.70 | transfer cycle runs, torch moves |
| arc end | 0.70 to 0.80 | feed stops, current falls, pool shrinks, crater |
| post-flow and freeze | 0.80 to 1.0 | gas continues, bead freezes |

**Status of facts:** 24 claims. Now backed by the **AWS Welding Handbook, 9th ed. vol. 2, ch. 4** (printed pages in each claim): constant-voltage self-regulation and extension effects (p.150, 183), the three transfer modes with rates and conditions (pp.150-154), DCEP (p.181), preflow and postflow (p.164), touch start and slow run-in (p.164), crater and crater cracks (pp.157, 195). Kim and Eagar (read in full) adds that the globular-to-spray change is gradual and that pinch-instability theory is inadequate; the handbook says the pinch force usually detaches drops. Both are kept, because they are about different things. The Wang and Tsai pool-flow model is for spot GMAW.

**Figure gaps from the handbook:** spray penetration is narrow, deep and finger-like (p.154) but the pool is drawn as a half-ellipse; globular transfer and pulsed GMAW (background and pulse currents) are described but not drawn; Table 4.1 (typical transition currents) was not used.

**Corrections made:** the earlier edit that replaced "pinch force" with "Lorentz force" was an over-correction (the handbook, p.153, says the pinch force usually detaches drops; the Kim and Eagar critique is of pinch-instability theory) and has been replaced by wording that keeps both; attribution of the force-balance paper confirmed.

**Questions for the expert**
1. Is a short-circuit cycle drawn this way recognizable? Typical sequence of arcing, bridging, pinch-off, re-ignition?
2. Is spray the right second mode, or should globular and pulsed be added?
3. What should the arc-start look like for your equipment (wire-touch, scratch, hot start)?
4. Shielding gas by material: which mixes should the figure mention?
5. Stickout and CTWD: what ratios look believable?

**Missing:** globular and pulsed transfer, inductance effects, flux-cored wire, spatter, joint geometry, wire feed and voltage windows (need a reference), burnback, porosity from gas loss.
