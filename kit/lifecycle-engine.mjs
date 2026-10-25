// Shared engine for "drag through the lifecycle" welding figures.
//
// A figure supplies: a pure model(p, mode) -> state S, a drawScene(S, p, sim, mode), the stage list and
// the SVG scene. This module supplies everything else: timeline strip, controls, drag / tour / keyboard /
// reduced-motion behaviour, hover info, readout, status text, and the shared CSS.
// The DOM contract (ids and classes) is documented in references/interaction-contract.md.

export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const f1 = (v) => +v.toFixed(1);

/** SVG markup for the timeline strip (stage bands, data rows, playhead, hit area). */
export function timelineSvg({ TL, ST, names, rows, info, hint = "drag left to right through the process" }) {
  const sx = (p) => TL.x0 + p * (TL.x1 - TL.x0);
  const wave = (fn, y0, amp, n = 200) => { let d = ""; for (let i = 0; i <= n; i++) d += (i ? "L" : "M") + f1(sx(i / n)) + " " + f1(y0 - fn(i / n) * amp); return d; };
  const bands = names.map((n, i) => `<rect class="tg-band tg-band-${i % 2}" data-i="${i}" x="${f1(sx(ST[i]))}" y="520" width="${f1(sx(ST[i + 1]) - sx(ST[i]))}" height="8"/><text class="tg-bandtxt" data-i="${i}" x="${f1((sx(ST[i]) + sx(ST[i + 1])) / 2)}" y="514" text-anchor="middle">${n}</text>`).join("");
  const seps = ST.slice(1, -1).map((p) => `<path class="tg-sep" d="M${f1(sx(p))} 520V610"/>`).join("");
  const rowSvg = rows.map((r) => {
    const d = r.kind === "area" ? `${wave(r.fn, r.y, r.amp)}L${TL.x1} ${r.y}L${TL.x0} ${r.y}Z` : wave(r.fn, r.y, r.amp);
    const cls = r.kind === "area" ? "tg-area" : `tg-wave ${r.cls || ""}`;
    return `<path class="${cls}" d="${d}"/><text class="tg-label tg-muted" x="${TL.x0 - 8}" y="${r.kind === "area" ? r.y - 1 : r.y - 12}" text-anchor="end">${r.label}</text>`;
  }).join("");
  return `<g class="hot" tabindex="0" data-info="${esc(info)}"><g id="tl">${bands}${seps}${rowSvg}<path id="tl-head" class="tg-head" d="M${TL.x0} 516V614"/><circle id="tl-knob" class="tg-knob" cx="${TL.x0}" cy="618" r="6"/><rect id="tl-hit" class="tg-hit tg-tl-hit" x="${TL.x0 - 6}" y="506" width="${TL.x1 - TL.x0 + 12}" height="126"/></g></g><text class="tg-label tg-muted" x="${TL.x0}" y="636">${hint}</text>`;
}

/** Play button, optional mode toggle, timeline slider, stage buttons, status and info lines. */
export function controlsHtml({ names, ST, modes = [], modeTitle = "Mode", readout0, text0 }) {
  const modeBtns = modes.length > 1
    ? `<div class="tg-modes" role="group" aria-label="${esc(modeTitle)}"><span>${esc(modeTitle)}</span>${modes.map((m, i) => `<button type="button" data-mode="${i}" aria-pressed="${i === 0}">${esc(m)}</button>`).join("")}</div>` : "";
  return `
<div class="tg-controls">
  <button id="play" type="button" aria-pressed="false">Pause tour</button>${modeBtns}
  <label class="tg-range"><span>Process timeline</span><input id="tl-range" type="range" min="0" max="1000" step="5" value="0" aria-valuetext="${esc(readout0)}"></label>
</div>
<div class="tg-stages" role="group" aria-label="Jump to a stage">${names.map((n, i) => `<button type="button" data-p="${ST[i]}" data-i="${i}">${i + 1} ${n}</button>`).join("")}</div>
<p id="status" class="tg-status" aria-live="polite"></p>
<p id="info" class="tg-info" aria-live="off">${text0}</p>`;
}

