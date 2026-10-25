# The model contract

Each figure has **one pure function** `model(p, mode)` returning the state of the whole scene at timeline position `p` (0 to 1). Motion, readout and labels all come from it.

- **Pure and self-contained.** No outside variables except a `GEO` constants object; helpers (`clamp`, `smoothstep`) are defined inside. The function is stringified into the page, so anything it references must also exist there.
- **Returns** at least `stage` (index), `readout` (short phrase, `stage · detail`), and the quantities the scene needs (current, force, pool size, torch position...).
- **Smooth.** Use smoothstep ramps so scrubbing in either direction looks continuous. Stage boundaries live in one `ST` array shared with the timeline strip.
- **Qualitative unless sourced.** A level (low / moderate / high) is fine; a value needs a source (claims rule).
- **History without state.** If the picture depends on history (a weld bead that remembers where the pool has been), compute it from `p` alone: precompute an envelope by sampling the model over the whole timeline (`K` steps) and taking running maxima per x (see `examples/legacy/gtaw-build.mjs`, function `envelope`). The page then draws any `p` instantly and scrubbing backward works.
- **Modes** (`mode` argument) change parameters only (pool scale, nugget size, expulsion), never the code path.

## Build-time invariants (the build throws if one fails)
Write these for every figure, in every mode:
- idle at `p = 0` and finished at `p = 1` (no current, no pool, gas off);
- steady state in the middle of the main stage;
- ordering rules from the process (current only after force is established; arc only after wire contact; nugget only grows while current flows);
- monotonic things stay monotonic (torch never moves backward; the envelope never shrinks);
- the liquid region always lies inside the fused region;
- modes differ in the intended direction (hot case bigger and expels);
- **proportion rules** from `proportions.md` (for example nugget width against electrode face width).
A check that fails should name the rule. When a check fails, fix the model or the check's assumption deliberately; one of ours failed because the check tested the wrong instant.
