// LEGACY: standalone build from before the shared engine and claim registry existed. Kept as a working reference (the envelope technique
// for history-dependent pictures lives here). Port to kit/lifecycle-engine.mjs and claims/gtaw.json when next edited.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { BIO_CSS } from "../../kit/vendor/anima/blob.mjs";
import { esc } from "../../kit/lifecycle-engine.mjs";
import { footerHtml, hoverKeys, hoverText, lintRegistry, loadRegistry, stageText } from "../../kit/claims.mjs";
import { figureSvg, pageHtml, pathOf, plateHtml } from "../../kit/vendor/anima/iso-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const light = process.argv.includes("--light");
const WIDTH = 960;
const HEIGHT = 640;

const GEO = { SURF: 360, XS: 190, XE: 640, X0: 40, X1: 920, STEP: 2, K: 400, D: 36, TIPY: 336, CUPY: 322, HMAX: 26 };
const TL = { x0: 130, x1: 900 };
const ST = [0, 0.1, 0.2, 0.36, 0.7, 0.8, 1];
const NAMES = ["pre-flow", "arc start", "pool growth", "travel · solidification", "downslope", "post-flow · freeze"];

function model(p) {
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const sm = (v) => { v = clamp(v); return v * v * (3 - 2 * v); };
  p = clamp(p);
  const I = (p < 0.17 ? 0 : sm((p - 0.17) / 0.07)) * (1 - sm((p - 0.7) / 0.1));
  const g = sm(p / 0.03) * (1 - sm((p - 0.95) / 0.05));
  const s = sm((p - 0.17) / 0.19) * (1 - sm((p - 0.74) / 0.2));
  const v = sm((p - 0.36) / 0.04) * (1 - sm((p - 0.68) / 0.04));
  const u = clamp((p - 0.36) / 0.34);
  const tx = GEO.XS + (GEO.XE - GEO.XS) * (0.6 * u + 0.4 * sm(u));
  const Lf = 32 * s;
  const Lr = s * (40 + 50 * v);
  const spark = p >= 0.1 && p < 0.17 ? 1 : 0;
  const stage = p < 0.1 ? 0 : p < 0.2 ? 1 : p < 0.36 ? 2 : p < 0.7 ? 3 : p < 0.8 ? 4 : 5;
  const hz = GEO.HMAX * sm((p - 0.2) / 0.55);
  const crater = sm((p - 0.9) / 0.07);
  let readout;
  if (p < 0.1) readout = "pre-flow · argon on, no arc";
  else if (p < 0.17) readout = "arc start · HF spark in the gap";
  else if (p < 0.2) readout = "arc start · current ramping up";
  else if (p < 0.36) readout = "pool growth · torch stationary";
  else if (p < 0.7) readout = "travel · pool trails the arc";
  else if (p < 0.8) readout = "downslope · arc fading";
  else if (p < 0.94) readout = "post-flow · pool freezing";
  else if (p < 0.995) readout = "post-flow · weld cooling";
  else readout = "complete · gas off";
  return { I, g, s, v, tx, Lf, Lr, spark, stage, hz, crater, readout };
}
function poolDepth(xi, S) {
  const L = S.Lf + S.Lr;
  if (L < 1) return 0;
  const c = (S.Lf - S.Lr) / 2;
  const h = L / 2;
  const t = (xi - c) / h;
  return Math.abs(t) < 1 ? GEO.D * S.s * Math.sqrt(1 - t * t) : 0;
}
function envelope() {
  const N = Math.floor((GEO.X1 - GEO.X0) / GEO.STEP) + 1;
  const K = GEO.K;
  const env = new Float32Array((K + 1) * N);
  for (let k = 0; k <= K; k++) {
    const S = model(k / K);
    for (let j = 0; j < N; j++) {
      const d = poolDepth(GEO.X0 + j * GEO.STEP - S.tx, S);
      const prev = k ? env[(k - 1) * N + j] : 0;
      env[k * N + j] = d > prev ? d : prev;
    }
  }
  return { env, N };
}