/** Script part 1: helpers and DOM references. Place before the figure's own script code. */
export function enginePrelude() {
  return `
const NS = "http://www.w3.org/2000/svg";
const svg = document.querySelector(".tg-fig");
const $ = (id) => svg.querySelector("#" + id);
const info = document.getElementById("info");
const statusEl = document.getElementById("status");
const range = document.getElementById("tl-range");
const playBtn = document.getElementById("play");
const readout = document.querySelector("[data-readout]");
const stageBtns = [...document.querySelectorAll(".tg-stages button")];
const modeBtns = [...document.querySelectorAll(".tg-modes button")];
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v) => Math.max(0, Math.min(1, v));
const sm = (v) => { v = clamp(v); return v * v * (3 - 2 * v); };
const frac = (v) => v - Math.floor(v);
const f1 = (v) => v.toFixed(1);
const mk = (name, attrs, parent) => { const el = document.createElementNS(NS, name); for (const k in attrs) el.setAttribute(k, attrs[k]); parent.appendChild(el); return el; };
// Leader-line labels. ids are the label groups "lb-<id>" (see references/style.md).
function makeLabels(ids) {
  const LB = {};
  for (const id of ids) { const g = $("lb-" + id); LB[id] = { g, leader: g.querySelector(".tg-leader"), dot: g.querySelector(".tg-dot"), text: g.querySelector("text") }; }
  return function label(id, dot, tpos, anchor, alpha) {
    const L = LB[id];
    if (alpha < 0.02) { L.g.style.opacity = 0; return; }
    L.g.style.opacity = alpha.toFixed(2);
    const sx = anchor === "end" ? tpos[0] + 4 : anchor === "start" ? tpos[0] - 4 : tpos[0];
    const sy = anchor === "middle" ? tpos[1] - 13 : tpos[1] - 4;
    L.leader.setAttribute("d", "M" + f1(sx) + " " + f1(sy) + "L" + f1(dot[0]) + " " + f1(dot[1]));
    L.dot.setAttribute("cx", f1(dot[0])); L.dot.setAttribute("cy", f1(dot[1]));
    L.text.setAttribute("x", f1(tpos[0])); L.text.setAttribute("y", f1(tpos[1])); L.text.setAttribute("text-anchor", anchor);
  };
}
// Pack bottom labels left to right so none collide: items = [{id, w (px), dot:[x,y], a (alpha)}]
function packLabels(label, items, y, left = 20, right = 930, gap = 18) {
  let edge = left;
  for (const it of items) {
    if (it.a < 0.02) { label(it.id, it.dot, [0, 0], "middle", 0); continue; }
    const half = it.w / 2, c = Math.min(Math.max(it.dot[0], edge + half), right - half);
    edge = c + half + gap;
    label(it.id, it.dot, [c, y], "middle", it.a);
  }
}`;
}

/** Script part 2: state, tick loop, drag, tour, keyboard, hover. Place after the figure's script code.
 *  Expects globals: model(p, mode), drawScene(S, p, sim, mode), STAGES [{name,text}], TL, MODES [..].
 *  Optional hooks: onMode(mode), stageExtra(S, mode) -> string, statusExtra(mode) -> string. */
