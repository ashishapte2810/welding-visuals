// Resistance spot welding lifecycle: reference implementation on the shared kit.
//   node build.mjs      writes dist/spot-weld-white.html and dist/spot-weld-auto.html
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { BIO_CSS } from "../../kit/vendor/anima/blob.mjs";
import { figureSvg, pageHtml, pathOf, plateHtml } from "../../kit/vendor/anima/iso-kit.mjs";
import { ENGINE_CSS, controlsHtml, engineMain, enginePrelude, timelineSvg } from "../../kit/lifecycle-engine.mjs";
import { footerHtml, hoverAttr, lintRegistry, loadRegistry, stageHot, stageText } from "../../kit/claims.mjs";
import { hosted } from "../../kit/package.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "../..");
const WIDTH = 960, HEIGHT = 640;

// stack-up: two sheets, faying interface at Y0; electrodes on the axis x = CX
const GEO = { CX: 480, Y0: 322, T: 30, X0: 110, X1: 850, TIPW: 26, HMAX: 14, OPEN: 62 };
const TL = { x0: 130, x1: 900 };
const ST = [0, 0.22, 0.58, 0.8, 1];
const NAMES = ["squeeze", "weld", "hold", "off · release"];
const STAGE_NAMES = ["Squeeze", "Weld", "Hold", "Off and release"];
const MODES = ["normal heat", "too much heat"];

// The model is the single source of truth for motion and readout. Keep it pure and self-contained (it is stringified into the page).
function model(p, mode) {
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const sm = (v) => { v = clamp(v); return v * v * (3 - 2 * v); };
  p = clamp(p);
  const hot = mode === 1;
  const open = GEO.OPEN * (1 - sm((p - 0.02) / 0.1)) + GEO.OPEN * sm((p - 0.82) / 0.12);
  const F = sm((p - 0.1) / 0.12) * (1 - sm((p - 0.8) / 0.05));
  const I = sm((p - 0.22) / 0.03) * (1 - sm((p - 0.555) / 0.025));
  const A = hot ? 40 : 30;
  const B = hot ? 21 : 15;
  let n = hot ? sm((p - 0.27) / 0.25) : sm((p - 0.27) / 0.31);
  if (hot) n *= 1 - 0.14 * sm((p - 0.52) / 0.06);
  const liq = p < 0.58 ? 1 : 1 - sm((p - 0.58) / 0.16);
  const hz = GEO.HMAX * (hot ? 1.2 : 1) * sm((p - 0.3) / 0.5);
  const indent = (hot ? 6.5 : 3.5) * sm((p - 0.26) / 0.34);
  const expel = hot ? Math.max(0, Math.sin((Math.PI * (p - 0.5)) / 0.08)) * (p >= 0.5 && p < 0.58 ? 1 : 0) : 0;
  const release = sm((p - 0.82) / 0.12);
  const stage = p < 0.22 ? 0 : p < 0.58 ? 1 : p < 0.8 ? 2 : 3;
  let readout;
  if (p < 0.1) readout = "squeeze · electrodes closing";
  else if (p < 0.22) readout = "squeeze · force building, no current";
  else if (p < 0.3) readout = "weld · current on, interface heating";
  else if (p < 0.58) readout = hot && p >= 0.5 ? "weld · molten metal expelled" : "weld · nugget growing";
  else if (p < 0.74) readout = "hold · nugget freezing under force";
  else if (p < 0.8) readout = "hold · fully solid, force held";
  else if (p < 0.94) readout = "off · electrodes opening";
  else readout = "complete · indentation remains";
  return { open, F, I, A, B, n, liq, hz, indent, expel, release, stage, readout, a: A * n, b: B * n };
}