// ---- build-time checks of the model ----
{
  const near = (a, b, t = 1e-6) => Math.abs(a - b) <= t;
  const m0 = model(0), m5 = model(0.5), m1 = model(1);
  if (m0.I !== 0 || m0.s !== 0 || m0.g !== 0) throw new Error("p=0 must be idle");
  if (!near(m5.I, 1) || !near(m5.s, 1) || !near(m5.v, 1)) throw new Error("p=0.5 must be steady travel");
  if (m1.I !== 0 || m1.s !== 0 || m1.g !== 0) throw new Error("p=1 must be finished");
  if (!near(model(0.36).tx, GEO.XS) || !near(model(0.7).tx, GEO.XE)) throw new Error("torch must travel XS to XE over the travel stage");
  if (!(model(0.5).Lr > model(0.3).Lr)) throw new Error("pool tail must lengthen with travel");
  if (model(0.15).I !== 0 || model(0.15).spark !== 1) throw new Error("HF spark stage has no welding current yet");
  for (let a = 0; a < 1; a += 0.005) { if (model(a + 0.005).tx < model(a).tx - 1e-9) throw new Error("torch must not move backwards"); }
  const { env, N } = envelope();
  const last = GEO.K * N;
  let mx = 0, first = -1, lastj = -1;
  for (let j = 0; j < N; j++) { const d = env[last + j]; if (d > mx) mx = d; if (d > 0.3) { if (first < 0) first = j; lastj = j; } }
  const xa = GEO.X0 + first * GEO.STEP, xb = GEO.X0 + lastj * GEO.STEP;
  if (mx < GEO.D * 0.97 || mx > GEO.D * 1.001) throw new Error("max pool depth " + mx);
  if (xa < GEO.XS - 60 || xb > GEO.XE + 60) throw new Error("weld span out of range " + xa + "," + xb);
  for (let k = 1; k <= GEO.K; k++) for (let j = 0; j < N; j += 17) if (env[k * N + j] < env[(k - 1) * N + j]) throw new Error("envelope must not shrink");
  for (let k = 0; k <= GEO.K; k += 8) {
    const S = model(k / GEO.K);
    for (let xi = -S.Lr; xi <= S.Lf; xi += 2) { const x = S.tx + xi; const jf = (x - GEO.X0) / GEO.STEP; const j0 = Math.max(0, Math.floor(jf)), j1 = Math.min(N - 1, Math.ceil(jf)); const lim = Math.max(env[k * N + j0], env[k * N + j1]); if (poolDepth(xi, S) > lim + 0.5) throw new Error("pool outside envelope at k=" + k + " xi=" + xi); }
  }
}

const { env: ENV, N: NX } = envelope();
const SURF = GEO.SURF;
const f1 = (v) => +v.toFixed(1);
const xAt = (j) => GEO.X0 + j * GEO.STEP;

// columnar grain lines: normals to the final fusion boundary, tilted toward the heat source
const grains = (() => {
  const base = GEO.K * NX;
  let d = "";
  for (let j = 4; j < NX - 4; j += 4) {
    const e = ENV[base + j];
    if (e < 4) continue;
    const slope = (ENV[base + j + 1] - ENV[base + j - 1]) / (2 * GEO.STEP);
    let th = Math.atan2(-1, slope) + (24 * Math.PI) / 180;
    const th2 = th + (20 * Math.PI) / 180;
    const x0 = xAt(j), y0 = SURF + e;
    const len = 38 + 6 * Math.sin(j * 0.7);
    const c = [x0 + 0.38 * len * Math.cos(th), y0 + 0.38 * len * Math.sin(th)];
    const t = [c[0] + 0.62 * len * Math.cos(th2), c[1] + 0.62 * len * Math.sin(th2)];
    d += `M${f1(x0)} ${f1(y0)}Q${f1(c[0])} ${f1(c[1])} ${f1(t[0])} ${f1(t[1])}`;
  }
  return d;
})();

const wave = (fn, y0, amp, n = 160) => {
  let d = "";
  for (let i = 0; i <= n; i++) { const x = TL.x0 + (i / n) * (TL.x1 - TL.x0); d += (i ? "L" : "M") + f1(x) + " " + f1(y0 - fn(i / n) * amp); }
  return d;
};
const area = (fn, y0, amp, n = 160) => `${wave(fn, y0, amp, n)}L${TL.x1} ${y0}L${TL.x0} ${y0}Z`;
const sx = (p) => TL.x0 + p * (TL.x1 - TL.x0);

const dotAt = (x, y) => `<circle class="tg-dot" cx="${x}" cy="${y}" r="1.7"/>`;
const mkLabel = (id, text, cls = "") => `<g id="lb-${id}" class="tg-lb"><path class="tg-leader"/><circle class="tg-dot" r="1.7"/><text class="tg-label ${cls}">${text}</text></g>`;

// Text comes from the claim registry (claims/gtaw.json); every sentence is linted and reviewable.
const ROOT = join(HERE, "../..");
const reg = lintRegistry(loadRegistry(join(ROOT, "claims/gtaw.json"), join(ROOT, "claims/sources.json")));
const RAW = Object.fromEntries(hoverKeys(reg).map((k) => [k, hoverText(reg, k)]));
const INFO = Object.fromEntries(Object.entries(RAW).map(([k, v]) => [k, esc(v)]));


