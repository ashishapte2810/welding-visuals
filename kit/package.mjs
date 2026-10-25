// Delivery variants. Build the figure twice (theme "dark" and "light"), then:
//   hosted(darkHtml, lightHtml, { mode: "white" })  -> pure white, locked light (default for sharing and printing)
//   hosted(darkHtml, lightHtml, { mode: "auto" })   -> follows the viewer's light/dark setting
// Both add phone-safe viewport/safe-area handling. Throws if the expected tokens are missing, so a kit change cannot silently skip them.
const need = (html, token, what) => { if (!html.includes(token)) throw new Error("package.mjs: expected " + what + " not found: " + token.slice(0, 60)); };
const SAFE = "<style>:root{box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}html{scroll-padding-top:env(safe-area-inset-top,0px)}</style>";
const SYNC = "<script>(function(){try{var m=matchMedia('(prefers-color-scheme: dark)');var a=function(){document.body.setAttribute('data-theme',m.matches?'dark':'light')};a();m.addEventListener('change',a)}catch(e){}})();</script>";
export function hosted(darkHtml, lightHtml, { mode = "white" } = {}) {
  const base = mode === "auto" ? darkHtml : lightHtml;
  const vp = '<meta name="viewport" content="width=device-width, initial-scale=1">';
  need(base, vp, "viewport meta");
  need(base, "</style></head>", "head end");
  let out = base.replace(vp, '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">').replace("</style></head>", "</style>" + SAFE + "</head>");
  if (mode === "white") {
    need(out, "--anatomy-page:#f2f2ef;--anatomy-card:#fbfbfa;", "light page/card tokens");
    need(out, "--anatomy-paper:#fbfbfa;", "light paper token");
    out = out.replace("--anatomy-page:#f2f2ef;--anatomy-card:#fbfbfa;", "--anatomy-page:#ffffff;--anatomy-card:#ffffff;").replace("--anatomy-paper:#fbfbfa;", "--anatomy-paper:#ffffff;").replace("</head>", "<style>html{color-scheme:light}</style></head>");
  } else if (mode === "auto") {
    need(out, '<body class="iso" data-theme="dark">', "body tag");
    out = out.replace('<body class="iso" data-theme="dark">', '<body class="iso" data-theme="dark">' + SYNC);
  } else throw new Error("mode must be white or auto");
  return out;
}