export function engineMain({ tourSeconds = 30 } = {}) {
  return `
let mode = 0, target = 0, pd = 0, touring = !still.matches, userPaused = still.matches, lastTouch = -1e9, holdT = 0, holding = 0;
let sim = 0, last = 0, frame = 0, visible = false, lastStage = -1, hover = null, S = model(0, 0);
const TOUR = ${tourSeconds};
const headEl = $("tl-head"), knobEl = $("tl-knob");
const stageText = () => STAGES[S.stage].text + (typeof stageExtra === "function" ? stageExtra(S, mode) : "");

function draw(p) {
  S = model(p, mode);
  drawScene(S, p, sim, mode);
  const hx = TL.x0 + p * (TL.x1 - TL.x0);
  headEl.setAttribute("d", "M" + f1(hx) + " 516V614"); knobEl.setAttribute("cx", f1(hx));
  svg.querySelectorAll(".tg-band, .tg-bandtxt").forEach((el) => el.classList.toggle("is-on", +el.dataset.i === S.stage));
  if (readout.textContent !== S.readout) readout.textContent = S.readout;
  if (S.stage !== lastStage) {
    lastStage = S.stage;
    if (hover === null) info.textContent = stageText();
    statusEl.textContent = "Stage " + (S.stage + 1) + " of " + STAGES.length + ": " + STAGES[S.stage].name + "." + (typeof statusExtra === "function" ? statusExtra(mode) : "");
    stageBtns.forEach((bt) => { if (+bt.dataset.i === S.stage) bt.setAttribute("aria-current", "step"); else bt.removeAttribute("aria-current"); });
  }
  range.value = Math.round(p * 1000);
}
function touch(now) { lastTouch = now === undefined ? performance.now() : now; if (touring) { touring = false; syncPlay(); } }
function syncPlay() { playBtn.textContent = touring ? "Pause tour" : "Play tour"; playBtn.setAttribute("aria-pressed", String(!touring)); }
function setTarget(p) { lastTouch = performance.now(); target = clamp(p); if (still.matches) pd = target; range.setAttribute("aria-valuetext", model(target, mode).readout); run(); }

function tick(now) {
  frame = 0;
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (!still.matches) sim += dt;
  if (touring) {
    if (target < 1) target = Math.min(1, target + dt / TOUR);
    else { holdT += dt; if (holdT > 2.4) { target = 0; pd = 0; holdT = 0; } }
  } else if (!userPaused && !holding && !still.matches && now - lastTouch > 3600) { touring = true; holdT = 0; if (target >= 1) { target = 0; pd = 0; } syncPlay(); }
  pd = still.matches ? target : pd + (target - pd) * (1 - Math.exp(-dt / 0.16));
  if (Math.abs(target - pd) < 1e-4) pd = target;
  draw(pd);
  const settled = still.matches && pd === target;
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
function run() { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }

// drag: on the timeline strip (absolute) or anywhere on the stage (relative). 'holding' keeps the idle tour from resuming mid-drag.
const tlHit = $("tl-hit");
const vbScale = () => svg.getBoundingClientRect().width / 960;
tlHit.addEventListener("pointerdown", (e) => {
  e.stopPropagation(); touch(); holding++; tlHit.setPointerCapture(e.pointerId);
  const mv = (ev) => { const r = svg.getBoundingClientRect(); setTarget(((ev.clientX - r.left) / vbScale() - TL.x0) / (TL.x1 - TL.x0)); };
  mv(e);
  const up = (ev) => { holding = Math.max(0, holding - 1); tlHit.removeEventListener("pointermove", mv); tlHit.removeEventListener("pointerup", up); tlHit.removeEventListener("pointercancel", up); try { tlHit.releasePointerCapture(ev.pointerId); } catch (_) {} touch(); };
  tlHit.addEventListener("pointermove", mv); tlHit.addEventListener("pointerup", up); tlHit.addEventListener("pointercancel", up);
});
let drag = null;
svg.addEventListener("pointerdown", (e) => { if (e.button !== 0) return; drag = { x: e.clientX, p: target, id: e.pointerId, on: false }; });
svg.addEventListener("pointermove", (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.x;
  if (!drag.on && Math.abs(dx) > 5) { drag.on = true; holding++; touch(); try { svg.setPointerCapture(e.pointerId); } catch (_) {} }
  if (drag.on) setTarget(drag.p + dx / (svg.getBoundingClientRect().width * 0.8));
});
const endDrag = (e) => { if (drag && e.pointerId === drag.id) { if (drag.on) { holding = Math.max(0, holding - 1); try { svg.releasePointerCapture(e.pointerId); } catch (_) {} touch(); } drag = null; } };
svg.addEventListener("pointerup", endDrag); svg.addEventListener("pointercancel", endDrag);

range.addEventListener("input", () => { touch(); setTarget(+range.value / 1000); });
stageBtns.forEach((b) => b.addEventListener("click", () => { touch(); setTarget(+b.dataset.p + 0.002); }));
modeBtns.forEach((b) => b.addEventListener("click", () => {
  mode = +b.dataset.mode; modeBtns.forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
  if (typeof onMode === "function") onMode(mode);
  touch(); lastStage = -1; setTarget(target);
}));
playBtn.addEventListener("click", () => { if (touring) { touring = false; userPaused = true; } else { userPaused = false; touring = true; holdT = 0; if (target >= 1) { target = 0; pd = 0; } } syncPlay(); run(); });
document.addEventListener("keydown", (e) => {
  if (e.code !== "Space" || e.target.closest("button, a, input, textarea, select")) return;
  e.preventDefault(); playBtn.click();
});
still.addEventListener("change", () => { touring = !still.matches; userPaused = still.matches; syncPlay(); if (still.matches) pd = target; run(); });
svg.querySelectorAll(".hot").forEach((el) => {
  const on = () => { hover = el.dataset.info; info.textContent = hover; el.classList.add("is-hot"); };
  const off = () => { hover = null; info.textContent = stageText(); el.classList.remove("is-hot"); };
  el.addEventListener("pointerenter", on); el.addEventListener("pointerleave", off);
  el.addEventListener("focus", on); el.addEventListener("blur", off);
});
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); else if (frame) { cancelAnimationFrame(frame); frame = 0; } }, { rootMargin: "120px 0px" }).observe(svg);
syncPlay();
draw(0);
run();`;
}