const STAGE_NAMES = ["Pre-flow", "Arc start", "Pool growth", "Travel", "Downslope", "Post-flow and freeze"];
const STAGES = STAGE_NAMES.map((name, i) => ({ name, text: stageText(reg, i) }));


const bands = NAMES.map((n, i) => `<rect class="tg-band tg-band-${i % 2}" data-i="${i}" x="${f1(sx(ST[i]))}" y="520" width="${f1(sx(ST[i + 1]) - sx(ST[i]))}" height="8"/><text class="tg-bandtxt" data-i="${i}" x="${f1((sx(ST[i]) + sx(ST[i + 1])) / 2)}" y="514" text-anchor="middle">${n}</text>`).join("");
const seps = ST.slice(1, -1).map((p) => `<path class="tg-sep" d="M${f1(sx(p))} 520V608"/>`).join("");

const body = [
  `<defs>
<clipPath id="plate-clip"><rect x="${GEO.X0}" y="${SURF}" width="${GEO.X1 - GEO.X0}" height="90"/></clipPath>
<clipPath id="weld-clip"><path id="weld-clip-path" d=""/></clipPath>
<linearGradient id="arc-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--anatomy-lit);stop-opacity:.85"/><stop offset="1" style="stop-color:var(--anatomy-lit);stop-opacity:.3"/></linearGradient>
<radialGradient id="glow-grad"><stop offset="0" style="stop-color:var(--anatomy-lit);stop-opacity:.5"/><stop offset="1" style="stop-color:var(--anatomy-lit);stop-opacity:0"/></radialGradient>
</defs>`,
  `<g class="hot" tabindex="0" data-info="${INFO.base}"><rect class="tg-plate" x="${GEO.X0}" y="${SURF}" width="${GEO.X1 - GEO.X0}" height="90"/></g>`,
  `<g clip-path="url(#plate-clip)"><g class="hot" tabindex="0" data-info="${INFO.haz}"><path id="haz" class="tg-haz" d=""/></g></g>`,
  `<circle id="glow" class="tg-glow" cx="${GEO.XS}" cy="${SURF}" r="96" fill="url(#glow-grad)"/>`,
  `<g class="hot" tabindex="0" data-info="${INFO.weld}"><path id="weld" class="tg-weld" d=""/></g>`,
  `<g clip-path="url(#weld-clip)" class="tg-grains"><path d="${grains}"/></g>`,
  `<path id="fusion" class="tg-fusion" d=""/>`,
  `<g class="hot" tabindex="0" data-info="${INFO.pool}"><path id="pool" class="tg-pool" d=""/></g>`,
  `<g id="flow"></g>`,
  `<g id="gas"></g>`,

  `<g id="arcg" class="tg-arcg"><g class="hot" tabindex="0" data-info="${INFO.arc}"><path id="arc" class="tg-arc" d="M-3 ${GEO.TIPY}Q-12 ${GEO.TIPY + 14} -22 ${SURF}L22 ${SURF}Q12 ${GEO.TIPY + 14} 3 ${GEO.TIPY}Z" fill="url(#arc-grad)"/><path id="arc-core" class="tg-core" d="M0 ${GEO.TIPY + 2}V${SURF}"/><ellipse id="anode" class="tg-anode" cx="0" cy="${SURF}" rx="17" ry="3"/><circle id="tipglow" class="tg-tipglow" cx="0" cy="${GEO.TIPY}" r="5"/></g><path id="spark" class="tg-spark" d=""/><g id="carriers"></g></g>`,

  `<g id="torch" class="tg-torch">
<g class="hot" tabindex="0" data-info="${INFO.cup}"><rect class="tg-body" x="-17" y="62" width="34" height="200" rx="4"/><rect class="tg-collet" x="-9" y="44" width="18" height="18" rx="2"/><rect class="tg-stub" x="-31" y="104" width="14" height="10"/><path class="tg-cup" d="M-30 ${GEO.CUPY}L-22 ${GEO.CUPY}L-18 262L-25 262Z"/><path class="tg-cup" d="M30 ${GEO.CUPY}L22 ${GEO.CUPY}L18 262L25 262Z"/><rect class="tg-cup" x="-26" y="256" width="52" height="8" rx="2"/></g>
<g class="hot" tabindex="0" data-info="${INFO.elec}"><path class="tg-elec" d="M-2 150H2V320L0.7 336H-0.7L-2 320Z"/></g>
<g class="hot" tabindex="0" data-info="${INFO.gas}"><rect class="tg-hit" x="-64" y="${GEO.CUPY}" width="128" height="36"/></g>
</g>`,

  mkLabel("elec", "tungsten electrode"),
  mkLabel("cup", "gas cup"),
  mkLabel("gas", "argon shielding gas"),
  mkLabel("arc", "arc plasma"),
  mkLabel("base", "base metal"),
  mkLabel("haz", "heat-affected zone"),
  mkLabel("weld", "solidified weld metal"),
  mkLabel("pool", "weld pool (liquid)"),

  `<g class="hot" tabindex="0" data-info="${INFO.tl}"><g id="tl">
${bands}${seps}
<path class="tg-wave" d="${wave((p) => model(p).I, 574, 34)}"/>
<path class="tg-area" d="${area((p) => model(p).g, 590, 8)}"/>
<path class="tg-area" d="${area((p) => model(p).v, 606, 8)}"/>
<text class="tg-label tg-muted" x="122" y="560" text-anchor="end">current</text>
<text class="tg-label tg-muted" x="122" y="589" text-anchor="end">gas</text>
<text class="tg-label tg-muted" x="122" y="605" text-anchor="end">travel</text>
<path id="tl-head" class="tg-head" d="M${TL.x0} 516V612"/><circle id="tl-knob" class="tg-knob" cx="${TL.x0}" cy="616" r="6"/>
<rect id="tl-hit" class="tg-hit tg-tl-hit" x="${TL.x0 - 6}" y="506" width="${TL.x1 - TL.x0 + 12}" height="122"/>
</g></g>`,
  `<text class="tg-label tg-muted" x="${TL.x0}" y="636">drag left to right through the process</text>`,
  `<g class="tg-key"><circle class="tg-e" cx="716" cy="30" r="3.2"/><text class="tg-label" x="726" y="34">electron</text><circle class="tg-ion" cx="806" cy="30" r="3"/><text class="tg-label" x="816" y="34">Ar\u207a</text><circle class="tg-gasdot" cx="862" cy="30" r="3"/><text class="tg-label" x="872" y="34">Ar</text></g>`,
].join("");

