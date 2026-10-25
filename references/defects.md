# Defects (template and what is sourced so far)

Each defect gets: **cause**, **mechanism** (what physically happens), **how it would show in a figure** (a toggle or a frame), **acceptance language** (from the governing code, not from me), **sources**, **expert status**.

| defect | process | what the sources read say | figure idea | status |
|---|---|---|---|---|
| Expulsion | spot | molten metal expelled when the molten volume is too large to contain under the force, with low force, early current, or too long a weld time; leaves a thinner, weaker weld (Hirsch and Leibovitz **read**; aluminium paper and Wikipedia **snippet**) | built: heat toggle | in `claims/rsw.json`, pending review |
| Excessive indentation | spot | dents come from surface softening; reduced by adequate force; thins the nugget cross-section (Hirsch and Leibovitz **read**) | partly shown | pending |
| Tungsten inclusion | TIG | touch starts can stick the electrode, contaminating it and transferring tungsten to the work (9th ed. vol. 2 p.129); too much current erodes or melts the tungsten, and particles in the pool are defects (p.113); dipping the electrode or touching it with filler contaminates it (p.116) | planned: contact-start toggle | sourced, not built |
| Humping, undercut, tunnelling | TIG at high current and speed | process maps show defects when travel speed or current is too high (Alberta paper, **excerpt read**) | planned: speed slider | not built |
| Shallow, low-ductility nugget | spot | too-high force lowers interface resistance, gives shallow penetration (Hirsch and Leibovitz **read**) | planned: force toggle | not built |
| Porosity (shielding loss) | TIG, MIG | **no source read** | planned: gas-off toggle | open |
| Lack of fusion | all | **no source read** | planned | open |
| Hot and cold cracking, crater cracking | all | **no source read** | planned | open |
| Spatter (globular, CO2) | MIG | short drop shorts to work and disintegrates (globular, arc too short); CO2 gives non-axial globular transfer and severe spatter unless the arc is buried (9th ed. vol. 2 pp.152-153) | planned: gas toggle | sourced, not built |
| Stubbing | MIG | excessively low voltage lets the electrode dip into the pool and freeze in place for lack of short-circuit current (9th ed. vol. 2 p.183) | planned | sourced, not built |
| Crater crack | MIG, arc welding | a crater crack at the end of a gas metal arc weld is shown (9th ed. vol. 2 p.195); crater is a depression in the weld face at the very end of the weld (p.55) | partly shown (crater) | sourced, not built |
| Electrode pickup | spot (aluminium) | copper-aluminium alloy forms on electrode faces; brittle, low conductivity; contact resistance rises and the pickup sticks; caused by poor surface preparation, low force or excess current (8th ed. vol. 3 pp.75-76) | planned (aluminium only) | sourced, not built |
| Burn-through | MIG | **no source read** (spray at high current may cut through thin sheet, 9th ed. vol. 2 p.154) | planned | partly sourced |

Do not add acceptance limits or defect causes from memory. Ask for the inspection standard and a defect atlas.
