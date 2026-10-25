// Render the current state of a loaded page's figure to PNG with resvg. Approximation: CSS variables and gradients resolve,
// but soft drop-shadow filters are not drawn, so glows look flatter than in a browser. Use for layout checks and video drafts.
import { Resvg } from "@resvg/resvg-js";
export function renderPng(page, { theme = "light", width = 1440 } = {}) {
  const { w, q } = page;
  const css = [...w.document.querySelectorAll("style")].map((s) => s.textContent).join("\n");
  const blocks = (re) => (css.match(re) || ["", ""])[1];
  const dark = blocks(/\.iso\{([\s\S]*?)\n\}/), light = blocks(/\.iso\[data-theme="light"\]\{([\s\S]*?)\n\}/);
  const vars = {};
  for (const [, k, v] of dark.matchAll(/(--[\w-]+):([^;]+);/g)) vars[k] = v.trim();
  if (theme === "light") for (const [, k, v] of light.matchAll(/(--[\w-]+):([^;]+);/g)) vars[k] = v.trim();
  const resolve = (s) => s.replace(/var\((--[\w-]+)(?:,[^)]*)?\)/g, (_, k) => vars[k] ?? "#888");
  let style = css.replace(/\.iso\{[\s\S]*?\n\}/, "").replace(/\.iso\[data-theme="light"\]\{[\s\S]*?\n\}/, "");
  style = resolve(style).replace(/color-mix\(in srgb,\s*([^,]+?)\s+calc\([^)]*\),\s*([^)]+)\)/g, "$2").replace(/filter:[^;}]*drop-shadow[^;}]*[;]?/g, "").replace(/@media[^{]*\{[^}]*\}\s*\}?/g, "");
  let svg = resolve(q(".tg-fig").outerHTML).replace("<svg", '<svg style="font-family:monospace"').replace(/>/, `><style>${style}</style><rect width="960" height="640" fill="${vars["--anatomy-card"] || "#fff"}"/>`);
  return new Resvg(svg, { fitTo: { mode: "width", value: width }, font: { loadSystemFonts: true, defaultFontFamily: "DejaVu Sans Mono" } }).render().asPng();
}