const svg = figureSvg({
  width: WIDTH, height: HEIGHT,
  label: "Schematic longitudinal section of gas tungsten arc welding (TIG) on a flat plate, with a timeline. Shielding gas starts, a high-frequency spark starts the arc between a tungsten electrode and the plate, a weld pool grows, the torch travels with the pool lengthening behind the arc, current ramps down, and the pool freezes into columnar grains with a heat-affected zone beyond the fusion boundary.",
  body, className: "tg-fig",
});

const framed = plateHtml({
  fig: "Fig 1",
  title: "GTAW (TIG): arc to solidified weld",
  hint: "drag left to right \u00b7 hover a part \u00b7 space: pause",
  readout: model(0).readout,
  caption: "Schematic, not to scale; the time axis is stretched and uneven. Longitudinal section along the weld axis: DC electrode negative (DCEN), autogenous (no filler), flat position. Qualitative, no process values are claimed.",
  body: `<div class="tg-svg">${svg}</div>`,
});

const controls = `
<div class="tg-controls">
  <button id="play" type="button" aria-pressed="false">Pause tour</button>
  <label class="tg-range"><span>Process timeline</span><input id="tl-range" type="range" min="0" max="1000" step="5" value="0" aria-valuetext="${model(0).readout}"></label>
</div>
<div class="tg-stages" role="group" aria-label="Jump to a stage">${NAMES.map((n, i) => `<button type="button" data-p="${ST[i]}" data-i="${i}">${i + 1} ${n}</button>`).join("")}</div>
<p id="status" class="tg-status" aria-live="polite"></p>
<p id="info" class="tg-info" aria-live="off">${STAGES[0].text}</p>`;

const sources = footerHtml(reg);

