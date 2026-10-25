# Style

## Defaults
- **Delivered as a pure white page** (`hosted(..., {mode: "white"})`) with an auto light/dark variant available. Same dark ink for lines and labels; one hover-info panel under the figure; monospace labels.
- **Canvas** 960 by 640 viewBox. Scene occupies y 0 to about 490; the timeline strip lives at y 506 to 630 and is identical across figures. Keep 20 px margins; the top-right corner holds the particle key.
- **Colors mean materials.** Steel plate: cool grey gradient (`#dde2e7` to `#a3acb6`). Copper electrodes: reddish brown (`#a0522d` family with a darker edge). Heat: yellow glow (`#ffd21f`, fading to amber `#ffb300`); molten metal: yellow with an orange edge; expelled metal: orange. Water: pale blue with blue dots. Shielding gas: blue dots. Electrons: ink dots. The yellow glow is a stylistic heat cue, not a temperature scale; never add a color-to-temperature legend without a source.
- **Part tones inside a cut-away** (torch, nozzle) use neutral shades from the vendored kit; add material color only where a material is the point.

## Labels
- Leader lines end on a dot placed on the part. Move with the part (torch labels follow the torch) or sit on a fixed row below the scene.
- **Bottom labels are packed left to right** (`packLabels`) so they never collide; each gets a width estimate of about 7 px per character. Fixed label slots caused leader lines to cross the whole plate in an early version.
- Keep label text short; put the explanation in the hover text. `scripts/check-runtime.mjs` fails on labels that leave the canvas or overlap.
- Names: use the vocabulary of the standards glossary. Prefer the term the cited source uses (for example "stickout", with "electrode extension" in the hover text).

## Page text
- Each page shows: figure number and title, readout, caption ("schematic, not to scale; time axis stretched"), the stage text, the sources footer, and the education-only note.
- Typographic punctuation in visible text; straight quotes only in code.

## Output files
`dist/<figure>-white.html` (default to share) and `dist/<figure>-auto.html`. Self-contained, under 1 MB, no external resources.