// ---- build-time checks: a failing check stops the build ----
for (const mode of [0, 1]) {
  const near = (a, b, t = 1e-6) => Math.abs(a - b) <= t;
  const m0 = model(0, mode), m1 = model(1, mode);
  if (m0.F !== 0 || m0.I !== 0 || m0.n !== 0) throw new Error("p=0 must be idle");
  if (!(m0.open > 60)) throw new Error("electrodes start open");
  if (!near(model(0.12, mode).open, 0, 1)) throw new Error("electrodes must be closed by p=0.12");
  if (model(0.2, mode).I !== 0) throw new Error("no current during squeeze");
  if (!(model(0.2, mode).F > 0.9)) throw new Error("force must be established before current");
  if (!(model(0.4, mode).I > 0.99)) throw new Error("current on in weld stage");
  if (model(0.6, mode).I !== 0) throw new Error("current off by hold");
  if (!(model(0.7, mode).F > 0.99)) throw new Error("force held during hold");
  if (!(model(0.58, mode).liq === 1 && model(0.8, mode).liq === 0)) throw new Error("nugget freezes during hold");
  if (!(m1.F === 0 && m1.open > 60)) throw new Error("electrodes open at the end");
  if (!(model(0.5, mode).n > model(0.35, mode).n)) throw new Error("nugget grows during weld");
  if (mode === 0 && model(0.52, 0).expel !== 0) throw new Error("no expulsion at normal heat");
  if (mode === 0) for (let a = 0.22; a < 0.58; a += 0.005) if (model(a + 0.005, 0).n + 0.02 < model(a, 0).n) throw new Error("nugget must not shrink while current flows");
  // proportion rule (references/proportions.md): nugget about as wide as the electrode face at normal heat
  if (mode === 0 && !(model(0.58, 0).a / GEO.TIPW > 0.9 && model(0.58, 0).a / GEO.TIPW < 1.4)) throw new Error("nugget/electrode-face proportion out of range");
}
if (!(model(0.5, 1).a > model(0.5, 0).a && model(0.54, 1).expel > 0.9)) throw new Error("hot case must be bigger and expel near p=0.54");
if (!(model(0.7, 1).a < model(0.7, 1).A * 0.9)) throw new Error("hot case loses material after expulsion");

// Proportion warning (references/proportions.md): AWS Handbook examples put nuggets at about 3 to 5 times a single sheet's thickness
// (7th ed. vol. 1 worked example: 5 mm nugget in 1.0 mm sheets; 8th ed. vol. 3 Table 1.47: roughly 2.2 to 4.4 times for aluminium).
{ const ratio = (2 * model(0.58, 0).a) / GEO.T; if (ratio < 2.2) console.warn(`PROPORTION WARNING: drawn nugget diameter is ${ratio.toFixed(1)} x single-sheet thickness; handbook examples are about 2.2 to 5. See references/proportions.md.`); }

// ---- text comes from the claim registry ----
const HOVER = ["elec", "water", "force", "sheet", "fay", "nugget", "haz", "indent", "current", "expel", "tl"];
const reg = lintRegistry(loadRegistry(join(ROOT, "claims/rsw.json"), join(ROOT, "claims/sources.json")), [...HOVER.map((k) => "hover:" + k), ...STAGE_NAMES.map((_, i) => "stage:" + i)]);
const STAGES = STAGE_NAMES.map((name, i) => ({ name, text: stageText(reg, i) }));
const STAGES_HOT = stageHot(reg);
const H = (k) => hoverAttr(reg, k);

const f1 = (v) => +v.toFixed(1);
const { CX, Y0, T } = GEO;
const mkLabel = (id, text) => `<g id="lb-${id}" class="tg-lb"><path class="tg-leader"/><circle class="tg-dot" r="1.7"/><text class="tg-label">${text}</text></g>`;
const hx = (cx, cy, r) => pathOf(Array.from({ length: 6 }, (_, k) => [cx + Math.cos((k * Math.PI) / 3) * r, cy + Math.sin((k * Math.PI) / 3) * r]), true);
const upper = `<g id="up" class="tg-elecg"><path class="tg-el" d="M-${GEO.TIPW} 0H${GEO.TIPW}L${GEO.TIPW + 12} -36H${GEO.TIPW + 12}V-150H-${GEO.TIPW + 12}V-36H-${GEO.TIPW + 12}Z"/><path class="tg-water" d="M-10 -4V-120H10V-4"/></g>`;
const lower = `<g id="lo" class="tg-elecg"><path class="tg-el" d="M-${GEO.TIPW} 0H${GEO.TIPW}L${GEO.TIPW + 12} 36H${GEO.TIPW + 12}V95H-${GEO.TIPW + 12}V36H-${GEO.TIPW + 12}Z"/><path class="tg-water" d="M-10 4V70H10V4"/></g>`;