const script = `
const GEO = ${JSON.stringify(GEO)};
const TL = ${JSON.stringify(TL)};
const ST = ${JSON.stringify(ST)};
const STAGES = ${JSON.stringify(STAGES)};
const model = ${model.toString()};
const poolDepth = ${poolDepth.toString()};
const envelope = ${envelope.toString()};
const NS = "http://www.w3.org/2000/svg";
const svg = document.querySelector(".tg-fig");
const $ = (id) => svg.querySelector("#" + id);
const info = document.getElementById("info");
const statusEl = document.getElementById("status");
const range = document.getElementById("tl-range");
const playBtn = document.getElementById("play");
const readout = document.querySelector("[data-readout]");
const stageBtns = [...document.querySelectorAll(".tg-stages button")];
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v) => Math.max(0, Math.min(1, v));
const frac = (v) => v - Math.floor(v);
const mk = (name, attrs, parent) => { const el = document.createElementNS(NS, name); for (const k in attrs) el.setAttribute(k, attrs[k]); parent.appendChild(el); return el; };
const { env, N } = envelope();
const xAt = (j) => GEO.X0 + j * GEO.STEP;
const SURF = GEO.SURF;
const f1 = (v) => v.toFixed(1);

const E = { weld: $("weld"), clip: $("weld-clip-path"), haz: $("haz"), fusion: $("fusion"), pool: $("pool"), glow: $("glow"), arcg: $("arcg"), arc: $("arc"), core: $("arc-core"), anode: $("anode"), tip: $("tipglow"), spark: $("spark"), torch: $("torch"), head: $("tl-head"), knob: $("tl-knob") };
const NG = 16, NE = 10, NI = 4, NF = 8;
const gasP = Array.from({ length: NG }, () => mk("circle", { class: "tg-gasdot", r: 2.2 }, $("gas")));
const elecs = Array.from({ length: NE }, () => mk("circle", { class: "tg-e", r: 2.6 }, $("carriers")));
const ions = Array.from({ length: NI }, () => mk("circle", { class: "tg-ion", r: 2.6 }, $("carriers")));
const flowP = Array.from({ length: NF }, () => mk("circle", { class: "tg-flowdot", r: 2.1 }, $("flow")));
const LB = {};
for (const id of ["elec", "cup", "gas", "arc", "base", "haz", "weld", "pool"]) { const g = $("lb-" + id); LB[id] = { g, leader: g.querySelector(".tg-leader"), dot: g.querySelector(".tg-dot"), text: g.querySelector("text") }; }
function label(id, dot, tpos, anchor, alpha) {
  const L = LB[id];
  if (alpha < 0.02) { L.g.style.opacity = 0; return; }
  L.g.style.opacity = alpha.toFixed(2);
  const sx = anchor === "end" ? tpos[0] + 4 : anchor === "start" ? tpos[0] - 4 : tpos[0];
  const sy = anchor === "middle" ? tpos[1] - 13 : tpos[1] - 4;
  L.leader.setAttribute("d", "M" + f1(sx) + " " + f1(sy) + "L" + f1(dot[0]) + " " + f1(dot[1]));
  L.dot.setAttribute("cx", f1(dot[0])); L.dot.setAttribute("cy", f1(dot[1]));
  L.text.setAttribute("x", f1(tpos[0])); L.text.setAttribute("y", f1(tpos[1])); L.text.setAttribute("text-anchor", anchor);
}

let target = 0, pd = 0, touring = !still.matches, userPaused = still.matches, lastTouch = -1e9, holdT = 0;
let sim = 0, last = 0, frame = 0, visible = false, lastStage = -1, hover = null, S = model(0), holding = 0;
const TOUR = 36;

function draw(p) {
  S = model(p);
  const k = Math.round(p * GEO.K), base = k * N;
  let i0 = -1, i1 = -1;
  for (let j = 0; j < N; j++) if (env[base + j] > 0.3) { if (i0 < 0) i0 = j; i1 = j; }
  let weldD = "", bnd = "", xl = 0, xr = 0;
  if (i0 >= 0) {
    const dip = (x) => { const t = (x - (GEO.XE + 5)) / 38; return S.crater * 6 * (Math.abs(t) < 1 ? 1 - t * t : 0); };
    xl = xAt(i0); xr = xAt(i1);
    let top = "M" + f1(xl) + " " + (SURF + dip(xl)).toFixed(1);
    let bot = "";
    bnd = "M" + f1(xl) + " " + SURF;
    for (let j = i0; j <= i1; j++) { const x = xAt(j); if ((j - i0) % 2 === 0 || j === i1) top += "L" + f1(x) + " " + (SURF + dip(x)).toFixed(1); bnd += "L" + f1(x) + " " + (SURF + env[base + j]).toFixed(1); }
    for (let j = i1; j >= i0; j--) bot += "L" + f1(xAt(j)) + " " + (SURF + env[base + j]).toFixed(1);
    weldD = top + bot + "Z";
    bnd += "L" + f1(xr) + " " + SURF;
  }
  E.weld.setAttribute("d", weldD); E.clip.setAttribute("d", weldD); E.fusion.setAttribute("d", bnd);
  E.haz.setAttribute("d", bnd); E.haz.style.strokeWidth = (2 * S.hz).toFixed(1); E.haz.style.opacity = S.hz > 0.5 ? 1 : 0;
  let poolD = "";
  if (S.Lf + S.Lr > 1) {
    poolD = "M" + f1(S.tx - S.Lr) + " " + SURF + "L" + f1(S.tx + S.Lf) + " " + SURF;
    const n = 30;
    for (let a = 0; a <= n; a++) { const xi = S.Lf - (S.Lf + S.Lr) * a / n; poolD += "L" + f1(S.tx + xi) + " " + (SURF + poolDepth(xi, S)).toFixed(1); }
    poolD += "Z";
  }
  E.pool.setAttribute("d", poolD);
  E.glow.setAttribute("cx", f1(S.tx)); E.glow.style.opacity = (S.I * (0.45 + 0.55 * S.s)).toFixed(2);
  const T = "translate(" + f1(S.tx) + " 0)";
  E.torch.setAttribute("transform", T); E.arcg.setAttribute("transform", T);
  const fl = 0.93 + 0.07 * Math.sin(sim * 41) * (still.matches ? 0 : 1);
  const arcOp = S.I * fl;
  E.arc.style.opacity = arcOp.toFixed(2); E.core.style.opacity = arcOp.toFixed(2); E.anode.style.opacity = arcOp.toFixed(2);
  const wsc = 0.55 + 0.45 * S.I;
  E.arc.setAttribute("transform", "scale(" + wsc.toFixed(2) + " 1)"); E.arc.style.transformOrigin = "0 0";
  E.tip.style.opacity = Math.max(S.I, S.spark * 0.7).toFixed(2);
  if (S.spark) {
    const seed = Math.floor(sim * 16);
    const r = (n) => frac(Math.sin(n * 127.1 + seed * 311.7) * 43758.5453) - 0.5;
    let d = "M0 " + GEO.TIPY;
    for (let i = 1; i < 6; i++) d += "L" + f1(r(i) * 22) + " " + f1(GEO.TIPY + (SURF - GEO.TIPY) * i / 6);
    d += "L" + f1(r(9) * 8) + " " + SURF;
    E.spark.setAttribute("d", d); E.spark.style.opacity = (0.55 + 0.45 * frac(Math.sin(seed * 12.9898) * 43758.5)).toFixed(2);
  } else E.spark.style.opacity = 0;
  gasP.forEach((c, i) => {
    const side = i % 2 ? 1 : -1, x0 = 6 + ((i * 5) % 12);
    const u = frac(sim / 2.4 + i * 0.137);
    let x, y;
    if (u < 0.4) { x = side * x0 * (1 + 0.35 * (u / 0.4)); y = 270 + (SURF - 7 - 270) * (u / 0.4); }
    else { const w = (u - 0.4) / 0.6; x = side * (x0 * 1.35 + 150 * w); y = SURF - 7 - 7 * Math.sin(w * Math.PI) * 0.7 - 2 * w; }
    c.setAttribute("cx", f1(S.tx + x)); c.setAttribute("cy", f1(y));
    c.style.opacity = (S.g * 0.85 * (u < 0.06 ? u / 0.06 : u > 0.75 ? (1 - u) / 0.25 : 1)).toFixed(2);
  });
  const ne = Math.round(S.I * NE);
  elecs.forEach((c, i) => {
    if (i >= ne) { c.style.opacity = 0; return; }
    const u = frac(sim / 0.42 + i / NE), hw = 2 + 15 * u;
    c.setAttribute("cx", f1(Math.sin(i * 2.3 + sim * 3) * hw * 0.8)); c.setAttribute("cy", f1(GEO.TIPY + (SURF - GEO.TIPY) * u));
    c.style.opacity = (S.I * (u < 0.1 ? u / 0.1 : 1)).toFixed(2);
  });
  const ni = Math.round(S.I * NI);
  ions.forEach((c, i) => {
    if (i >= ni) { c.style.opacity = 0; return; }
    const u = 1 - frac(sim / 0.9 + i / NI), hw = 2 + 13 * u;
    c.setAttribute("cx", f1(Math.sin(i * 3.9 + sim * 2) * hw * 0.8)); c.setAttribute("cy", f1(GEO.TIPY + (SURF - GEO.TIPY) * u));
    c.style.opacity = (S.I * 0.9 * (u > 0.9 ? (1 - u) / 0.1 : 1)).toFixed(2);
  });
  const hlen = (S.Lf + S.Lr) / 2, cc = (S.Lf - S.Lr) / 2, dmax = GEO.D * S.s;
  flowP.forEach((c, i) => {
    if (S.s < 0.2 || S.I < 0.05) { c.style.opacity = 0; return; }
    const right = i < 4, j = i % 4;
    const th = (right ? 1 : -1) * ((sim / (2.8 - 1.2 * S.I) + j / 4) * Math.PI * 2);
    const cx = S.tx + cc + (right ? 1 : -1) * 0.42 * hlen, cy = SURF + 0.46 * dmax;
    c.setAttribute("cx", f1(cx + Math.cos(th) * 0.36 * hlen)); c.setAttribute("cy", f1(cy + Math.sin(th) * 0.34 * dmax));
    c.style.opacity = Math.min(1, (S.s - 0.2) * 3).toFixed(2);
  });
  // labels
  const tx = S.tx;
  label("elec", [tx + 2, 190], [tx + 60, 110], "start", 1);
  label("cup", [tx - 24, 296], [tx - 56, 262], "end", 1);
  label("gas", [tx + 44, SURF - 9], [tx + 66, 322], "start", S.g);
  label("arc", [tx - 8, 350], [tx - 60, 338], "end", clamp(S.I * 2));
  const hzA = clamp((S.hz - 6) / 8);
  const xrear = tx - S.Lr, span = xrear - xl;
  const wA = i0 >= 0 ? clamp((span - 80) / 40) : 0;
  let wdot = [0, 0];
  if (wA > 0) { const xm = (xl + xrear) / 2; const jm = Math.round((xm - GEO.X0) / GEO.STEP); wdot = [xm, SURF + 0.45 * env[base + jm]]; }
  const items = [
    { id: "base", w: 70, dot: [70, 412], a: 1 },
    { id: "haz", w: 126, dot: [xl - Math.max(4, S.hz * 0.5), SURF + 6], a: i0 >= 0 ? hzA : 0 },
    { id: "weld", w: 147, dot: wdot, a: wA },
    { id: "pool", w: 126, dot: [tx + cc, SURF + 0.35 * dmax], a: clamp(S.s * 4) * (S.s > 0.1 ? 1 : 0) },
  ];
  let edge = 20;
  for (const it of items) {
    if (it.a < 0.02) { label(it.id, it.dot, [0, 0], "middle", 0); continue; }
    const half = it.w / 2, c = Math.min(Math.max(it.dot[0], edge + half), 930 - half);
    edge = c + half + 18;
    label(it.id, it.dot, [c, 474], "middle", it.a);
  }
  // timeline
  const hx = TL.x0 + p * (TL.x1 - TL.x0);
  E.head.setAttribute("d", "M" + f1(hx) + " 516V612"); E.knob.setAttribute("cx", f1(hx));
  svg.querySelectorAll(".tg-band, .tg-bandtxt").forEach((el) => el.classList.toggle("is-on", +el.dataset.i === S.stage));
  if (readout.textContent !== S.readout) readout.textContent = S.readout;
  if (S.stage !== lastStage) {
    lastStage = S.stage;
    if (hover === null) info.textContent = STAGES[S.stage].text;
    statusEl.textContent = "Stage " + (S.stage + 1) + " of 6: " + STAGES[S.stage].name + ".";
    stageBtns.forEach((b) => { if (+b.dataset.i === S.stage) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); });
  }
  range.value = Math.round(p * 1000);
}

function touch(now) { lastTouch = now === undefined ? performance.now() : now; if (touring) { touring = false; syncPlay(); } }
function syncPlay() { const on = touring || (!userPaused && !still.matches); playBtn.textContent = touring ? "Pause tour" : "Play tour"; playBtn.setAttribute("aria-pressed", String(!touring)); }
function setTarget(p) { lastTouch = performance.now(); target = clamp(p); if (still.matches) pd = target; range.setAttribute("aria-valuetext", model(target).readout); run(); }

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

// drag: on the timeline strip (absolute) or anywhere on the stage (relative)
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
playBtn.addEventListener("click", () => { if (touring) { touring = false; userPaused = true; } else { userPaused = false; touring = true; holdT = 0; if (target >= 1) { target = 0; pd = 0; } } syncPlay(); run(); });
document.addEventListener("keydown", (e) => {
  if (e.code !== "Space" || e.target.closest("button, a, input, textarea, select")) return;
  e.preventDefault(); playBtn.click();
});
still.addEventListener("change", () => { touring = !still.matches; userPaused = still.matches; syncPlay(); if (still.matches) pd = target; run(); });
svg.querySelectorAll(".hot").forEach((el) => {
  const on = () => { hover = el.dataset.info; info.textContent = hover; el.classList.add("is-hot"); };
  const off = () => { hover = null; info.textContent = STAGES[lastStage].text; el.classList.remove("is-hot"); };
  el.addEventListener("pointerenter", on); el.addEventListener("pointerleave", off);
  el.addEventListener("focus", on); el.addEventListener("blur", off);
});
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); else if (frame) { cancelAnimationFrame(frame); frame = 0; } }, { rootMargin: "120px 0px" }).observe(svg);
syncPlay();
draw(0);
run();
`;