/** Shared CSS (controls, timeline, labels, info panel, sources footer). Figure-specific CSS is added separately. */
export const ENGINE_CSS = `
.tg-svg{padding:0}
.tg-fig{display:block;width:100%;height:auto;touch-action:pan-y;user-select:none;-webkit-user-select:none}
.tg-hit{fill:transparent;pointer-events:all}
.tg-tl-hit{cursor:ew-resize}
.tg-label{fill:var(--anatomy-text);font:11.5px var(--anatomy-mono);letter-spacing:.01em}
.tg-muted{fill:var(--anatomy-muted)}
.tg-leader{fill:none;stroke:var(--anatomy-mid);stroke-width:.7}
.tg-dot{fill:var(--anatomy-dot)}
.tg-lb{pointer-events:none;opacity:0}
.tg-band{fill:var(--anatomy-faint)}
.tg-band-1{fill:var(--anatomy-lo);opacity:.55}
.tg-band.is-on{fill:var(--anatomy-lit);opacity:1}
.tg-bandtxt{fill:var(--anatomy-muted);font:10.5px var(--anatomy-mono);pointer-events:none}
.tg-bandtxt.is-on{fill:var(--anatomy-strong)}
.tg-sep{fill:none;stroke:var(--anatomy-faint);stroke-width:.7}
.tg-wave{fill:none;stroke:var(--anatomy-hi);stroke-width:1.3;stroke-linejoin:round}
.tg-wave2{stroke:var(--anatomy-mid)}
.tg-area{fill:var(--anatomy-mid);opacity:.7;stroke:none}
.tg-head{fill:none;stroke:var(--anatomy-lit);stroke-width:1.3}
.tg-knob{fill:var(--anatomy-paper);stroke:var(--anatomy-lit);stroke-width:1.6;vector-effect:non-scaling-stroke;pointer-events:none}
.tg-key{pointer-events:none}
.hot{cursor:help;outline:none}
.hot.is-hot{filter:drop-shadow(0 0 3px var(--anatomy-lit))}
.hot:focus-visible{outline:2px solid var(--anatomy-lit);outline-offset:3px}
.tg-controls{display:flex;flex-wrap:wrap;gap:14px 28px;align-items:center;margin:14px 2px 6px;font:12.5px var(--anatomy-mono);color:var(--anatomy-text)}
.tg-controls button,.tg-stages button{border:1px solid var(--anatomy-faint);background:transparent;color:var(--anatomy-text);font:12px var(--anatomy-mono);padding:6px 10px;cursor:pointer}
.tg-stages button[aria-current=step],.tg-modes button[aria-pressed=true]{border-color:var(--anatomy-lit);color:var(--anatomy-strong)}
.tg-modes{display:flex;gap:8px;align-items:center}
.tg-range{display:flex;flex-direction:column;gap:2px;flex:1;min-width:220px}
.tg-range input{accent-color:var(--anatomy-lit);width:100%}
.tg-stages{display:flex;flex-wrap:wrap;gap:8px;margin:8px 2px}
.tg-controls :focus-visible,.tg-stages :focus-visible{outline:2px solid var(--anatomy-lit);outline-offset:3px}
.tg-status{font:12px/1.5 var(--anatomy-mono);color:var(--anatomy-text);margin:6px 2px}
.tg-info{min-height:13em;font:12.5px/1.55 var(--anatomy-mono);color:var(--anatomy-strong);margin:8px 2px;border-left:2px solid var(--anatomy-faint);padding-left:10px}
.bio-sources{margin:20px 2px;color:var(--anatomy-muted);font-size:12.5px;line-height:1.65}
.bio-sources h2{font:600 13px var(--anatomy-mono);color:var(--anatomy-text);margin:0 0 8px}
.bio-sources ul{padding-left:18px}.bio-sources li{margin:6px 0}
.bio-sources a{color:var(--anatomy-text);text-underline-offset:2px}
`;