const body = [
  `<defs>
<clipPath id="sheet-clip"><rect x="${GEO.X0}" y="${Y0 - T - 12}" width="${GEO.X1 - GEO.X0}" height="${2 * T + 24}"/></clipPath>
<clipPath id="ring-clip"><path id="ring-clip-path" d="" clip-rule="evenodd"/></clipPath>
<radialGradient id="glow-grad"><stop offset="0" stop-color="#fff0a0" stop-opacity=".95"/><stop offset=".45" stop-color="#ffd21f" stop-opacity=".6"/><stop offset="1" stop-color="#ffb300" stop-opacity="0"/></radialGradient>
<linearGradient id="steel-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dde2e7"/><stop offset=".5" stop-color="#bac2ca"/><stop offset="1" stop-color="#a3acb6"/></linearGradient>
<linearGradient id="cu-grad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6e3419"/><stop offset=".3" stop-color="#b4623f"/><stop offset=".6" stop-color="#a0522d"/><stop offset="1" stop-color="#66301a"/></linearGradient>
</defs>`,
  `<g id="sheets" class="hot" tabindex="0" data-info="${H("sheet")}"><path id="sheet1" class="tg-sheet" d=""/><path id="sheet2" class="tg-sheet" d=""/></g>`,
  `<g clip-path="url(#sheet-clip)"><g class="hot" tabindex="0" data-info="${H("haz")}"><ellipse id="haz" class="tg-haz" cx="${CX}" cy="${Y0}" rx="0" ry="0"/></g></g>`,
  `<ellipse id="glow" class="tg-glow" cx="${CX}" cy="${Y0}" rx="76" ry="42" fill="url(#glow-grad)"/>`,
  `<g class="hot" tabindex="0" data-info="${H("fay")}"><path id="fay" class="tg-fay" d="M${GEO.X0} ${Y0}H${GEO.X1}"/><rect class="tg-hit" x="${GEO.X0}" y="${Y0 - 6}" width="${GEO.X1 - GEO.X0}" height="12"/></g>`,
  `<g class="hot" tabindex="0" data-info="${H("nugget")}"><ellipse id="nug-out" class="tg-nug" cx="${CX}" cy="${Y0}" rx="0" ry="0"/></g>`,
  `<g clip-path="url(#ring-clip)" class="tg-grains"><path id="grains" d=""/></g>`,
  `<ellipse id="nug-liq" class="tg-liq" cx="${CX}" cy="${Y0}" rx="0" ry="0"/>`,
  `<g id="currents"></g>`,
  `<g class="hot" tabindex="0" data-info="${H("elec")}">${upper}${lower}</g>`,
  `<g class="hot" tabindex="0" data-info="${H("water")}"><g id="wflow"></g></g>`,
  `<g class="hot" tabindex="0" data-info="${H("force")}"><path id="f-up" class="tg-farrow" d=""/><path id="f-lo" class="tg-farrow" d=""/></g>`,
  `<g class="hot tg-expel" tabindex="0" data-info="${H("expel")}"><g id="spat"></g></g>`,
  mkLabel("elec", "water-cooled copper electrode"), mkLabel("water", "cooling water"), mkLabel("force", "electrode force"), mkLabel("sheet", "sheets (stack-up)"),
  mkLabel("fay", "faying interface"), mkLabel("nug", "weld nugget"), mkLabel("haz", "heat-affected zone"), mkLabel("ind", "indentation"),
  timelineSvg({ TL, ST, names: NAMES, info: reg.claims.find((c) => c.ui === "hover:tl").text, rows: [
    { label: "force", y: 560, amp: 34, kind: "curve", fn: (p) => model(p, 0).F },
    { label: "current", y: 606, amp: 34, kind: "curve", cls: "tg-wave2", fn: (p) => model(p, 0).I }] }),
  `<g class="tg-key"><circle class="tg-e" cx="716" cy="30" r="3.2"/><text class="tg-label" x="726" y="34">current</text><circle class="tg-wdot" cx="806" cy="30" r="3"/><text class="tg-label" x="816" y="34">cooling water</text></g>`,
].join("");