const style = `
.tg-svg{padding:0}
.tg-fig{display:block;width:100%;height:auto;touch-action:pan-y;user-select:none;-webkit-user-select:none}
.tg-plate{fill:var(--anatomy-shade-2);stroke:var(--anatomy-mid);stroke-width:.8;vector-effect:non-scaling-stroke}
.tg-haz{fill:none;stroke:var(--anatomy-lo);stroke-linejoin:round;stroke-linecap:round;opacity:0;pointer-events:stroke}
.tg-glow{pointer-events:none;opacity:0}
.tg-weld{fill:var(--anatomy-shade-0);stroke:none}
.tg-grains{pointer-events:none}
.tg-grains path{fill:none;stroke:var(--anatomy-mid);stroke-width:.7;stroke-linecap:round;vector-effect:non-scaling-stroke}
.tg-fusion{fill:none;stroke:var(--anatomy-hi);stroke-width:.9;vector-effect:non-scaling-stroke;pointer-events:none}
.tg-pool{fill:var(--anatomy-lit);opacity:.92;stroke:none}
.tg-flowdot{fill:var(--anatomy-paper);pointer-events:none;opacity:0}
.tg-gasdot{fill:var(--anatomy-blue);pointer-events:none;opacity:0}
.tg-arc{pointer-events:all}
.tg-core{fill:none;stroke:var(--anatomy-lit);stroke-width:1.6;stroke-linecap:round}
.tg-anode{fill:var(--anatomy-lit);opacity:0}
.tg-tipglow{fill:var(--anatomy-lit);opacity:0;pointer-events:none}
.tg-spark{fill:none;stroke:var(--anatomy-lit);stroke-width:1.3;stroke-linejoin:round;opacity:0;pointer-events:none}
.tg-e{fill:var(--anatomy-lit);stroke:var(--anatomy-paper);stroke-width:.7;pointer-events:none;opacity:0}
.tg-ion{fill:none;stroke:var(--anatomy-blue);stroke-width:1.4;pointer-events:none;opacity:0}
.tg-key .tg-e,.tg-key .tg-ion,.tg-key .tg-gasdot{opacity:1}
.tg-body{fill:var(--anatomy-shade-1);stroke:var(--anatomy-hi);stroke-width:.9;vector-effect:non-scaling-stroke}
.tg-collet{fill:var(--anatomy-shade-3);stroke:var(--anatomy-mid);stroke-width:.8;vector-effect:non-scaling-stroke}
.tg-stub{fill:var(--anatomy-shade-3);stroke:var(--anatomy-mid);stroke-width:.8;vector-effect:non-scaling-stroke}
.tg-cup{fill:var(--anatomy-shade-3);stroke:var(--anatomy-hi);stroke-width:.9;vector-effect:non-scaling-stroke;stroke-linejoin:round}
.tg-elec{fill:var(--anatomy-hi);stroke:none}
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
.tg-area{fill:var(--anatomy-mid);opacity:.7;stroke:none}
.tg-head{fill:none;stroke:var(--anatomy-lit);stroke-width:1.3}
.tg-knob{fill:var(--anatomy-paper);stroke:var(--anatomy-lit);stroke-width:1.6;vector-effect:non-scaling-stroke;pointer-events:none}
.tg-key{pointer-events:none}
.hot{cursor:help;outline:none}
.hot.is-hot{filter:drop-shadow(0 0 3px var(--anatomy-lit))}
.hot:focus-visible{outline:2px solid var(--anatomy-lit);outline-offset:3px}
.tg-controls{display:flex;flex-wrap:wrap;gap:14px 28px;align-items:center;margin:14px 2px 6px;font:12.5px var(--anatomy-mono);color:var(--anatomy-text)}
.tg-controls button,.tg-stages button{border:1px solid var(--anatomy-faint);background:transparent;color:var(--anatomy-text);font:12px var(--anatomy-mono);padding:6px 10px;cursor:pointer}
.tg-stages button[aria-current=step]{border-color:var(--anatomy-lit);color:var(--anatomy-strong)}
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

const html = pageHtml({
  title: "GTAW (TIG) welding: arc to solidified weld",
  theme: light ? "light" : "dark",
  width: WIDTH + 40,
  body: `<style>${BIO_CSS}${style}</style>${framed}${controls}${sources}`,
  script,
});
const filename = light ? "gtaw-lifecycle-light.html" : "gtaw-lifecycle.html";
writeFileSync(join(HERE, filename), html);
console.log(`wrote ${filename}`);
