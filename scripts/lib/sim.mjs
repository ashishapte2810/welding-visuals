// Load a built figure into jsdom with the browser APIs the page needs, and drive it with a fake clock.
// This is a stand-in for a real browser: it catches script errors, NaN geometry and logic bugs, not rendering differences.
import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";

export function loadPage(file, { reduced = false } = {}) {
  const html = readFileSync(file, "utf8");
  const m = html.match(/<script type="module">([\s\S]*?)<\/script>/);
  if (!m) throw new Error("no <script type=module> found in " + file);
  const dom = new JSDOM(html.replace(m[0], ""), { runScripts: "outside-only", pretendToBeVisual: true });
  const w = dom.window, errors = [], queue = [], mqls = [];
  let t = 0, rm = reduced;
  w.addEventListener("error", (e) => errors.push(e.message));
  w.matchMedia = (q) => ({ get matches() { return rm; }, media: q, addEventListener(_, f) { mqls.push(f); }, removeEventListener() {} });
  w.IntersectionObserver = class { constructor(cb) { this.cb = cb; } observe() { this.cb([{ isIntersecting: true }]); } disconnect() {} };
  w.performance.now = () => t * 1000;
  w.requestAnimationFrame = (cb) => { queue.push(cb); return queue.length; };
  w.cancelAnimationFrame = () => {};
  w.SVGElement.prototype.setPointerCapture = () => {}; w.SVGElement.prototype.releasePointerCapture = () => {};
  // expose the model to tests (the page declares it with const)
  try { w.eval(m[1].replace(/^\s*const model\b/m, "var model")); } catch (e) { errors.push("init: " + e.stack); }
  const q = (s) => w.document.querySelector(s);
  const qa = (s) => [...w.document.querySelectorAll(s)];
  const svg = q(".tg-fig");
  if (svg) svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 960, height: 640 });
  const frames = (n) => { for (let i = 0; i < n; i++) { t += 1 / 30; for (const cb of queue.splice(0)) { try { cb(t * 1000); } catch (e) { errors.push("frame: " + e.stack); } } } };
  const ev = (el, type, props = {}) => { const e = new w.Event(type, { bubbles: true, cancelable: true }); Object.assign(e, { button: 0, pointerId: 1 }, props); el.dispatchEvent(e); return e; };
  const setP = (p) => { const r = q("#tl-range"); r.value = String(Math.round(p * 1000)); ev(r, "input"); };
  return { w, q, qa, errors, frames, ev, setP, seconds: () => t, setReduced(v) { rm = v; mqls.forEach((f) => f()); } };
}
export const fail = (msg) => { console.error("FAIL: " + msg); process.exitCode = 1; };
export const ok = (msg) => console.log("ok:   " + msg);
