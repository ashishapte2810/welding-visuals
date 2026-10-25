# Interaction contract (what `kit/lifecycle-engine.mjs` implements and `scripts/check-interactions.mjs` asserts)

## DOM
`.tg-fig` (the SVG) · `#tl-hit` (timeline hit area), `#tl-head`, `#tl-knob`, `.tg-band` / `.tg-bandtxt` with `data-i` · `#tl-range` (native slider, 0 to 1000) · `#play` · `.tg-stages button[data-p][data-i]` · `.tg-modes button[data-mode]` (optional) · `#status` (aria-live) · `#info` · `[data-readout]` (the plate's readout) · `.hot[data-info]` parts · label groups `#lb-<id>`.

## Behaviour
- **Idle tour** plays the process on load (about 30 s), holds 2.4 s at the end, then restarts. Any interaction stops it; it resumes 3.6 s after the last interaction **unless** the user pressed Pause or a drag is still held.
- **Drag** on the timeline strip maps position to time (absolute). Drag anywhere on the figure is relative (full width of 80 percent is the whole process); under 5 px is not a drag. Pointer capture is taken, and the tour stays off while held.
- **Easing**: the displayed position follows the target with a time constant of about 0.16 s so scrubbing feels continuous.
- **Keyboard**: slider arrows, stage buttons, Space toggles the tour (ignored inside buttons, links and inputs).
- **Spoken text**: `aria-valuetext` on the slider carries the stage phrase; `#status` announces stage changes and mode changes; `aria-current="step"` marks the active stage button.
- **Hover/focus** a `.hot` part shows its explanation in `#info`; leaving restores the current stage text.
- **Reduced motion**: no tour, no ambient particle motion, the timeline jumps to its target at once, and the page still shows a meaningful frame.
- **Visibility**: the animation loop stops when the figure is offscreen (IntersectionObserver with a margin; use the newest entry).

## Optional hooks a figure may define
`onMode(mode)` · `stageExtra(S, mode)` (text appended to the stage text) · `statusExtra(mode)`.
