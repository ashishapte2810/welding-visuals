#!/usr/bin/env node
// Assert the interaction contract (references/interaction-contract.md). Exits non-zero on any failure.
//   node check-interactions.mjs <figure.html>
import { loadPage, fail, ok } from "./lib/sim.mjs";
const file = process.argv[2]; if (!file) { console.error("usage: check-interactions.mjs <figure.html>"); process.exit(2); }
const page = loadPage(file); const { q, qa, w, frames, ev, setP, errors } = page;
const val = () => +q("#tl-range").value, play = () => q("#play").textContent;
const expect = (cond, pass, bad) => (cond ? ok(pass) : fail(bad));
frames(20); expect(play() === "Pause tour", "tour runs on load", "tour should run on load (play=" + play() + ")");
frames(300); expect(val() > 0, "tour advances the timeline", "tour did not advance");
// strip drag, then hold 5 s at the far end: the tour must not take over mid-drag
const hit = q("#tl-hit"), svg = q(".tg-fig");
ev(hit, "pointerdown", { clientX: 130 + 0.5 * 770, clientY: 560 }); frames(30);
expect(Math.abs(val() - 500) <= 10, "timeline strip: press maps to position", "strip press expected ~500, got " + val());
ev(hit, "pointermove", { clientX: 900, clientY: 560 }); frames(150);
expect(val() >= 995, "timeline strip: drag and hold stays put for 5 s (tour does not hijack)", "strip drag hold ended at " + val());
ev(hit, "pointermove", { clientX: 130, clientY: 560 }); frames(60); expect(val() <= 5, "timeline strip: drag back to start", "drag back ended at " + val());
ev(hit, "pointerup", { clientX: 130, clientY: 560 }); frames(5);
// whole-stage relative drag
setP(0.1); frames(40); const v0 = val();
ev(svg, "pointerdown", { clientX: 300, clientY: 200 }); ev(svg, "pointermove", { clientX: 303, clientY: 200 }); frames(5);
expect(Math.abs(val() - v0) <= 3, "stage drag: under 5 px is not a drag", "tiny movement changed the timeline");
ev(svg, "pointermove", { clientX: 300 + 384, clientY: 200 }); frames(80); expect(val() > v0 + 350, "stage drag: moves the timeline", "stage drag gave " + val() + " from " + v0);
ev(svg, "pointerup", { clientX: 684, clientY: 200 }); frames(5);
// idle tour resumes only after the delay
frames(60); expect(play() === "Play tour", "tour stays off shortly after release", "tour resumed too early");
frames(90); expect(play() === "Pause tour", "tour resumes after the idle delay", "tour never resumed");
// stage buttons and aria
const btns = qa(".tg-stages button"); btns[btns.length - 1].click(); frames(100);
expect(q('.tg-stages button[aria-current="step"]')?.dataset.i == btns.length - 1, "stage button jumps and marks aria-current", "stage button did not set aria-current");
expect(q("#tl-range").getAttribute("aria-valuetext").length > 3, "slider has spoken value text", "slider aria-valuetext missing");
// explicit pause holds; space toggles
q("#play").click(); q("#play").click(); const r0 = val(); frames(400);
expect(val() === r0 && play() === "Play tour", "explicit pause holds for 13 s", "explicit pause did not hold");
const k = new w.Event("keydown", { bubbles: true }); k.code = "Space"; w.document.body.dispatchEvent(k);
expect(play() === "Pause tour", "space key toggles the tour", "space did not toggle");
// hover info shows and restores
const hot = qa(".hot")[0], before = q("#info").textContent; ev(hot, "pointerenter"); const during = q("#info").textContent; ev(hot, "pointerleave");
expect(during !== before && q("#info").textContent === before, "hover shows part info and restores the stage text", "hover info did not show/restore");
// every hover text must be non-empty
expect(qa(".hot").every((h) => (h.dataset.info || "").length > 20), "every hoverable part has an explanation", "a .hot element has empty data-info");
// mode toggle
const mb = qa(".tg-modes button");
if (mb.length > 1) { setP(0.5); frames(60); const a = q("[data-readout]").textContent; mb[1].click(); frames(60); const b = q("[data-readout]").textContent;
  expect(a !== b && mb[1].getAttribute("aria-pressed") === "true", "mode toggle changes the readout and aria-pressed", "mode toggle had no effect"); mb[0].click(); }
// reduced motion: instant
page.setReduced(true); frames(3); setP(0.8); frames(2);
expect(val() === 800, "reduced motion: timeline jumps instantly", "reduced motion value " + val());
if (errors.length) fail("script errors: " + errors[0].split("\n")[0]); else ok("no script errors during interaction");
