# Verification

Run `node scripts/verify-all.mjs <figure.html>` (add `--auto` for the auto-theme page). Install once: `cd scripts && npm install`.

| script | what it proves |
|---|---|
| `check-hosted.mjs` | self-contained (no external scripts, styles, images, fonts), size limit, phone safe-area, theme tokens as expected |
| `check-runtime.mjs` | sweeps the timeline in every mode: no script errors, no NaN/undefined geometry, readout present, labels inside the canvas and not overlapping |
| `check-interactions.mjs` | the interaction contract: drag, hold, tour resume, pause, keys, hover, mode toggle, reduced motion |
| `lint-claims.mjs` | claim registry rules |
| `render-frames.mjs` | PNG stills for **looking at the layout**; always open and read several frames across the timeline, in each mode and theme |
| `export-video.mjs` | draft MP4/GIF of the idle tour |

## These checks cannot replace
They run in a simulated browser (jsdom) and a vector renderer (resvg). They do **not** see real browser layout, real fonts, soft glows and shadows (the renderer drops them), touch behaviour or performance. Before sharing outside a trusted group, open the page in a real browser and check:
1. Dark/light/white pages; phone width; text not clipped at the page edges.
2. Drag the strip and the stage with mouse and touch; Space; Tab order; screen-reader text.
3. Reduced-motion setting on.
4. The glow, yellow nugget and spatter against the white background.
5. Two or three frames in each mode against any reference macro photos.

## Keep the negative controls in mind
Each check was shown to fail on a reintroduced bug: an off-canvas label, a tour that hijacks a drag, and a duplicated variable name that stopped the page from loading. When you add a check, add a deliberately broken copy that it must reject.