const svg = figureSvg({
  width: WIDTH, height: HEIGHT,
  label: "Schematic cross-section of resistance spot welding of two sheets between water-cooled copper electrodes, with a timeline. The electrodes close and build force (squeeze), current flows and a molten nugget grows from the faying interface (weld), current stops and the nugget solidifies under force (hold), and the electrodes open (off), leaving the nugget, a heat-affected zone and an electrode indentation.",
  body, className: "tg-fig",
});
const framed = plateHtml({
  fig: "Fig 3", title: "Resistance spot welding: squeeze, weld, hold, off",
  hint: "drag left to right \u00b7 hover a part \u00b7 space: pause", readout: model(0, 0).readout,
  caption: "Schematic, not to scale; the time axis is stretched and uneven. Cross-section through the axis of a two-sheet stack-up between water-cooled electrodes. Qualitative levels, no process values are claimed.",
  body: `<div class="tg-svg">${svg}</div>`,
});
const controls = controlsHtml({ names: NAMES, ST, modes: MODES, modeTitle: "Heat input", readout0: model(0, 0).readout, text0: STAGES[0].text });

const figureScript = `
const GEO = ${JSON.stringify(GEO)};
const TL = ${JSON.stringify(TL)};
const STAGES = ${JSON.stringify(STAGES)};
const STAGES_HOT = ${JSON.stringify(STAGES_HOT)};
const MODES = ${JSON.stringify(MODES)};
const model = ${model.toString()};
${enginePrelude()}
const { CX, Y0, T } = GEO;
const E = { up: $("up"), lo: $("lo"), sh1: $("sheet1"), sh2: $("sheet2"), haz: $("haz"), glow: $("glow"), nug: $("nug-out"), liq: $("nug-liq"), ring: $("ring-clip-path"), grains: $("grains"), fup: $("f-up"), flo: $("f-lo") };
const NC = 12, NW = 10, NSP = 10;
const curs = Array.from({ length: NC }, () => mk("circle", { class: "tg-e", r: 2.3 }, $("currents")));
const wat = Array.from({ length: NW * 2 }, () => mk("circle", { class: "tg-wdot", r: 2.1 }, $("wflow")));
const spat = Array.from({ length: NSP }, () => mk("circle", { class: "tg-spat", r: 2.4 }, $("spat")));
const label = makeLabels(["elec", "water", "force", "sheet", "fay", "nug", "haz", "ind"]);
const stageExtra = (S, mode) => (mode === 1 && (S.stage === 1 || S.stage === 2) ? " " + STAGES_HOT : "");
const statusExtra = (mode) => (mode === 1 ? " Heat input: too much, expulsion case." : "");

// grain lines: short radial strokes just inside the nugget boundary, pointing at the centre
function grainPath(a, b) {
  let d = "";
  for (let i = 0; i < 64; i++) {
    const th = (i / 64) * Math.PI * 2, c = Math.cos(th), s = Math.sin(th), r1 = 0.52 + 0.1 * Math.sin(i * 1.9);
    d += "M" + f1(CX + a * c) + " " + f1(Y0 + b * s) + "L" + f1(CX + a * c * r1) + " " + f1(Y0 + b * s * r1);
  }
  return d;
}
function drawScene(S, p, sim, mode) {
  const dep = S.indent, topY = Y0 - T, botY = Y0 + T, w = GEO.TIPW + 8;
  const dimple = (y, sgn) => { let d = ""; const n = 24; for (let i = 0; i <= n; i++) { const x = CX - w - 14 + ((2 * (w + 14)) * i) / n; const t = Math.abs(x - CX) / (w + 14); const k = t < 1 ? 0.5 * (1 + Math.cos(Math.PI * Math.pow(t, 1.4))) : 0; d += "L" + f1(x) + " " + f1(y + sgn * dep * k); } return d; };
  E.sh1.setAttribute("d", "M" + GEO.X0 + " " + Y0 + "V" + topY + "H" + (CX - w - 14) + dimple(topY, 1) + "H" + GEO.X1 + "V" + Y0 + "Z");
  E.sh2.setAttribute("d", "M" + GEO.X0 + " " + Y0 + "V" + botY + "H" + (CX - w - 14) + dimple(botY, -1) + "H" + GEO.X1 + "V" + Y0 + "Z");
  const upY = topY + dep - S.open, loY = botY - dep + 30 * S.release;
  E.up.setAttribute("transform", "translate(" + CX + " " + f1(upY) + ")");
  E.lo.setAttribute("transform", "translate(" + CX + " " + f1(loY) + ")");
  const a = S.a, b = S.b;
  E.nug.setAttribute("rx", f1(a)); E.nug.setAttribute("ry", f1(b)); E.nug.style.opacity = a > 0.5 ? 1 : 0;
  E.liq.setAttribute("rx", f1(a * S.liq)); E.liq.setAttribute("ry", f1(b * S.liq)); E.liq.style.opacity = a * S.liq > 0.5 ? 1 : 0;
  const ringD = "M" + f1(CX - a) + " " + Y0 + "a" + f1(a) + " " + f1(b) + " 0 1 0 " + f1(2 * a) + " 0a" + f1(a) + " " + f1(b) + " 0 1 0 " + f1(-2 * a) + " 0Z" +
    "M" + f1(CX - a * S.liq) + " " + Y0 + "a" + f1(a * S.liq + 0.01) + " " + f1(b * S.liq + 0.01) + " 0 1 0 " + f1(2 * a * S.liq) + " 0a" + f1(a * S.liq + 0.01) + " " + f1(b * S.liq + 0.01) + " 0 1 0 " + f1(-2 * a * S.liq) + " 0Z";
  E.ring.setAttribute("d", a > 1 ? ringD : ""); E.ring.setAttribute("clip-rule", "evenodd"); E.ring.style.clipRule = "evenodd";
  E.grains.setAttribute("d", a > 1 ? grainPath(a, b) : "");
  E.haz.setAttribute("rx", f1(a + S.hz)); E.haz.setAttribute("ry", f1(b + S.hz)); E.haz.style.opacity = S.hz > 0.5 ? 1 : 0;
  E.glow.style.opacity = (S.I * (0.35 + 0.65 * Math.min(1, S.n * 1.5 + 0.2))).toFixed(2);
  const fl = 10 + 36 * S.F, fy = upY - 150;
  E.fup.setAttribute("d", S.F > 0.02 ? "M" + CX + " " + f1(fy - fl) + "V" + f1(fy - 3) + "m-6 -9l6 9l6 -9" : "");
  const gy = loY + 95;
  E.flo.setAttribute("d", S.F > 0.02 ? "M" + CX + " " + f1(gy + fl) + "V" + f1(gy + 3) + "m-6 9l6 -9l6 9" : "");
  curs.forEach((c, i) => {
    if (!(S.I > 0.05 && i < Math.round(S.I * NC))) { c.style.opacity = 0; return; }
    const u = frac(sim / 0.9 + i / NC), lane = ((i * 5) % 7 - 3) * 5, y0 = upY - 36, y1 = loY + 36;
    c.setAttribute("cx", f1(CX + lane)); c.setAttribute("cy", f1(y0 + (y1 - y0) * u));
    c.style.opacity = (S.I * (u < 0.06 ? u / 0.06 : u > 0.94 ? (1 - u) / 0.06 : 1)).toFixed(2);
  });
  wat.forEach((c, i) => {
    const up = i < NW, u = frac(sim / 2.2 + (i % NW) / NW), q = u * 2;
    let x, y;
    if (up) { if (q < 1) { x = -7; y = -4 - 116 * q; } else { x = 7; y = -120 + 116 * (q - 1); } y += upY; }
    else { if (q < 1) { x = -7; y = 4 + 66 * q; } else { x = 7; y = 70 - 66 * (q - 1); } y += loY; }
    c.setAttribute("cx", f1(CX + x)); c.setAttribute("cy", f1(y)); c.style.opacity = 0.9;
  });
  spat.forEach((c, i) => {
    if (S.expel < 0.02) { c.style.opacity = 0; return; }
    const side = i % 2 ? 1 : -1, u = frac(sim / 0.7 + i * 0.173);
    c.setAttribute("cx", f1(CX + side * (S.a + 6 + 52 * u))); c.setAttribute("cy", f1(Y0 - 2 + 26 * u * u - 14 * Math.sin(u * 3)));
    c.style.opacity = (S.expel * (1 - u * 0.7)).toFixed(2);
  });
  const clampA = (v) => clamp(v);
  label("elec", [CX - GEO.TIPW - 12, upY - 100], [CX - 150, upY - 100], "end", 1);
  label("water", [CX + 7, upY - 80], [CX + 70, upY - 96], "start", 1);
  label("force", [CX + 2, fy - fl + 2], [CX + 70, fy - fl - 4], "start", S.F > 0.05 ? 1 : 0);
  label("sheet", [GEO.X0 + 70, Y0 - T / 2], [GEO.X0 + 10, Y0 - 88], "start", 1);
  label("fay", [GEO.X1 - 70, Y0], [GEO.X1 - 20, Y0 - 88], "end", 1);
  label("nug", [CX + a * 0.55, Y0 + b * 0.3], [CX + 190, Y0 + 98], "middle", clampA(a / 8));
  label("haz", [CX - a - S.hz * 0.5, Y0 + 2], [CX - 190, Y0 + 98], "middle", clampA((S.hz - 3) / 3));
  label("ind", [CX + GEO.TIPW + 2, Y0 + T - dep * 0.1], [CX + 120, Y0 + 138], "middle", clampA(dep / 2));
}
${engineMain({ tourSeconds: 30 })}`;

const figureCss = `
.tg-sheet{fill:url(#steel-grad);stroke:#66707b;stroke-width:.8;vector-effect:non-scaling-stroke;stroke-linejoin:round}
.tg-haz{fill:rgba(84,94,104,.5);stroke:none;opacity:0}
.tg-glow{pointer-events:none;opacity:0}
.tg-fay{fill:none;stroke:#59636d;stroke-width:.9;vector-effect:non-scaling-stroke}
.tg-nug{fill:#7a848e;stroke:#4a535c;stroke-width:.9;vector-effect:non-scaling-stroke;opacity:0}
.tg-liq{fill:#ffd21f;stroke:#e08a00;stroke-width:1;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}
.tg-grains{pointer-events:none}
.tg-grains path{fill:none;stroke:#2f373f;stroke-width:.8;stroke-linecap:round;vector-effect:non-scaling-stroke}
.tg-el{fill:url(#cu-grad);stroke:#552a15;stroke-width:.9;vector-effect:non-scaling-stroke;stroke-linejoin:round}
.tg-water{fill:#d3e8f4;fill-opacity:.92;stroke:var(--anatomy-blue);stroke-width:1.1;stroke-linejoin:round}
.tg-wdot{fill:var(--anatomy-blue);pointer-events:none}
.tg-e{fill:var(--anatomy-lit);stroke:var(--anatomy-paper);stroke-width:.7;pointer-events:none;opacity:0}
.tg-key .tg-e,.tg-key .tg-wdot{opacity:1}
.tg-spat{fill:#ffa800;stroke:#e07b00;stroke-width:.6;opacity:0}
.tg-farrow{fill:none;stroke:var(--anatomy-hi);stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
`;

function render(theme) {
  return pageHtml({
    title: "Resistance spot welding: squeeze, weld, hold, off", theme, width: WIDTH + 40,
    body: `<style>${BIO_CSS}${ENGINE_CSS}${figureCss}</style>${framed}${controls}${footerHtml(reg)}`,
    script: figureScript,
  });
}
const dark = render("dark"), light = render("light");
mkdirSync(join(HERE, "dist"), { recursive: true });
writeFileSync(join(HERE, "dist/spot-weld-white.html"), hosted(dark, light, { mode: "white" }));
writeFileSync(join(HERE, "dist/spot-weld-auto.html"), hosted(dark, light, { mode: "auto" }));
console.log("wrote dist/spot-weld-white.html and dist/spot-weld-auto.html (" + reg.claims.length + " claims linted)");
